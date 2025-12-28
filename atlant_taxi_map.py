# Change map style
atlanta_map = folium.Map(
    location=[33.7490, -84.3880],
    zoom_start=12,
    tiles='Stamen Terrain',  # Different map style
    width='100%',
    height='90%'
)

# Add different colored markers for different fare ranges
for trip in taxi_trips:
    if trip['fare'] > 20:
        color = "red"
    elif trip['fare'] > 10:
        color = "orange"
    else:
        color = "green"
    
    folium.Marker(
        location=trip["location"],
        popup=f"Fare: ${trip['fare']}",
        icon=folium.Icon(color=color, icon="car")
    ).add_to(atlanta_map)

