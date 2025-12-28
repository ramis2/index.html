import folium

# Create map with more options
atlanta_map = folium.Map(
    location=[33.7490, -84.3880],
    zoom_start=13,
    tiles='CartoDB positron',
    control_scale=True
)

# Sample taxi trip locations with more details
taxi_trips = [
    {"location": [33.7510, -84.3890], "trip_id": "T001", "fare": 12.50},
    {"location": [33.7520, -84.3900], "trip_id": "T002", "fare": 8.75},
    {"location": [33.7530, -84.3910], "trip_id": "T003", "fare": 15.20}
]

# Add enhanced markers
for trip in taxi_trips:
    folium.Marker(
        location=trip["location"],
        popup=f"Trip: {trip['trip_id']}<br>Fare: ${trip['fare']}",
        tooltip=f"Taxi Trip {trip['trip_id']}",
        icon=folium.Icon(color="green", icon="taxi", prefix="fa")
    ).add_to(atlanta_map)  # NOTE: This should be ) not }

# Add a title/legend
title_html = '''
<div style="position: fixed;
    top: 10px; left: 50px; width: 300px;
    background-color: white; padding: 10px;
    border: 2px solid grey; z-index: 9999; font-size: 14px">
    <b>Atlanta Taxi Trips</b><br>
    Green markers show taxi pickup locations
</div>
'''
atlanta_map.get_root().html.add_child(folium.Element(title_html))

# Save map
atlanta_map.save('atlanta_taxi_trips_enhanced.html')
print("Enhanced map saved as 'atlanta_taxi_trips_enhanced.html'")
