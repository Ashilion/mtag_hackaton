import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import polyline from "@mapbox/polyline"; // For decoding OTP's polyline
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from "@/components/ui/select.jsx"
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Import ToggleGroup
import { Bike, Footprints } from "lucide-react"; // Import icons for bike and walk

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

const GrenobleMap = () => {
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [route, setRoute] = useState([]);
    const [travelTime, setTravelTime] = useState(null); // In seconds
    const [distance, setDistance] = useState(null); // In meters
    const [walkSpeed, setWalkSpeed] = useState(4.8); // Default walk speed in km/h
    const [bikeSpeed, setBikeSpeed] = useState(15); // Default bike speed in km/h
    const [speedUnit, setSpeedUnit] = useState("km/h"); // Default unit
    const [transportMode, setTransportMode] = useState("WALK"); // Default transport mode
    const position = [45.1885, 5.7245]; // Grenoble center

    // Fetch itinerary when start, end, walkSpeed, bikeSpeed, or transportMode changes
    useEffect(() => {
        if (start && end) {
            const fetchItinerary = async () => {
                try {
                    const speedInMps =
                        transportMode === "WALK"
                            ? (speedUnit === "km/h" ? walkSpeed / 3.6 : (1000 / walkSpeed) / 60)
                            : bikeSpeed / 3.6; // Convert km/h to m/s for bike

                    const response = await fetch(
                        `https://data.mobilites-m.fr/api/routers/default/plan?fromPlace=${start[0]},${start[1]}&toPlace=${end[0]},${end[1]}&mode=${transportMode}&date=2025-03-13&time=08:00:00&walkSpeed=${speedInMps}&bikeSpeed=${speedInMps}`
                    );
                    const data = await response.json();
                    if (data.plan && data.plan.itineraries.length > 0) {
                        const itinerary = data.plan.itineraries[0]; // Take the first itinerary
                        const legGeometry = itinerary.legs.map((leg) => leg.legGeometry.points);
                        const decodedRoute = legGeometry.map((points) => polyline.decode(points));
                        setRoute(decodedRoute.flat());

                        // Extract time and distance
                        setTravelTime(itinerary.duration);
                        setDistance(itinerary.legs.reduce((sum, leg) => sum + leg.distance, 0));
                    }
                } catch (error) {
                    console.error("Error fetching itinerary:", error);
                }
            };
            fetchItinerary();
        }
    }, [start, end, walkSpeed, bikeSpeed, speedUnit, transportMode]);

    const resetMarkers = () => {
        setStart(null);
        setEnd(null);
        setRoute([]);
        setTravelTime(null);
        setDistance(null);
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

    return (
        <div className="relative h-[100vh] w-[100vw]">
            <MapContainer center={position} zoom={13} className="h-full w-full">
                <TileLayer
                    // attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <LocationMarkers setStart={setStart} setEnd={setEnd} start={start} end={end} />
                {route.length > 0 && <Polyline positions={route} color="blue" />}
            </MapContainer>
            <div className="absolute bottom-5 left-5 z-[1000] bg-gray-50 rounded-lg shadow p-4">
                <div className="flex items-center">
                    <ToggleGroup
                        type="single"
                        value={transportMode}
                        onValueChange={handleTransportModeChange}
                        size={"xl"}
                    >
                        <ToggleGroupItem value="WALK" aria-label="Toggle walk">
                            <Footprints className="h-16 w-16" /> {/* Walk icon */}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="BICYCLE" aria-label="Toggle bike"   >
                            <Bike  className="h-16 w-16"/> {/* Bike  icon */}
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
                <p>Start: {start ? `${start[0].toFixed(4)}, ${start[1].toFixed(4)}` : "Not set"}</p>
                <p>End: {end ? `${end[0].toFixed(4)}, ${end[1].toFixed(4)}` : "Not set"}</p>
                <p>Travel Time: {formatTime(travelTime)}</p>
                <p>Distance: {formatDistance(distance)}</p>
                <div className="flex items-center mt-4">
                    <Input
                        type="number"
                        step="0.1"
                        min={transportMode === "WALK" ? (speedUnit === "km/h" ? "0.1" : "4") : "0.1"}
                        max={transportMode === "WALK" ? (speedUnit === "km/h" ? "36" : "20") : "36"}
                        value={transportMode === "WALK" ? walkSpeed.toFixed(1) : bikeSpeed.toFixed(1)}
                        onChange={handleSpeedChange}
                        className="mr-4 w-24"
                    />
                    {transportMode === "WALK" ? (
                        <Select value={speedUnit} onValueChange={handleSpeedUnitChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="km/h">km/h</SelectItem>
                                <SelectItem value="min/km">min/km</SelectItem>
                            </SelectContent>
                        </Select>
                    ):
                        <p className="text-sm px-6">km/h</p>
                    }
                </div>

                <Button onClick={resetMarkers} className="mt-4" disabled={!start && !end}>
                    Reset Markers
                </Button>
            </div>
        </div>
    );
};

export default GrenobleMap;