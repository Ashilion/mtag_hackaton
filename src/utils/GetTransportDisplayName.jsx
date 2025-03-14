// Function to get display name for transport mode with tram/bus line
export const getTransportDisplayName = (leg) => {
    if (leg.mode === "TRAM" || leg.mode === "BUS") {
        return leg.routeShortName ? `${leg.mode} ${leg.routeShortName}` : leg.mode;
    }
    return leg.mode;
};