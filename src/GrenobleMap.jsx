import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import polyline from "@mapbox/polyline"; // For decoding OTP's polyline
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from "@/components/ui/select.jsx"
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Bike, Footprints, Train, ArrowLeft, ArrowRight, Bus, Car, Navigation, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// Custom icons
const startIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const endIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const currentLocationIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// Function to get color based on transport mode
const getRouteColor = (mode) => {
    switch (mode) {
        case "TRAM":
            return "red"; // Tram routes in red
        case "BUS":
            return "orange"; // Bus routes in orange
        case "BICYCLE":
            return "green"; // Bike routes in green
        case "WALK":
            return "blue"; // Walking routes in blue
        case "CAR":
            return "gray"; // Car routes in gray
        default:
            return "purple"; // Other transport modes in purple
    }
};

// Function to get icon component based on transport mode
const getTransportIcon = (mode) => {
    switch (mode) {
        case "TRAM":
            return <Train className="h-4 w-4 mr-1" />;
        case "BUS":
            return <Bus className="h-4 w-4 mr-1" />;
        case "BICYCLE":
            return <Bike className="h-4 w-4 mr-1" />;
        case "WALK":
            return <Footprints className="h-4 w-4 mr-1" />;
        case "CAR":
            return <Car className="h-4 w-4 mr-1" />;
        default:
            return null;
    }
};

// Centers the map on the user's location
function SetViewOnUser({ center }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.setView(center, 15);
        }
    }, [center, map]);

    return null;
}

function LocationMarkers({ setStart, setEnd, start, end }) {
    useMapEvents({
        click(e) {
            if (!start) {
                setStart([e.latlng.lat, e.latlng.lng]);
            } else if (!end) {
                setEnd([e.latlng.lat, e.latlng.lng]);
            }
        },
    });

    return (
        <>
            {start && (
                <Marker position={start} icon={startIcon}>
                    <Popup>Start Location</Popup>
                </Marker>
            )}
            {end && (
                <Marker position={end} icon={endIcon}>
                    <Popup>End Location</Popup>
                </Marker>
            )}
        </>
    );
}

// Component to display itinerary details
const ItineraryCard = ({ itinerary, index, isActive }) => {
    const formatTime = (seconds) => {
        if (!seconds) return "Not set";
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
    };

    const formatDistance = (meters) => {
        if (!meters) return "Not set";
        return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters.toFixed(0)} m`;
    };

    // Calculate total distance from all legs
    const totalDistance = itinerary.legs.reduce((sum, leg) => sum + leg.distance, 0);

    // Find the primary mode for this itinerary (non-walking if possible)
    const primaryMode = itinerary.legs.find(leg => leg.mode !== "WALK")?.mode || itinerary.legs[0].mode;

    return (
        <Card className={`mb-2 ${isActive ? 'border-2 border-primary' : ''}`}>
            <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                    <Badge variant={isActive ? "default" : "outline"} className="mb-2">Route {index + 1}</Badge>
                    <div className="flex items-center">
                        {getTransportIcon(primaryMode)}
                        <Badge variant="secondary">{primaryMode}</Badge>
                    </div>
                </div>
                <p className="text-lg font-semibold">{formatTime(itinerary.duration)}</p>
                <p className="text-sm text-gray-600">{formatDistance(totalDistance)}</p>
                <div className="flex mt-2 text-xs text-gray-500 gap-2">
                    <p>Depart: {new Date(itinerary.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} </p>
                    <p className="ml-auto">Arrive: {new Date(itinerary.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
            </CardContent>
        </Card>
    );
};

// Component to render route segments with different colors
const ColoredRouteSegments = ({ legs }) => {
    if (!legs || legs.length === 0) return null;

    return (
        <>
            {legs.map((leg, index) => {
                const decodedPoints = polyline.decode(leg.legGeometry.points);
                const color = getRouteColor(leg.mode);
                const key = `leg-${index}-${leg.mode}`;

                return (
                    <Polyline
                        key={key}
                        positions={decodedPoints}
                        color={color}
                        weight={5}
                        opacity={0.8}
                    >
                        <Popup>
                            {leg.mode} {leg.routeShortName ? `- Line ${leg.routeShortName}` : ''}
                            <br />
                            {leg.distance.toFixed(0)}m - {Math.floor(leg.duration / 60)}min
                            {leg.from && leg.to && (
                                <>
                                    <br />
                                    From: {leg.from.name}
                                    <br />
                                    To: {leg.to.name}
                                </>
                            )}
                        </Popup>
                    </Polyline>
                );
            })}
        </>
    );
};

// Function to get display name for transport mode with tram/bus line
const getTransportDisplayName = (leg) => {
    if (leg.mode === "TRAM" || leg.mode === "BUS") {
        return leg.routeShortName ? `${leg.mode} ${leg.routeShortName}` : leg.mode;
    }
    return leg.mode;
};

// Simple notification component instead of toast
const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000); // Auto close after 4 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <Alert className={`mb-2 ${type === 'error' ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
            <AlertCircle className={`h-4 w-4 ${type === 'error' ? 'text-red-500' : 'text-green-500'}`} />
            <AlertTitle className={type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {type === 'error' ? 'Error' : 'Success'}
            </AlertTitle>
            <AlertDescription>
                {message}
            </AlertDescription>
        </Alert>
    );
};

const GrenobleMap = () => {
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [itineraries, setItineraries] = useState([]); // Array of all available itineraries
    const [currentItineraryIndex, setCurrentItineraryIndex] = useState(0); // Current displayed itinerary
    const [walkSpeed, setWalkSpeed] = useState(4.8); // Default walk speed in km/h
    const [bikeSpeed, setBikeSpeed] = useState(15); // Default bike speed in km/h
    const [speedUnit, setSpeedUnit] = useState("km/h"); // Default unit
    const [transportMode, setTransportMode] = useState("TRANSIT"); // Default transport mode
    const position = [45.1885, 5.7245]; // Grenoble center  
    const [mapCenter, setMapCenter] = useState(position);
    const [notification, setNotification] = useState(null);

    // Show notification
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    // Clear notification
    const clearNotification = () => {
        setNotification(null);
    };

    const getGeolocation = () => {
        setLoadingLocation(true);

        if (!navigator.geolocation) {
            showNotification("Geolocation is not supported by your browser", "error");
            setLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentLocation([latitude, longitude]);
                setStart([latitude, longitude]);
                setMapCenter([latitude, longitude]);
                setLoadingLocation(false);

                showNotification("Your location has been set as the starting point");
            },
            (error) => {
                let errorMessage = "Unknown error occurred";
                switch (error.code) {
                    case 1:
                        errorMessage = "Permission denied";
                        break;
                    case 2:
                        errorMessage = "Position unavailable";
                        break;
                    case 3:
                        errorMessage = "Timeout";
                        break;
                }

                showNotification(errorMessage, "error");
                setLoadingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Fetch itinerary when start, end, walkSpeed, bikeSpeed, or transportMode changes
    useEffect(() => {
        if (start && end) {
            const fetchItinerary = async () => {
                try {
                    const speedInMps =
                        transportMode === "WALK" || transportMode === "" || transportMode === "TRAM" || transportMode === "TRANSIT"
                            ? (speedUnit === "km/h" ? walkSpeed / 3.6 : (1000 / walkSpeed) / 60)
                            : bikeSpeed / 3.6; // Convert km/h to m/s for bike
                    const url = `https://data.mobilites-m.fr/api/routers/default/plan?fromPlace=${start[0]},${start[1]}&toPlace=${end[0]},${end[1]}&mode=${transportMode}&date=2025-03-13&time=08:00:00&walkSpeed=${speedInMps}&bikeSpeed=${speedInMps}&numItineraries=3`
                    console.log(url);
                    const response = await fetch(
                        url
                    );
                    const data = await response.json();
                    console.log(data);
                    if (data.plan && data.plan.itineraries.length > 0) {
                        // Store all itineraries
                        setItineraries(data.plan.itineraries.slice(0, 3)); // Get up to 3 itineraries
                        setCurrentItineraryIndex(0); // Reset to first itinerary
                    } else {
                        // Clear itineraries if none found
                        setItineraries([]);
                        showNotification("No routes found for the selected points and transport mode.", "error");
                    }
                } catch (error) {
                    console.error("Error fetching itinerary:", error);
                    showNotification("Failed to fetch route information. Please try again.", "error");
                }
            };
            fetchItinerary();
        }
    }, [start, end, walkSpeed, bikeSpeed, speedUnit, transportMode]);

    const resetMarkers = () => {
        setStart(null);
        setEnd(null);
        setCurrentLocation(null);
        setItineraries([]);
        setCurrentItineraryIndex(0);
        setMapCenter(position);
    };

    const handleSpeedChange = (e) => {
        const value = parseFloat(e.target.value);
        if (transportMode === "WALK") {
            if (speedUnit === "km/h" && value > 0 && value <= 36) {
                setWalkSpeed(value);
            } else if (speedUnit === "min/km" && value > 4 && value <= 20) {
                setWalkSpeed(value);
            }
        } else if (transportMode === "BICYCLE" && value > 0 && value <= 36) {
            setBikeSpeed(value);
        }
    };

    const handleSpeedUnitChange = (value) => {
        if (value === "km/h") {
            setWalkSpeed(60 / walkSpeed); // Convert min/km to km/h
        } else {
            setWalkSpeed(60 / walkSpeed); // Convert km/h to min/km
        }
        setSpeedUnit(value);
    };

    const handleTransportModeChange = (value) => {
        setTransportMode(value);
    };

    const handlePreviousItinerary = () => {
        if (currentItineraryIndex > 0) {
            setCurrentItineraryIndex(currentItineraryIndex - 1);
        }
    };

    const handleNextItinerary = () => {
        if (currentItineraryIndex < itineraries.length - 1) {
            setCurrentItineraryIndex(currentItineraryIndex + 1);
        }
    };

    const selectItinerary = (index) => {
        setCurrentItineraryIndex(index);
    };

    const formatTime = (seconds) => {
        if (!seconds) return "Not set";
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
    };

    const formatDistance = (meters) => {
        if (!meters) return "Not set";
        return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters.toFixed(0)} m`;
    };

    const currentItinerary = itineraries[currentItineraryIndex];

    return (
        <div className="relative h-[100vh] w-[100vw]">
            <MapContainer center={position} zoom={13} className="h-full w-full">
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <LocationMarkers setStart={setStart} setEnd={setEnd} start={start} end={end} />
                <SetViewOnUser center={mapCenter} />

                {/* Render colored route segments instead of a single polyline */}
                {currentItinerary && (
                    <ColoredRouteSegments legs={currentItinerary.legs} />
                )}

            </MapContainer>

            {/* Notification area */}
            {notification && (
                <div className="absolute bottom-5 right-2 transform -translate-x-1/2 z-[2000] w-80">
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={clearNotification}
                    />
                </div>
            )}

            {/* Control panel */}
            <div className="absolute bottom-5 left-5 z-[1000] bg-white rounded-lg shadow p-4 max-w-md">
                <div className="flex items-center mb-4">
                    <ToggleGroup
                        type="single"
                        value={transportMode}
                        onValueChange={handleTransportModeChange}
                    >
                        <ToggleGroupItem value="WALK" aria-label="Toggle walk" className="cursor-pointer">
                            <Footprints className="h-5 w-5" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="BICYCLE" aria-label="Toggle bike" className="cursor-pointer">
                            <Bike className="h-5 w-5" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="TRANSIT" aria-label="Toggle public transportation" className="cursor-pointer">
                            <Train className="h-5 w-5" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
                <Button
                    onClick={getGeolocation}
                    className="flex items-center"
                    disabled={loadingLocation}
                >
                    {loadingLocation ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Navigation className="h-4 w-4 mr-2" />
                    )}
                    {loadingLocation ? "Locating..." : "Use My Location"}
                </Button>
                <div className="mb-4 mt-2">
                    <p>Start: {start ? `${start[0].toFixed(4)}, ${start[1].toFixed(4)}` : "Not set"}</p>
                    <p>End: {end ? `${end[0].toFixed(4)}, ${end[1].toFixed(4)}` : "Not set"}</p>

                    <div className="flex items-center mt-2">
                        <Input
                            type="number"
                            step="0.1"
                            min={transportMode === "WALK" ? (speedUnit === "km/h" ? "0.1" : "4") : "0.1"}
                            max={transportMode === "WALK" ? (speedUnit === "km/h" ? "36" : "20") : "36"}
                            value={transportMode === "WALK" ? walkSpeed.toFixed(1) : bikeSpeed.toFixed(1)}
                            onChange={handleSpeedChange}
                            className="mr-2 w-24"
                        />
                        {transportMode === "WALK" ? (
                            <Select value={speedUnit} onValueChange={handleSpeedUnitChange}>
                                <SelectTrigger className="w-24">
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="km/h">km/h</SelectItem>
                                    <SelectItem value="min/km">min/km</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-sm">km/h</p>
                        )}

                        <Button onClick={resetMarkers} className="ml-auto" disabled={!start && !end}>
                            Reset
                        </Button>
                    </div>
                </div>

                {/* Itineraries section */}
                {itineraries.length > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">Available Routes</h3>
                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handlePreviousItinerary}
                                    disabled={currentItineraryIndex === 0}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleNextItinerary}
                                    disabled={currentItineraryIndex === itineraries.length - 1}
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 overflow-y-auto">
                            {itineraries.map((itinerary, index) => (
                                <div key={index} onClick={() => selectItinerary(index)} className="cursor-pointer">
                                    <ItineraryCard
                                        itinerary={itinerary}
                                        index={index}
                                        isActive={index === currentItineraryIndex}
                                    />
                                </div>
                            ))}
                        </div>

                        {currentItinerary && (
                            <div className="mt-4 pt-2 border-t">
                                <p className="font-medium">Current Route Details:</p>
                                <p>Travel Time: {formatTime(currentItinerary.duration)}</p>
                                <p>Distance: {formatDistance(currentItinerary.legs.reduce((sum, leg) => sum + leg.distance, 0))}</p>

                                <div className="flex flex-wrap gap-1 mt-1 items-center">
                                    <p>Transport: </p>
                                    {currentItinerary.legs.map((leg, idx) => (
                                        <Badge
                                            key={idx}
                                            variant="outline"
                                            className="ml-1 flex items-center"
                                            style={{
                                                backgroundColor: getRouteColor(leg.mode) + '20',
                                                borderColor: getRouteColor(leg.mode)
                                            }}
                                        >
                                            {getTransportIcon(leg.mode)}
                                            {getTransportDisplayName(leg)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrenobleMap;