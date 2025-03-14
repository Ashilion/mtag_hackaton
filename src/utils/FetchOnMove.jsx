import {useMap} from "react-leaflet";
import {useEffect} from "react";

export const FetchOnMove = ({setData}) => {
    const map = useMap();

    useEffect(() => {
        const fetchDataInViewbox = () => {
            const bounds = map.getBounds();
            const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
            console.log(bbox);
            setData(bbox);
        };

        map.whenReady(() => {
            fetchDataInViewbox();
        });

        map.on("moveend", fetchDataInViewbox);
        map.on("zoomend", fetchDataInViewbox);

        return () => {
            map.off("moveend", fetchDataInViewbox);
            map.off("zoomend", fetchDataInViewbox);
        };
    }, [map, setData]);
    return null;
};