// Function to get color based on transport mode
export const getRouteColor = (mode) => {
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