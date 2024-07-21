// Store API endpoint
let url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// Get the earthquake data from the API then call createFeatures
d3.json(url).then(function (data) {
	createFeatures(data.features);
});

function createFeatures(earthquakeData) {
	// Define a function to create a popup that descripes the earthquake 
  	function onEachFeature(feature, layer) {
    	layer.bindPopup(`
    		<h3>${feature.properties.place}</h3>
    		<hr>
    		<p>${new Date(feature.properties.time)}</p>
    		<p><strong>Magnitude:</strong> ${feature.properties.mag}</p>
    		<p><strong>Depth:</strong> ${feature.geometry.coordinates[2]} km</p>
    		`);
  	}
  	
  	// Define a function to set the marker style
  	function markerStyle(feature) {
  		return {
  			radius: markerSize(feature.properties.mag),
  			fillColor: markerColor(feature.geometry.coordinates[2]),
  			color: "#000",
  			weight: .5,
  			fillOpacity: 0.8
  		};
  	}

  	// Define a function to set the marker size
  	function markerSize(magnitude) {
  		return Math.sqrt(magnitude) * 6;
  	}

  	// Create the earthquake markers layer from the features array 
  	let earthquakes = L.geoJSON(earthquakeData, {
  		pointToLayer: function(feature, latlng) {
  			return L.circleMarker(latlng);
  		},
  		style: markerStyle, 
    	// Run onEachFeature for each feature
    	onEachFeature: onEachFeature
  	});

  	// Send our earthquakes layer to the createMap function/
  	createMap(earthquakes);
}

// Define a function to set the marker color
function markerColor(depth) {
	return depth > 90 ? "#FF0000" :
  		   depth > 70 ? "#FF4500" :
  		   depth > 50 ? "#FFA500" :
  		   depth > 30 ? "#FFD700" :
  		   depth > 10 ? "#ADFF2F" :
  						"#00FF00" ;
}

function createPlates() {
	// Store the plates url
	let platesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";
	// Get the plate data from the json file
	return d3.json(platesUrl).then(function(platesData) {
		// Creating a GeoJSON layer with the retrieved data
		return L.geoJson(platesData);
	});
}

function createMap(earthquakes) {
	// Create the title layer variables for the background maps
  	let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  	})
	let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
	});

	let satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    	attribution: '&copy; <a href="https://www.esri.com">ESRI</a> contributors'
	});

	// create the map object
	let map = L.map("map", {
		center: [39.8283, -98.5795],
		zoom: 4,
		layers: [topo, earthquakes]
	});

	// Create baseMaps object for base layers
	let baseMaps = {
		"Street Map": street,
		"Topo Map": topo,
		"Satellite": satellite
	};

	// Create the plates layer
	createPlates().then(function(platesLayer) {
		// Create overlayMaps object for the earthquakes layer
		let overlayMaps = {
			"Eathquake Locations": earthquakes,
			"Tectonic Plates": platesLayer
		};

		// Create a layer control, and pass it baseMaps and overlayMaps. Add the layer control to the map
		L.control.layers(baseMaps, overlayMaps, {
			collapsed: false,
		}).addTo(map);

		// Add the plates layer to the map
		platesLayer.addTo(map);
	});

	// Create a legend key for earthquake magnitude colors
	let legend = L.control({ position: "bottomright" });

	// Create a <div> container for the legend
  	legend.onAdd = function(map) {
    	let div = L.DomUtil.create("div", "info legend"),
        	// Define the depth intervals to be represented in the legend
        	grades = [0, 10, 30, 50, 70, 90],
        	// Create an empty array for the labels for each depth range
        	labels = [];
        
        // Add a legend title
        div.innerHTML += '<h4>Earthquake Depth</h4>'

    	// Loop through density intervals and generate a label with a colored square for each interval
    	for (let i = 0; i < grades.length; i++) {
      		div.innerHTML +=
        		'<i style="background:' + markerColor(grades[i] + 1) + '"></i> ' +
        	grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    	}

    	return div;
  	};
  	// Add the legend to the map
  	legend.addTo(map);
}
