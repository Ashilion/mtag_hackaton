import React, {useEffect, useState} from "react";
import {MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents, ZoomControl} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet_zoom.css"
import L from "leaflet";
import polyline from "@mapbox/polyline"; // For decoding OTP's polyline
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.jsx"
import {Button} from "@/components/ui/button";
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group";
import {ArrowLeft, ArrowRight, Bike, Footprints, Loader2, Navigation, Train} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import DateTimeSelector from "./DateTimeSelector";
import {Notification} from "@/Notification.jsx";
import {ItineraryCard} from "@/ItineraryCard.jsx";
import {SearchAdress} from "@/SearchAdress.jsx";
import {startIcon} from "@/assets/StartIcon.jsx";
import {endIcon} from "@/assets/EndIcon.jsx";
import {getRouteColor} from "@/utils/GetRouteColor.jsx";
import {getTransportIcon} from "@/utils/GetTransportIcon.jsx";
import {SetViewOnUser} from "@/utils/SetViewOnUser.jsx";
import {FetchOnMove} from "@/utils/FetchOnMove.jsx"; // Create this as a separate file

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

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

const createTramStopIcon = (color) => {
    // Create a div element with a colored circle
    const tramIcon = L.divIcon({
        className: 'custom-tram-icon',
        html: `<div style="background-color: #${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8]
    });

    return tramIcon;
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

// New component to render tram lines
const TramLines = ({ tramLines, tramLineGeometries }) => {
    if (!tramLines || !tramLineGeometries || Object.keys(tramLineGeometries).length === 0) {
        console.log("no tram line")
        return null;
    }

    return (
        <>
            {tramLines.map((line) => {
                const lineGeometry = tramLineGeometries[line.id];
                if (!lineGeometry) return null;

                // Check if we're dealing with GeoJSON format (MultiLineString) or polyline format
                if (lineGeometry.type === "FeatureCollection") {
                    // Handle GeoJSON format
                    return lineGeometry.features.map((feature, featureIndex) => {
                        if (feature.geometry.type === "MultiLineString") {
                            return feature.geometry.coordinates.map((lineCoords, lineIndex) => {
                                // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
                                const positions = lineCoords.map(coord => [coord[1], coord[0]]);

                                return (
                                    <Polyline
                                        key={`tram-line-${line.id}-feature-${featureIndex}-line-${lineIndex}`}
                                        positions={positions}
                                        color={`#${line.color || '007BFF'}`}
                                        weight={4}
                                        opacity={0.7}
                                        dashArray="5, 10"
                                    >
                                        <Popup>
                                            Tram Line {line.shortName}
                                            <br />
                                            {line.longName || ''}
                                        </Popup>
                                    </Polyline>
                                );
                            });
                        }
                        return null;
                    });
                } else {
                    // Handle original polyline format
                    return lineGeometry.map((geometry, index) => {
                        const decodedPoints = polyline.decode(geometry);

                        return (
                            <Polyline
                                key={`tram-line-${line.id}-${index}`}
                                positions={decodedPoints}
                                color={`#${line.color || '007BFF'}`}
                                weight={4}
                                opacity={0.7}
                                dashArray="5, 10"
                            >
                                <Popup>
                                    Tram Line {line.shortName}
                                    <br />
                                    {line.longName || ''}
                                </Popup>
                            </Polyline>
                        );
                    });
                }
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
    const [viewBox, setViewBox] = useState("");
    const [stopsData, setStopsData] = useState(null);
    const [tramStopsData, setTramStopsData] = useState(null);
    const [tramLines, setTramLines] = useState([]);
    const [tramStops, setTramStops] = useState([]);
    const [loadingTramData, setLoadingTramData] = useState(false);
    const [tramLineGeometries, setTramLineGeometries] = useState({}); // Store tram line geometries
    const [showTramLines, setShowTramLines] = useState(true); // Toggle to show/hide tram lines

    const [departureDateTime, setDepartureDateTime] = useState(new Date());
    // Show notification
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    // Clear notification
    const clearNotification = () => {
        setNotification(null);
    };

    // Handle date and time changes
    const handleDateTimeChange = (dateTime) => {
        setDepartureDateTime(dateTime);
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

    const formatDateForApi = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTimeForApi = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
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

                    // Format date and time for API
                    const formattedDate = formatDateForApi(departureDateTime);
                    const formattedTime = formatTimeForApi(departureDateTime);
                    const url = `https://data.mobilites-m.fr/api/routers/default/plan?fromPlace=${start[0]},${start[1]}&toPlace=${end[0]},${end[1]}&mode=${transportMode}&date=${formattedDate}&time=${formattedTime}&walkSpeed=${speedInMps}&bikeSpeed=${speedInMps}&numItineraries=5`
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
    }, [start, end, walkSpeed, bikeSpeed, speedUnit, transportMode, departureDateTime]);

    // Add this useEffect to fetch tram lines and stops
    useEffect(() => {
        const fetchTramData = async () => {
            setLoadingTramData(true);
            try {
                // First, fetch tram lines
                const linesResponse = await fetch('https://data.mobilites-m.fr/api/routers/default/index/routes?reseaux=TRAM');
                const linesData = await linesResponse.json();
                setTramLines(linesData);

                // Then, fetch stops for each tram line
                const allTramStops = [];
                const lineGeometries = {};

                for (const line of linesData) {
                    try {
                        // Fetch stops for this line
                        const stopsResponse = await fetch(`https://data.mobilites-m.fr/api/routers/default/index/routes/${line.id}/clusters`);
                        const stopsData = await stopsResponse.json();

                        // Add line information to each stop
                        const stopsWithLineInfo = stopsData.map(stop => ({
                            ...stop,
                            properties: {
                                ...stop,
                                tramName: line.shortName,
                                lineId: line.id,
                                lineCode: line.code,
                                lineColor: line.color
                            }
                        }));

                        allTramStops.push(...stopsWithLineInfo);

                        // Fetch geometry for this line in GeoJSON format
                        const patternsResponse = await fetch(`https://data.mobilites-m.fr/api/lines/json?types=ligne&codes=${line.id}`);
                        const patternsData = await patternsResponse.json();
                        lineGeometries[line.id] = patternsData;
                    } catch (error) {
                        console.error(`Error fetching data for tram line ${line.id}:`, error);
                    }
                }

                // Convert to GeoJSON format for stops
                const tramStopsGeoJson = {
                    type: "FeatureCollection",
                    features: allTramStops
                };

                setTramStops(tramStopsGeoJson);
                setTramLineGeometries(lineGeometries);
                setLoadingTramData(false);

            } catch (error) {
                console.error("Error fetching tram data:", error);
                showNotification("Failed to load tram data.", "error");
                setLoadingTramData(false);
            }
        };

        fetchTramData();
    }, []);

    const resetMarkers = () => {
        setStart(null);
        setEnd(null);
        setCurrentLocation(null);
        setItineraries([]);
        setCurrentItineraryIndex(0);
        setMapCenter(position);
    };

    const calculateIfMarkers = () => {
        if(!start) alert("l'adresse de départ n'a pas été trouvée, normalement un point s'affiche automatiquement");
        else if(!end) alert("l'adresse d'arrivée n'a pas été trouvée, normalement un point s'affiche automatiquement");
    }

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

    function useDebounce(value, delay) {
        const [debouncedValue, setDebouncedValue] = useState(value);

        useEffect(() => {
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            return () => {
                clearTimeout(handler);
            };
        }, [value, delay]);

        return debouncedValue;
    }

    const [addressInit, setAddressInit] = useState('');
    const [addressEnd, setAddressEnd] = useState('');
    const debouncedAddressInit = useDebounce(addressInit, 500); // 500ms de délai
    const debouncedAddressEnd = useDebounce(addressEnd, 500); // 500ms de délai

    useEffect(() => {
        if (debouncedAddressInit && viewBox) {
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedAddressInit)}&format=json&limit=1&viewbox=${viewBox}&bounded=1`)
                .then(response => response.json())
                .then(data => {
                    if (data.length > 0) {
                        const lat = parseFloat(data["0"]["lat"]);
                        const lon = parseFloat(data["0"]["lon"]);
                        console.log(lat,lon);
                        setStart([lat, lon]);
                    } else {
                        console.error(`Adresse ${debouncedAddressInit} non trouvée`);
                    }
                })
                .catch(error => console.error('Erreur lors du géocodage:', error));
        }
    }, [debouncedAddressInit, setStart]);

    useEffect(() => {
        if (debouncedAddressEnd && viewBox) {
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedAddressEnd)}&format=json&limit=1&viewbox=${viewBox}&bounded=1`)
                .then(response => response.json())
                .then(data => {
                    if (data.length > 0) {
                        const lat = parseFloat(data["0"]["lat"]);
                        const lon = parseFloat(data["0"]["lon"]);
                        console.log(lat,lon);
                        setEnd([lat, lon]);
                    } else {
                        console.error(`Adresse ${debouncedAddressEnd} non trouvée`);
                    }
                })
                .catch(error => console.error('Erreur lors du géocodage:', error));
        }
    }, [debouncedAddressEnd, setEnd]);

    const toggleTramLines = () => {
        setShowTramLines(!showTramLines);
    };

    return (
        <div className="relative h-[100vh] w-[100vw]">
            <MapContainer zoomControl={false} center={position} zoom={13} className="h-full w-full">
                <FetchOnMove setData={setViewBox}/>
                <ZoomControl position="bottomright"/>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <LocationMarkers setStart={setStart} setEnd={setEnd} start={start} end={end}/>
                <SetViewOnUser center={mapCenter}/>

                {/* Render colored route segments instead of a single polyline */}
                {currentItinerary && (
                    <ColoredRouteSegments legs={currentItinerary.legs}/>
                )}

                {/* Render tram lines */}
                {showTramLines && <TramLines tramLines={tramLines} tramLineGeometries={tramLineGeometries} />}

                {/* Render tram stops */}
                {tramStops.features && tramStops.features.map((stop, index) => {
                    const position = [stop.lat, stop.lon];
                    const properties = stop.properties;
                    const icon = createTramStopIcon(properties.lineColor || '007bff');

                    return (
                        <Marker
                            // key={`tram-stop-${properties.id || index}`}
                            position={position}
                            icon={icon}
                        >
                            <Popup>
                                <div>
                                    <h3 className="font-bold">{properties.name || 'Tram Stop'}</h3>
                                    <p><strong>Line:</strong> {properties.tramName}</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
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

            {/* Toggle for tram lines */}
            <div className="absolute bottom-32 right-5 z-[1000]">
                <Button
                    variant={showTramLines ? "default" : "outline"}
                    onClick={toggleTramLines}
                    disabled={loadingTramData}
                >
                    {loadingTramData ? "Loading Tram Data..." : (showTramLines ? "Hide Tram Lines" : "Show Tram Lines")}
                </Button>
            </div>

            {/* Control panel */}
            <div className="absolute bottom-5 left-5 z-[1000] bg-white rounded-lg shadow p-4 max-w-md">
                <div className="flex items-center mb-4">
                    <ToggleGroup
                        type="single"
                        value={transportMode}
                        onValueChange={handleTransportModeChange}
                    >
                        <ToggleGroupItem value="WALK" aria-label="Toggle walk" className="cursor-pointer">
                            <Footprints className="h-5 w-5"/>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="BICYCLE" aria-label="Toggle bike" className="cursor-pointer">
                            <Bike className="h-5 w-5"/>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="TRANSIT" aria-label="Toggle public transportation"
                                         className="cursor-pointer">
                            <Train className="h-5 w-5"/>
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
                <div className="mb-4">
                    <h3 className="font-medium mb-2">Departure Time</h3>
                    <DateTimeSelector onDateTimeChange={handleDateTimeChange}/>
                </div>
                <Button
                    onClick={getGeolocation}
                    className="flex items-center"
                    disabled={loadingLocation}
                >
                    {loadingLocation ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                    ) : (
                        <Navigation className="h-4 w-4 mr-2"/>
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
                                    <SelectValue placeholder="Select unit"/>
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
                                    <ArrowLeft className="h-4 w-4"/>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleNextItinerary}
                                    disabled={currentItineraryIndex === itineraries.length - 1}
                                >
                                    <ArrowRight className="h-4 w-4"/>
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

                                <div className="flex flex-wrap gap-1 mt-1 items-center max-w-96">
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
            <SearchAdress onChange={(e) => setAddressInit(e.target.value)}
                          onChange1={(e) => setAddressEnd(e.target.value)} onClick={calculateIfMarkers}/>
        </div>
    );
};

export default GrenobleMap;