// import React, { useEffect, useRef } from "react";
// import mapboxgl from "mapbox-gl";
// import { getGrid } from "./calc"; // Create a file named 'calc.js' with the 'getGrid' function
// import worker_script from "./gridWorker";

// function GridComponent() {
//   const mapContainerRef = useRef(null);

//   useEffect(() => {
//     mapboxgl.accessToken =
//       "pk.eyJ1IjoidGVtaXZhZDUyOCIsImEiOiJjbG1vcHZwcDcwbmQyMmtxZ2swbzRpcDg3In0.TXygp4-Xx5L0mApEDJ-DFw"; // Replace with your Mapbox access token

//     const map = new mapboxgl.Map({
//       container: mapContainerRef.current,
//       style: "mapbox://styles/mapbox/streets-v11",
//       center: [0, 0],
//       zoom: 2,
//     });

//     map.on("load", () => {
//       // After the map is loaded, create a grid covering the entire map
//       const bbox = [-180, -90, 180, 90]; // Define the bounding box to cover the entire world
//       const gridWidth = 0.02; // Width of grid lines in degrees
//       const gridHeight = 0.02; // Height of grid lines in degrees
//       const units = "degrees"; // Units for grid parameters

//       const gridWorker = new Worker(worker_script); // Create a Web Worker instance

//       gridWorker.postMessage({ bbox, gridWidth, gridHeight, units });

//       gridWorker.onmessage = (event) => {
//         // Get the grid data from the Web Worker
//         const grid = event.data;

//         // Add the grid features to the map as a source
//         map.addSource("grid", {
//           type: "geojson",
//           data: {
//             type: "FeatureCollection",
//             features: grid,
//           },
//         });

//         // Customize the layer style for the grid
//         map.addLayer({
//           id: "grid-layer",
//           type: "line",
//           source: "grid",
//           layout: {},
//           paint: {
//             "line-color": "gray",
//             "line-width": 1,
//           },
//         });
//       };
//     });

//     return () => {
//       map.remove();
//     };
//   }, []);

//   return (
//     <div>
//       {/* Map container */}
//       <div ref={mapContainerRef} style={{ width: "100%", height: "400px" }} />
//     </div>
//   );
// }

// export default GridComponent;
// import React, { useEffect, useRef, useState } from "react";
// import mapboxgl from "mapbox-gl";
// import * as turf from "@turf/turf";

// mapboxgl.accessToken =
//   "pk.eyJ1IjoidGVtaXZhZDUyOCIsImEiOiJjbG1vcHZwcDcwbmQyMmtxZ2swbzRpcDg3In0.TXygp4-Xx5L0mApEDJ-DFw";

// const base36 = [
//   ["0", "1", "2", "3", "4", "5"],
//   ["6", "7", "8", "9", "A", "B"],
//   ["C", "D", "E", "F", "G", "H"],
//   ["I", "J", "K", "L", "M", "N"],
//   ["O", "P", "Q", "R", "S", "T"],
//   ["U", "V", "W", "X", "Y", "Z"],
// ];
// const GEOHASH_MATRIX_SIDE = 6;

// const GridComponent = () => {
//   const mapContainer = useRef(null);
//   const map = useRef(null);

//   const [zoom, setZoom] = useState(1);
//   const [gridCoordinates, setGridCoordinates] = useState(null);
//   const [gridCenterPoints, setGridCenterPoints] = useState(null);
//   const [generatedCode, setGeneratedCode] = useState("");

//   function getTileCorners(tile) {
//     const bbox = turf.bbox(tile);
//     const coordinates = [];

//     // Extract the corner coordinates
//     const topLeft = [bbox[0], bbox[1]];
//     const topRight = [bbox[2], bbox[1]];
//     const bottomLeft = [bbox[0], bbox[3]];
//     const bottomRight = [bbox[2], bbox[3]];

//     coordinates.push(topLeft, topRight, bottomLeft, bottomRight);

//     return coordinates;
//   }

//   useEffect(() => {
//     console.log("gridCoordinates", gridCoordinates);
//     console.log("gridCenterPoints", gridCenterPoints);
//     const generateCode = geohash36_encode(
//       gridCenterPoints?.centerLat,
//       gridCenterPoints?.centerLng,
//       9
//     );
//     console.log("generateCode: ", generateCode);
//     setGeneratedCode(generateCode);
//   }, [gridCoordinates]);

//   useEffect(() => {
//     if (!map.current) return;
//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: "mapbox://styles/mapbox/streets-v11",
//       center: [72.585022, 23.033863],
//       zoom: zoom,
//       //   minZoom: 17,
//       //   maxZoom: 20,
//       scrollZoom: true,
//     });
//     const createGrid = () => {
//       const cellSide = 20; // Adjust as needed

//       const grid = turf.squareGrid(
//         [-180, -85, 180, 85],
//         cellSide,
//         "kilometers"
//       );

//       // Set all features to highlighted == 'No'
//       for (let i = 0; i < grid.features.length; i++) {
//         grid.features[i].properties.highlighted = "No";
//         grid.features[i].properties.id = i;
//       }
//       if (map.current.getSource("grid-source")) {
//         map.current.removeLayer("grid-layer");
//         map.current.removeLayer("grid-layer-highlighted");
//         map.current.removeSource("grid-source");
//       }

//       // Add the updated grid source and layers
//       map.current.addSource("grid-source", {
//         type: "geojson",
//         data: grid,
//         generateId: true,
//       });
//       map.current.addLayer({
//         id: "grid-layer",
//         type: "fill",
//         source: "grid-source",
//         paint: {
//           "fill-outline-color": "rgba(0,0,0,0.1)",
//           "fill-color": "rgba(0,0,0,0.1)",
//         },
//       });
//       map.current.addLayer({
//         id: "grid-layer-highlighted",
//         type: "fill",
//         source: "grid-source",
//         paint: {
//           "fill-outline-color": "#484896",
//           "fill-color": "#6e599f",
//           "fill-opacity": 0.5,
//         },
//         filter: ["==", ["get", "id"], -1],
//       });

//       return grid;
//     };
//     const updateGrid = () => {
//       const gridSource = map.current.getSource("grid-source");

//       if (gridSource) {
//         console.log("gridSource: ", gridSource);

//         // Get the current map bounds
//         const bounds = map.current.getBounds();

//         // Create a new grid covering the current map bounds
//         const cellSide = 0.1; // Adjust as needed
//         const grid = turf.squareGrid(
//           [
//             bounds.getWest(),
//             bounds.getSouth(),
//             bounds.getEast(),
//             bounds.getNorth(),
//           ],
//           cellSide,
//           "kilometers"
//         );

//         // Set all features to highlighted == 'No'
//         for (let i = 0; i < grid.features.length; i++) {
//           grid.features[i].properties.highlighted = "No";
//           grid.features[i].properties.id = i;
//         }

//         // Update the grid source's data
//         gridSource.setData(grid);
//       }
//     };

//     // Call updateGrid when the map moves or zooms
//     map.current.on("move", () => {
//       console.log("mouse move while dragging");
//       updateGrid();
//     });

//     map.current.on("load", () => {
//       const grid = createGrid();
//       // Function to update the grid on the map

//       map.current.on("zoom", () => {
//         // setZoom(map.current.getZoom());
//         console.log("map.current.getZoom(): ", map.current.getZoom());
//       });

//       // Update the grid data when the map moves
//       map.current.on("drag", () => {
//         console.log("mouse move while dragging");
//         // updateGrid();
//       });

//       // Update the grid data when the map stops moving
//       map.current.on("drag", () => {
//         console.log("mouse move end");
//         if (map.current.getZoom() > 16) {
//           updateGrid();
//         }
//       });
//       map.current.on("click", "grid-layer", function (e) {
//         let selectIndex = e.features[0].id;
//         grid.features[e.features[0].id].properties.highlighted = "Yes";
//         e.features[0].properties.highlighted = "Yes";

//         const filter = ["==", ["number", ["get", "id"]], selectIndex];

//         map.current.setFilter("grid-layer-highlighted", filter);
//         const selectedTile = e.features[0];
//         const tileCorners = getTileCorners(selectedTile);
//         setGridCoordinates({
//           TopLeft: tileCorners[0],
//           TopRight: tileCorners[1],
//           BottomLeft: tileCorners[2],
//           BottomRight: tileCorners[3],
//         });
//         setGridCenterPoints({
//           centerLat:
//             (tileCorners[0][0] +
//               tileCorners[1][0] +
//               tileCorners[2][0] +
//               tileCorners[3][0]) /
//             4,
//           centerLng:
//             (tileCorners[0][1] +
//               tileCorners[1][1] +
//               tileCorners[2][1] +
//               tileCorners[3][1]) /
//             4,
//         });
//       });
//       // Click action

//       // Initial grid update
//       //   updateGrid();
//     });

//     // Clean up on unmount
//     return () => map.current.remove();
//   }, []);

//   function geohash36_encode(latitude_, longitude_, numCharacters_) {
//     let lat = [-90.0, 90.0];
//     let lon = [-180.0, 180.0];
//     let latIdx = 0,
//       longIdx = 0;
//     let slice;
//     let outBuffer = "";

//     while (numCharacters_ > 0) {
//       slice = Math.abs(lon[0] - lon[1]) / GEOHASH_MATRIX_SIDE;

//       for (let i = 0; i < GEOHASH_MATRIX_SIDE; i++) {
//         const leftBoundary = lon[0] + i * slice;
//         const rightBoundary = lon[0] + (i + 1) * slice;

//         if (longitude_ > leftBoundary && longitude_ <= rightBoundary) {
//           longIdx = i;
//           lon[0] = leftBoundary;
//           lon[1] = rightBoundary;
//           break;
//         }
//       }

//       slice = Math.abs(lat[0] - lat[1]) / GEOHASH_MATRIX_SIDE;

//       for (let i = 0; i < GEOHASH_MATRIX_SIDE; i++) {
//         const leftBoundary = lat[0] + i * slice;
//         const rightBoundary = lat[0] + (i + 1) * slice;

//         if (latitude_ > leftBoundary && latitude_ <= rightBoundary) {
//           latIdx = GEOHASH_MATRIX_SIDE - 1 - i;
//           lat[0] = leftBoundary;
//           lat[1] = rightBoundary;
//           break;
//         }
//       }

//       outBuffer += base36[latIdx][longIdx];
//       latIdx = 0;
//       longIdx = 0;
//       numCharacters_--;
//     }

//     return outBuffer;
//   }

//   return (
//     <div>
//       <div>
//         {`${`Zoom : ${parseInt(zoom)},
//           Generated Code : ${generatedCode},
//           Center Latitude : ${gridCenterPoints?.centerLat},
//           Center Longitude : ${gridCenterPoints?.centerLng}
//           `}
//         `}
//       </div>
//       <div ref={mapContainer} style={{ width: "100%", height: "90vh" }} />
//     </div>
//   );
// };

// export default GridComponent;

//****************************************************************************************** */
// import React, { useEffect, useRef, useState } from "react";
// import mapboxgl from "mapbox-gl";
// import * as turf from "@turf/turf";

// mapboxgl.accessToken =
//   "pk.eyJ1IjoidGVtaXZhZDUyOCIsImEiOiJjbG1vcHZwcDcwbmQyMmtxZ2swbzRpcDg3In0.TXygp4-Xx5L0mApEDJ-DFw";

// const base36 = [
//   ["0", "1", "2", "3", "4", "5"],
//   ["6", "7", "8", "9", "A", "B"],
//   ["C", "D", "E", "F", "G", "H"],
//   ["I", "J", "K", "L", "M", "N"],
//   ["O", "P", "Q", "R", "S", "T"],
//   ["U", "V", "W", "X", "Y", "Z"],
// ];
// const GEOHASH_MATRIX_SIDE = 6;
// const GridComponent = () => {
//   const mapContainer = useRef(null);
//   const map = useRef(null);

//   const [zoom, setZoom] = useState(18);
//   const [gridCoordinates, setGridCoordinates] = useState(null);
//   const [gridCenterPoints, setGridCenterPoints] = useState(null);
//   const [generatedCode, setGeneratedCode] = useState("");

//   function getTileCorners(tile) {
//     const bbox = turf.bbox(tile);
//     const coordinates = [];

//     // Extract the corner coordinates
//     const topLeft = [bbox[0], bbox[1]];
//     const topRight = [bbox[2], bbox[1]];
//     const bottomLeft = [bbox[0], bbox[3]];
//     const bottomRight = [bbox[2], bbox[3]];

//     coordinates.push(topLeft, topRight, bottomLeft, bottomRight);

//     return coordinates;
//   }

//   useEffect(() => {
//     console.log("gridCoordinates", gridCoordinates);
//     console.log("gridCenterPoints", gridCenterPoints);
//     const generateCode = geohash36_encode(
//       gridCenterPoints?.centerLat,
//       gridCenterPoints?.centerLng,
//       9
//     );
//     console.log("generateCode: ", generateCode);
//     setGeneratedCode(generateCode);
//   }, [gridCoordinates]);

//   useEffect(() => {
//     if (map.current) return;
//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: "mapbox://styles/mapbox/streets-v11",
//       center: [72.585022, 23.033863],
//       zoom: zoom,
//       scrollZoom: true,
//     });
//     const initialBounds = map.current.getBounds();
//     const initialNE = initialBounds.getNorthEast();
//     const initialSW = initialBounds.getSouthWest();

//     const createGrid = () => {
//       const cellSide = 0.1; // Adjust as needed

//       const grid = turf.squareGrid(
//         [initialSW.lng, initialSW.lat, initialNE.lng, initialNE.lat],
//         cellSide,
//         "kilometers"
//       );
//       // Set all features to highlighted == 'No'
//       for (let i = 0; i < grid.features.length; i++) {
//         grid.features[i].properties.highlighted = "No";
//         grid.features[i].properties.id = i;
//       }

//       return grid;
//     };

//     map.current.on("load", () => {
//       const grid = createGrid();

//       map.current.addSource("grid-source", {
//         type: "geojson",
//         data: grid,
//         generateId: true,
//       });
//       map.current.addLayer({
//         id: "grid-layer",
//         type: "fill",
//         source: "grid-source",
//         paint: {
//           "fill-outline-color": "rgba(0,0,0,0.1)",
//           "fill-color": "rgba(0,0,0,0.1)",
//         },
//       });
//       map.current.addLayer({
//         id: "grid-layer-highlighted",
//         type: "fill",
//         source: "grid-source",
//         paint: {
//           "fill-outline-color": "#484896",
//           "fill-color": "#6e599f",
//           "fill-opacity": 0.5,
//         },
//         //'filter': ['==', ['get', 'highlighted'], 'Yes']
//         filter: ["==", ["get", "id"], -1],
//       });

//       map.current.on("zoom", () => {
//         setZoom(map.current.getZoom());
//         console.log("map.current.getZoom(): ", map.current.getZoom());
//       });
//       map.current.on("move", () => {
//         console.log("mouse move while dragging");
//         const grid = createGrid();

//         // Update the source data with the new grid continuously while dragging
//         map.current.getSource("grid-source").setData(updatedGrid);
//       });

//       map.current.on("moveend", () => {
//         console.log("mouse move end");
//         const updatedGrid = createGrid();

//         // Update the source data with the new grid when dragging ends
//         map.current.getSource("grid-source").setData(updatedGrid);
//       });

//       //click action
//       map.current.on("click", "grid-layer", function (e) {
//         var selectIndex = e.features[0].id;
//         grid.features[e.features[0].id].properties.highlighted = "Yes";
//         e.features[0].properties.highlighted = "Yes";

//         const filter = ["==", ["number", ["get", "id"]], selectIndex];

//         map.current.setFilter("grid-layer-highlighted", filter);
//         const selectedTile = e.features[0];
//         const tileCorners = getTileCorners(selectedTile);
//         setGridCoordinates({
//           TopLeft: tileCorners[0],
//           TopRight: tileCorners[1],
//           BottomLeft: tileCorners[2],
//           BottomRight: tileCorners[3],
//         });
//         setGridCenterPoints({
//           centerLat:
//             (tileCorners[0][0] +
//               tileCorners[1][0] +
//               tileCorners[2][0] +
//               tileCorners[3][0]) /
//             4,
//           centerLng:
//             (tileCorners[0][1] +
//               tileCorners[1][1] +
//               tileCorners[2][1] +
//               tileCorners[3][1]) /
//             4,
//         });
//       });
//     });

//     // Clean up on unmount
//     return () => map.current.remove();
//   }, []);

//   function geohash36_encode(latitude_, longitude_, numCharacters_) {
//     let lat = [-90.0, 90.0];
//     let lon = [-180.0, 180.0];
//     let latIdx = 0,
//       longIdx = 0;
//     let slice;
//     let outBuffer = "";

//     while (numCharacters_ > 0) {
//       slice = Math.abs(lon[0] - lon[1]) / GEOHASH_MATRIX_SIDE;

//       for (let i = 0; i < GEOHASH_MATRIX_SIDE; i++) {
//         const leftBoundary = lon[0] + i * slice;
//         const rightBoundary = lon[0] + (i + 1) * slice;

//         if (longitude_ > leftBoundary && longitude_ <= rightBoundary) {
//           longIdx = i;
//           lon[0] = leftBoundary;
//           lon[1] = rightBoundary;
//           break;
//         }
//       }

//       slice = Math.abs(lat[0] - lat[1]) / GEOHASH_MATRIX_SIDE;

//       for (let i = 0; i < GEOHASH_MATRIX_SIDE; i++) {
//         const leftBoundary = lat[0] + i * slice;
//         const rightBoundary = lat[0] + (i + 1) * slice;

//         if (latitude_ > leftBoundary && latitude_ <= rightBoundary) {
//           latIdx = GEOHASH_MATRIX_SIDE - 1 - i;
//           lat[0] = leftBoundary;
//           lat[1] = rightBoundary;
//           break;
//         }
//       }

//       outBuffer += base36[latIdx][longIdx];
//       latIdx = 0;
//       longIdx = 0;
//       numCharacters_--;
//     }

//     return outBuffer;
//   }

//   return (
//     // <MapWrapper className="mapWrapper">
//     <div>
//       <div>
//         {`${`Zoom : ${parseInt(zoom)},
//           Generated Code : ${generatedCode},
//           Center Latitude : ${gridCenterPoints?.centerLat},
//           Center Longitude : ${gridCenterPoints?.centerLng}
//           `}
//         `}
//       </div>
//       <div ref={mapContainer} style={{ width: "100%", height: "90vh" }} />
//     </div>
//   );
// };

// export default GridComponent;
//****************************************************************************************** */

// import React, { useEffect, useRef } from "react";
// import mapboxgl from "mapbox-gl";
// import distance from "@turf/distance";
// import { getGrid } from "./calc"; // Create a file named 'calc.js' with the 'getGrid' function

// function GridComponent() {
//   const mapContainerRef = useRef(null);

//   useEffect(() => {
//     mapboxgl.accessToken =
//       "pk.eyJ1IjoidGVtaXZhZDUyOCIsImEiOiJjbG1vcHZwcDcwbmQyMmtxZ2swbzRpcDg3In0.TXygp4-Xx5L0mApEDJ-DFw"; // Replace with your Mapbox access token

//     const map = new mapboxgl.Map({
//       container: mapContainerRef.current,
//       style: "mapbox://styles/mapbox/streets-v11",
//       center: [0, 0],
//       zoom: 2,
//       maxBounds: [
//         [-180, -90],
//         [180, 90],
//       ],
//     });

//     map.on("load", () => {
//       // After the map is loaded, create a grid covering the entire map
//       const bbox = [-180, -90, 180, 90]; // Define the bounding box to cover the entire world
//       const gridWidth = 0.005; // Width of grid lines in degrees
//       const gridHeight = 0.005; // Height of grid lines in degrees
//       const units = "degrees"; // Units for grid parameters

//       const grid = getGrid(bbox, gridWidth, gridHeight, units);

//       // Add the grid features to the map as a source
//       map.addSource("grid", {
//         type: "geojson",
//         data: {
//           type: "FeatureCollection",
//           features: grid,
//         },
//       });

//       // Customize the layer style for the grid
//       map.addLayer({
//         id: "grid-layer",
//         type: "line",
//         source: "grid",
//         layout: {},
//         paint: {
//           "line-color": "gray",
//           "line-width": 1,
//         },
//       });
//     });

//     return () => {
//       map.remove();
//     };
//   }, []);

//   return (
//     <div>
//       {/* Map container */}
//       <div ref={mapContainerRef} style={{ width: "100%", height: "90vh" }} />
//     </div>
//   );
// }

// export default GridComponent;

//****************fully working example******************* */

// import React, { useEffect, useRef, useState } from "react";
// import mapboxgl from "mapbox-gl";
// import distance from "@turf/distance";
// import { getGrid } from "./calc"; // Create a file named 'calc.js' with the 'getGrid' function

// function GridComponent() {
//   const mapContainerRef = useRef(null);
//   const [map, setMap] = useState(null);

//   useEffect(() => {
//     mapboxgl.accessToken =
//       "pk.eyJ1IjoidGVtaXZhZDUyOCIsImEiOiJjbG1vcHZwcDcwbmQyMmtxZ2swbzRpcDg3In0.TXygp4-Xx5L0mApEDJ-DFw"; // Replace with your Mapbox access token

//     const mapInstance = new mapboxgl.Map({
//       container: mapContainerRef.current,
//       style: "mapbox://styles/mapbox/streets-v12",
//       center: [0, 0],
//       zoom: 18,
//       maxBounds: [
//         [-180, -90],
//         [180, 90],
//       ],
//     });

//     mapInstance.on("load", () => {
//       setMap(mapInstance);
//     });

//     return () => {
//       if (mapInstance) {
//         mapInstance.remove();
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (map) {
//       // Add a zoom change listener to the map
//       const zoomChangeHandler = () => {
//         if (map.getZoom() > 18) {
//           // Generate the grid when the zoom level is above 15
//           const bbox = map.getBounds();
//           const gridWidth = 0.00002; // Width of grid lines in degrees
//           const gridHeight = 0.00002; // Height of grid lines in degrees
//           const units = "degrees"; // Units for grid parameters

//           const grid = getGrid(
//             [bbox.getWest(), bbox.getSouth(), bbox.getEast(), bbox.getNorth()],
//             gridWidth,
//             gridHeight,
//             units
//           );

//           // Add the grid features to the map as a source
//           if (!map.getSource("grid")) {
//             map.addSource("grid", {
//               type: "geojson",
//               data: {
//                 type: "FeatureCollection",
//                 features: grid,
//               },
//             });

//             // Customize the layer style for the grid
//             map.addLayer({
//               id: "grid-layer",
//               type: "line",
//               source: "grid",
//               layout: {},
//               paint: {
//                 "line-color": "gray",
//                 "line-width": 1,
//               },
//             });
//           } else {
//             // Update the grid source data
//             map.getSource("grid").setData({
//               type: "FeatureCollection",
//               features: grid,
//             });
//           }
//         } else {
//           // Remove the grid layer and source when zoom level is 15 or below
//           if (map.getLayer("grid-layer")) {
//             map.removeLayer("grid-layer");
//           }
//           if (map.getSource("grid")) {
//             map.removeSource("grid");
//           }
//         }
//       };

//       // Add the zoom change listener
//       map.on("zoom", zoomChangeHandler);
//       map.on("moveend", zoomChangeHandler);
//       map.on("click", (e) => {
//         const features = map.queryRenderedFeatures(e.point, {
//           layers: ["grid-layer"],
//         });

//         if (features.length > 0) {
//           // The click occurred within a grid feature
//           const clickedFeature = features[0];
//           // Perform actions based on the clicked feature
//           console.log("Clicked on grid feature:", clickedFeature);
//         }
//       });
//       // Call the zoom change handler once to handle the initial zoom level
//       zoomChangeHandler();
//     }
//   }, [map]);

//   return (
//     <div>
//       {/* Map container */}
//       <div ref={mapContainerRef} style={{ width: "100%", height: "100vh" }} />
//     </div>
//   );
// }

// export default GridComponent;

//****************fully working example******************* */
// import React, { useEffect, useRef, useState } from "react";
// import mapboxgl from "mapbox-gl";
// import distance from "@turf/distance";
// import { getGrid } from "./calc"; // Create a file named 'calc.js' with the 'getGrid' function

// function GridComponent() {
//   const mapContainerRef = useRef(null);
//   const [map, setMap] = useState(null);

//   useEffect(() => {
//     mapboxgl.accessToken =
//       "pk.eyJ1IjoidGVtaXZhZDUyOCIsImEiOiJjbG1vcHZwcDcwbmQyMmtxZ2swbzRpcDg3In0.TXygp4-Xx5L0mApEDJ-DFw"; // Replace with your Mapbox access token

//     const mapInstance = new mapboxgl.Map({
//       container: mapContainerRef.current,
//       style: "mapbox://styles/mapbox/streets-v11",
//       center: [72.585022, 23.033863],
//       zoom: 15,
//       maxBounds: [
//         [-180, -90],
//         [180, 90],
//       ],
//     });

//     mapInstance.on("load", () => {
//       setMap(mapInstance);
//       mapInstance.addSource("background-color-source", {
//         type: "geojson",
//         data: {
//           type: "FeatureCollection",
//           features: [],
//         },
//       });

//       // Create the background color layer
//       mapInstance.addLayer({
//         id: "background-color-layer",
//         type: "fill",
//         source: "background-color-source",
//         layout: {},
//         paint: {
//           "fill-color": "rgba(0, 0, 255, 0.5)",
//         },
//       });
//       mapInstance.on("click", "grid-layer", (e) => {
//         console.log("e: ", e);
//         // const coordinates = map.queryRenderedFeatures(e.point, {
//         //   layers: ["grid-layer"],
//         // })[0].geometry.coordinates;

//         let selectIndex = e.features[0].id;
//         console.log("selectIndex: ", selectIndex);
//         grid.features[e.features[0].id].properties.highlighted = "Yes";
//         e.features[0].properties.highlighted = "Yes";

//         const filter = ["==", ["number", ["get", "id"]], selectIndex];

//         map.setFilter("grid-layer-highlighted", filter);

//         // Calculate the bounding box coordinates
//         const bbox = [
//           Math.min(...coordinates[0]),
//           Math.min(...coordinates[1]),
//           Math.max(...coordinates[0]),
//           Math.max(...coordinates[1]),
//         ];

//         // Do something with the bounding box coordinates
//         console.log("Bounding box coordinates:", bbox);
//         // Update the background color layer feature
//         map.getSource("background-color-source").setData({
//           type: "FeatureCollection",
//           features: [
//             {
//               type: "Feature",
//               geometry: {
//                 type: "Polygon",
//                 coordinates: [[bbox]],
//               },
//               properties: {},
//             },
//           ],
//         });
//         // Get the feature that was clicked
//         const clickedFeature = e.features[0];
//         if (clickedFeature) {
//           // You can access properties of the clicked grid box here
//           const gridProperties = clickedFeature.properties;
//           // Do something with the properties of the clicked grid box
//           console.log("Clicked Grid Box Properties:", gridProperties);
//         }
//       });
//     });

//     return () => {
//       if (mapInstance) {
//         mapInstance.remove();
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (map) {
//       // Add a zoom change listener to the map
//       const zoomChangeHandler = () => {
//         if (map.getZoom() > 15) {
//           // Generate the grid when the zoom level is above 15
//           const bbox = map.getBounds();
//           const gridWidth = 0.0005; // Width of grid lines in degrees
//           const gridHeight = 0.0005; // Height of grid lines in degrees
//           const units = "degrees"; // Units for grid parameters

//           const grid = getGrid(
//             [bbox.getWest(), bbox.getSouth(), bbox.getEast(), bbox.getNorth()],
//             gridWidth,
//             gridHeight,
//             units
//           );

//           // Add the grid features to the map as a source
//           if (!map.getSource("grid")) {
//             map.addSource("grid", {
//               type: "geojson",
//               data: {
//                 type: "FeatureCollection",
//                 features: grid,
//               },
//             });

//             map.addLayer({
//               id: "grid-layer",
//               type: "fill", // Use "fill" for polygons
//               source: "grid",
//               layout: {},
//               paint: {
//                 "fill-color": "gray",
//                 "fill-opacity": 0.5,
//               },
//             });
//             map.addLayer({
//               id: "grid-layer-highlighted",
//               type: "fill",
//               source: "grid",
//               paint: {
//                 "fill-outline-color": "#484896",
//                 "fill-color": "#6e599f",
//                 "fill-opacity": 0.5,
//               },
//               //'filter': ['==', ['get', 'highlighted'], 'Yes']
//               filter: ["==", ["get", "id"], -1],
//             });
//           } else {
//             // Update the grid source data
//             map.getSource("grid").setData({
//               type: "FeatureCollection",
//               features: grid,
//             });
//           }
//           let hoveredGridCellId;
//           map.on("mousemove", "grid-layer", (e) => {
//             if (e.features.length > 0) {
//               if (hoveredGridCellId) {
//                 map.setFeatureState(
//                   { source: "grid", sourceLayer: "", id: hoveredGridCellId },
//                   { hover: false }
//                 );
//               }
//               hoveredGridCellId = e.features[0].id;
//               map.setFeatureState(
//                 { source: "grid", sourceLayer: "", id: hoveredGridCellId },
//                 { hover: true }
//               );
//             }
//           });

//           // Add a mouseleave event listener for the grid layer
//           map.on("mouseleave", "grid-layer", () => {
//             if (hoveredGridCellId) {
//               map.setFeatureState(
//                 { source: "grid", sourceLayer: "", id: hoveredGridCellId },
//                 { hover: false }
//               );
//             }
//             hoveredGridCellId = null;
//           });

//           // Add a click event listener to the map
//           map.on("click", "grid-layer", (e) => {
//             console.log("e: ", e);
//             // const coordinates = map.queryRenderedFeatures(e.point, {
//             //   layers: ["grid-layer"],
//             // })[0].geometry.coordinates;

//             let selectIndex = e.features[0].id;
//             console.log("selectIndex: ", selectIndex);
//             grid.features[e.features[0].id].properties.highlighted = "Yes";
//             e.features[0].properties.highlighted = "Yes";

//             const filter = ["==", ["number", ["get", "id"]], selectIndex];

//             map.setFilter("grid-layer-highlighted", filter);

//             // Calculate the bounding box coordinates
//             const bbox = [
//               Math.min(...coordinates[0]),
//               Math.min(...coordinates[1]),
//               Math.max(...coordinates[0]),
//               Math.max(...coordinates[1]),
//             ];

//             // Do something with the bounding box coordinates
//             console.log("Bounding box coordinates:", bbox);
//             // Update the background color layer feature
//             map.getSource("background-color-source").setData({
//               type: "FeatureCollection",
//               features: [
//                 {
//                   type: "Feature",
//                   geometry: {
//                     type: "Polygon",
//                     coordinates: [[bbox]],
//                   },
//                   properties: {},
//                 },
//               ],
//             });
//             // Get the feature that was clicked
//             const clickedFeature = e.features[0];
//             if (clickedFeature) {
//               // You can access properties of the clicked grid box here
//               const gridProperties = clickedFeature.properties;
//               // Do something with the properties of the clicked grid box
//               console.log("Clicked Grid Box Properties:", gridProperties);
//             }
//           });
//           map.on("mousemove", "grid-layer", (e) => {
//             // Get the coordinates of the grid box
//             const coordinates = map.queryRenderedFeatures(e.point, {
//               layers: ["grid-layer"],
//             });
//             console.log("coordinates: ", coordinates);
//             // [0].geometry.coordinates;

//             // Calculate the bounding box coordinates
//             // const bbox = [
//             //   Math.min(...coordinates[0]),
//             //   Math.min(...coordinates[1]),
//             //   Math.max(...coordinates[0]),
//             //   Math.max(...coordinates[1]),
//             // ];

//             // Do something with the bounding box coordinates
//             // console.log("Bounding box coordinates:", bbox);
//             // Update the background color layer feature
//             // map.getSource("background-color-source").setData({
//             //   type: "FeatureCollection",
//             //   features: [
//             //     {
//             //       type: "Feature",
//             //       geometry: {
//             //         type: "Polygon",
//             //         coordinates: [[bbox]],
//             //       },
//             //       properties: {},
//             //     },
//             //   ],
//             // });
//           });
//         } else {
//           // Remove the grid layer and source when zoom level is 15 or below
//           if (map.getLayer("grid-layer")) {
//             map.removeLayer("grid-layer");
//           }
//           if (map.getSource("grid")) {
//             map.removeSource("grid");
//           }
//         }
//       };

//       // Add the zoom change listener
//       map.on("zoom", zoomChangeHandler);
//       map.on("moveend", zoomChangeHandler);

//       // Call the zoom change handler once to handle the initial zoom level
//       zoomChangeHandler();
//     }
//   }, [map]);

//   return (
//     <div>
//       {/* Map container */}
//       <div ref={mapContainerRef} style={{ width: "100%", height: "90vh" }} />
//     </div>
//   );
// }

// export default GridComponent;

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import distance from "@turf/distance";
import { getGrid } from "./calc"; // Create a file named 'calc.js' with the 'getGrid' function

function GridComponent() {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoidGVtaXZhZDUyOCIsImEiOiJjbG1vcHZwcDcwbmQyMmtxZ2swbzRpcDg3In0.TXygp4-Xx5L0mApEDJ-DFw"; // Replace with your Mapbox access token

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [72.585022, 23.033863],
      zoom: 18,
      maxBounds: [
        [-180, -90],
        [180, 90],
      ],
    });

    mapInstance.on("load", () => {
      setMap(mapInstance);
    });

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (map) {
      // Add a zoom change listener to the map
      const zoomChangeHandler = () => {
        if (map.getZoom() > 18) {
          // Generate the grid when the zoom level is above 15
          const bbox = map.getBounds();
          console.log("bbox: ", bbox);
          const gridWidth = 0.00002; // Width of grid lines in degrees
          const gridHeight = 0.00002; // Height of grid lines in degrees
          const units = "degrees"; // Units for grid parameters

          const grid = getGrid(
            [bbox.getWest(), bbox.getSouth(), bbox.getEast(), bbox.getNorth()],
            gridWidth,
            gridHeight,
            units
          );

          // Add the grid features to the map as a source
          if (!map.getSource("grid")) {
            map.addSource("grid", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: grid,
              },
            });

            // Customize the layer style for the grid
            map.addLayer({
              id: "grid-layer",
              type: "line",
              source: "grid",
              layout: {},
              paint: {
                "line-color": "gray",
                "line-width": 1,
              },
            });
          } else {
            // Update the grid source data
            map.getSource("grid").setData({
              type: "FeatureCollection",
              features: grid,
            });
          }
        } else {
          // Remove the grid layer and source when zoom level is 15 or below
          if (map.getLayer("grid-layer")) {
            map.removeLayer("grid-layer");
          }
          if (map.getSource("grid")) {
            map.removeSource("grid");
          }
        }
      };

      // Add the zoom change listener
      map.on("zoom", zoomChangeHandler);
      map.on("moveend", zoomChangeHandler);
      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["grid-layer"],
        });

        if (features.length > 0) {
          // The click occurred within a grid feature
          const clickedFeature = features[0];
          // Perform actions based on the clicked feature
          console.log("Clicked on grid feature:", clickedFeature);
        }
      });
      // Call the zoom change handler once to handle the initial zoom level
      zoomChangeHandler();
    }
  }, [map]);

  return (
    <div>
      {/* {/ Map container /} */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100vh" }} />
    </div>
  );
}

export default GridComponent;
