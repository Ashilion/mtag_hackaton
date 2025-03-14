// Centers the map on the user's location
import {useMap} from "react-leaflet";
import {useEffect} from "react";

export function SetViewOnUser({center}) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.setView(center, 15);
        }
    }, [center, map]);

    return null;
}