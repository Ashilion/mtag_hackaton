# Grenoble Map with Itinerary Planner

This project is a React-based web application that allows users to plan itineraries in Grenoble, France. Users can set start and end points on a map, choose between walking and biking modes, and view the travel time and distance. The application uses the OpenTripPlanner (OTP) API to fetch route data and displays it on an interactive map powered by Leaflet.

## Features

- **Interactive Map**: Set start and end points by clicking on the map.
- **Transport Modes**: Choose between walking and biking.
- **Speed Settings**:
    - For walking: Set speed in km/h or min/km.
    - For biking: Set speed in km/h.
- **Route Visualization**: Displays the route as a blue polyline on the map.
- **Travel Information**: Shows travel time and distance for the selected route.
- **Reset Functionality**: Clear markers and reset the map.

## Technologies Used

- **React**: Frontend library for building the user interface.
- **Leaflet**: JavaScript library for interactive maps.
- **MTAG API**: Fetches route data for the selected start and end points.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Shadcn UI**: Easy to use ui.
- **Lucide Icons**: Provides icons for walking and biking modes.

## Usage

1. **Set Start and End Points**:
    - Click on the map to set the start point.
    - Click again to set the end point.

2. **Choose Transport Mode**:
    - Use the toggle buttons to switch between walking and biking.

3. **Adjust Speed**:
    - For walking, set the speed in km/h or min/km.
    - For biking, set the speed in km/h.

4. **View Route**:
    - The route will be displayed as a blue polyline on the map.
    - Travel time and distance will be shown below the map.

5. **Reset**:
    - Click the "Reset Markers" button to clear the map and start over.