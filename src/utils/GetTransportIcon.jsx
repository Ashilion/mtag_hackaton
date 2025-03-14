// Function to get icon component based on transport mode
import {Bike, Bus, Car, Footprints, Train} from "lucide-react";
import React from "react";

export const getTransportIcon = (mode) => {
    switch (mode) {
        case "TRAM":
            return <Train className="h-4 w-4 mr-1"/>;
        case "BUS":
            return <Bus className="h-4 w-4 mr-1"/>;
        case "BICYCLE":
            return <Bike className="h-4 w-4 mr-1"/>;
        case "WALK":
            return <Footprints className="h-4 w-4 mr-1"/>;
        case "CAR":
            return <Car className="h-4 w-4 mr-1"/>;
        default:
            return null;
    }
};