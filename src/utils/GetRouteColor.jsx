// Function to get color based on transport mode
export const getRouteColor = (mode, routeColor) => {
    // If routeColor is available, use it
    if (routeColor) {
        return `#${routeColor}`;
    }

    // Fallback colors if routeColor is not available
    switch (mode) {
        case "TRAM":
            return "#CC0000"; // Default red for trams
        case "BUS":
            return "#FF6600"; // Bus routes in orange
        case "BICYCLE":
            return "#00CC00"; // Bike routes in green
        case "WALK":
            return "#0066FF"; // Walking routes in blue
        case "CAR":
            return "#666666"; // Car routes in gray
        default:
            return "#990099"; // Other transport modes in purple
    }
};