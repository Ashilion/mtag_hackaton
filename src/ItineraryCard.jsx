// Component to display itinerary details
import React, {useState} from "react";
import {Card, CardContent} from "@/components/ui/card.jsx";
import {Badge} from "@/components/ui/badge.jsx";
import {Button} from "@/components/ui/button.jsx";
import {Info} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.jsx";
import {Separator} from "@/components/ui/separator.jsx";
import {getRouteColor} from "@/utils/GetRouteColor.jsx";
import {getTransportIcon} from "@/utils/GetTransportIcon.jsx";

export const ItineraryCard = ({itinerary, index, isActive, carbonFootprint, carCarbonFootprint}) => {
    const [showDetails, setShowDetails] = useState(false);

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

    const formatDateTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    };

    // Calculate total distance from all legs
    const totalDistance = itinerary.legs.reduce((sum, leg) => sum + leg.distance, 0);

    // Find the primary mode for this itinerary (non-walking if possible)
    const primaryMode = itinerary.legs.find(leg => leg.mode !== "WALK")?.mode || itinerary.legs[0].mode;

    return (
        <>
            <Card className={`mb-2 ${isActive ? 'border-2 border-primary' : ''}`}>
                <CardContent className="">
                    <div className="flex justify-between items-center">
                        <Badge variant={isActive ? "default" : "outline"} className="mb-2">Route {index + 1}</Badge>
                        <div className="flex items-center">
                            {getTransportIcon(primaryMode)}
                            <Badge variant="secondary">{primaryMode}</Badge>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center flex-col">
                            <p className="text-lg font-semibold">{formatTime(itinerary.duration)}</p>
                            <p className="text-sm text-gray-600">{formatDistance(totalDistance)}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering parent click event
                                setShowDetails(true);
                            }}
                        >
                            <Info/>
                        </Button>
                    </div>
                    <div className="flex mt-2 text-xs text-gray-500 gap-2">
                        <p>Depart: {formatDateTime(itinerary.startTime)} </p>
                        <p className="ml-auto">Arrive: {formatDateTime(itinerary.endTime)}</p>
                    </div>

                </CardContent>
            </Card>

            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Route {index + 1} Details</DialogTitle>
                        <DialogDescription>
                            Total journey: {formatTime(itinerary.duration)} - {formatDistance(totalDistance)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex justify-between text-sm font-medium">
                            <div>
                                <p className="font-bold">Carbon Footprint</p>
                                <p className="text-teal-500">{carbonFootprint}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">If it was by car</p>
                                <p className="text-orange-300">{carCarbonFootprint}</p>
                            </div>
                        </div>
                        <Separator/>
                        <div className="flex justify-between text-sm font-medium">
                            <div>
                                <p className="font-bold">Departure</p>
                                <p>{formatDateTime(itinerary.startTime)}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">Arrival</p>
                                <p>{formatDateTime(itinerary.endTime)}</p>
                            </div>
                        </div>

                        <Separator/>

                        <div className="space-y-4">
                            {itinerary.legs.map((leg, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                                             style={{backgroundColor: getRouteColor(leg.mode,leg.routeColor) + '20'}}>
                                            {getTransportIcon(leg.mode)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold flex items-center">
                                                {getTransportIcon(leg.mode)}
                                                {leg.mode === "TRAM" || leg.mode === "BUS"
                                                    ? `${leg.mode} ${leg.routeShortName || ''}`
                                                    : leg.mode}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatTime(leg.duration)} - {formatDistance(leg.distance)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pl-10 space-y-1 text-sm">
                                        <div className="flex">
                                            <div className="w-16 text-gray-500">
                                                {formatDateTime(leg.startTime)}
                                            </div>
                                            <div className="font-medium">
                                                {leg.from ? leg.from.name : "Starting point"}
                                            </div>
                                        </div>

                                        {leg.intermediateStops && leg.intermediateStops.length > 0 && (
                                            <div className="pl-16 space-y-1">
                                                {leg.intermediateStops.map((stop, stopIdx) => (
                                                    <div key={stopIdx} className="text-xs text-gray-500">
                                                        {stop.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex">
                                            <div className="w-16 text-gray-500">
                                                {formatDateTime(leg.endTime)}
                                            </div>
                                            <div className="font-medium">
                                                {leg.to ? leg.to.name : "Destination"}
                                            </div>
                                        </div>
                                    </div>

                                    {idx < itinerary.legs.length - 1 && (
                                        <div className="pl-4 py-1">
                                            <div className="border-l-2 border-dashed border-gray-300 h-6 ml-4"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setShowDetails(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};