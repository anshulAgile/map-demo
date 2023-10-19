import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import * as turf from "@turf/turf";
import Grid from "./Grid";
// mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_MAP_TOKEN;
mapboxgl.accessToken =
  "pk.eyJ1IjoidGVtaXZhZDUyOCIsImEiOiJjbG1vcHZwcDcwbmQyMmtxZ2swbzRpcDg3In0.TXygp4-Xx5L0mApEDJ-DFw";
const base36 = [
  ["0", "1", "2", "3", "4", "5"],
  ["6", "7", "8", "9", "A", "B"],
  ["C", "D", "E", "F", "G", "H"],
  ["I", "J", "K", "L", "M", "N"],
  ["O", "P", "Q", "R", "S", "T"],
  ["U", "V", "W", "X", "Y", "Z"],
];
const GEOHASH_MATRIX_SIDE = 6;

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(18);

  const [gridCoordinates, setGridCoordinates] = useState({});
  const [gridCenterPoints, setGridCenterPoints] = useState({
    centerLat: 0,
    centerLng: 0,
  });
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [72.585022, 23.033863],
      zoom: zoom,
    });
    if (map.current !== null) {
      const initialBounds = map.current.getBounds();
      console.log("initialBounds: ", initialBounds);
      const initialNE = initialBounds.getNorthEast();
      console.log("initialNE: ", initialNE);
      const initialSW = initialBounds.getSouthWest();

      const createGrid = () => {
        const cellSide = 0.002; // Adjust as needed

        const grid = turf.squareGrid(
          [initialSW.lng, initialSW.lat, initialNE.lng, initialNE.lat],
          cellSide,
          { units: "kilometers" }
        );
        // Set all features to highlighted == 'No'

        for (let i = 0; i < grid.features.length; i++) {
          grid.features[i].properties.highlighted = "No";
          grid.features[i].properties.id = i;
        }

        return grid;
      };

      map.current.on("load", () => {
        const grid = createGrid();

        map.current.addSource("grid-source", {
          type: "geojson",
          data: grid,
          generateId: true,
        });
        map.current.addLayer({
          id: "grid-layer",
          type: "fill",
          source: "grid-source",
          paint: {
            "fill-outline-color": "rgba(0,0,0,0.1)",
            "fill-color": "rgba(0,0,0,0.1)",
          },
        });
        map.current.addLayer({
          id: "grid-layer-highlighted",
          type: "fill",
          source: "grid-source",
          paint: {
            "fill-outline-color": "#484896",
            "fill-color": "#6e599f",
            "fill-opacity": 0.5,
          },
          //'filter': ['==', ['get', 'highlighted'], 'Yes']
          filter: ["==", ["get", "id"], -1],
        });

        map.current.on("zoom", () => {
          setZoom(parseInt(map.current.getZoom()));
          console.log("map.current.getZoom(): ", map.current.getZoom());
        });
        map.current.on("moveend", () => {
          console.log("mouse move");
          const updatedGrid = createGrid();
          console.log("updatedGrid: ", updatedGrid);

          // Update the source data with the new grid
          map.current.getSource("grid-source").setData(updatedGrid);
        });

        //click action
        map.current.on("click", "grid-layer", function (e) {
          let selectIndex = e.features[0].id;
          grid.features[e.features[0].id].properties.highlighted = "Yes";
          e.features[0].properties.highlighted = "Yes";

          const filter = ["==", ["number", ["get", "id"]], selectIndex];

          map.current.setFilter("grid-layer-highlighted", filter);
          const selectedTile = e.features[0];
          const tileCorners = getTileCorners(selectedTile);
          setGridCoordinates({
            TopLeft: tileCorners[0],
            TopRight: tileCorners[1],
            BottomLeft: tileCorners[2],
            BottomRight: tileCorners[3],
          });
          setGridCenterPoints({
            centerLat:
              (tileCorners[0][0] +
                tileCorners[1][0] +
                tileCorners[2][0] +
                tileCorners[3][0]) /
              4,
            centerLng:
              (tileCorners[0][1] +
                tileCorners[1][1] +
                tileCorners[2][1] +
                tileCorners[3][1]) /
              4,
          });
        });
      });
    }
    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, []);
  useEffect(() => {
    console.log("gridCoordinates", gridCoordinates);
    console.log("gridCenterPoints", gridCenterPoints);
    const generateCode = geohash36_encode(
      gridCenterPoints?.centerLat,
      gridCenterPoints?.centerLng,
      9
    );
    setGeneratedCode(generateCode);
  }, [gridCoordinates]);
  function getTileCorners(tile) {
    const bbox = turf.bbox(tile);
    const coordinates = [];

    // Extract the corner coordinates
    const topLeft = [bbox[0], bbox[1]];
    const topRight = [bbox[2], bbox[1]];
    const bottomLeft = [bbox[0], bbox[3]];
    const bottomRight = [bbox[2], bbox[3]];

    coordinates.push(topLeft, topRight, bottomLeft, bottomRight);

    return coordinates;
  }
  function geohash36_encode(latitude_, longitude_, numCharacters_) {
    let lat = [-90.0, 90.0];
    let lon = [-180.0, 180.0];
    let latIdx = 0,
      longIdx = 0;
    let slice;
    let outBuffer = "";

    while (numCharacters_ > 0) {
      slice = Math.abs(lon[0] - lon[1]) / GEOHASH_MATRIX_SIDE;

      for (let i = 0; i < GEOHASH_MATRIX_SIDE; i++) {
        const leftBoundary = lon[0] + i * slice;
        const rightBoundary = lon[0] + (i + 1) * slice;

        if (longitude_ > leftBoundary && longitude_ <= rightBoundary) {
          longIdx = i;
          lon[0] = leftBoundary;
          lon[1] = rightBoundary;
          break;
        }
      }

      slice = Math.abs(lat[0] - lat[1]) / GEOHASH_MATRIX_SIDE;

      for (let i = 0; i < GEOHASH_MATRIX_SIDE; i++) {
        const leftBoundary = lat[0] + i * slice;
        const rightBoundary = lat[0] + (i + 1) * slice;

        if (latitude_ > leftBoundary && latitude_ <= rightBoundary) {
          latIdx = GEOHASH_MATRIX_SIDE - 1 - i;
          lat[0] = leftBoundary;
          lat[1] = rightBoundary;
          break;
        }
      }

      outBuffer += base36[latIdx][longIdx];
      latIdx = 0;
      longIdx = 0;
      numCharacters_--;
    }

    return outBuffer;
  }
  return (
    <div>
      {map.current && (
        <Grid map={map.current} config={{ gridWidth: 100, gridHeight: 100 }} />
      )}
      {/* <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom} | Code:{" "}
        {generatedCode} | centerLat : {gridCenterPoints?.centerLat} | centerLng
        : {gridCenterPoints?.centerLng}
      </div>
      <div
        ref={mapContainer}
        className="map-container"
        style={{ height: "100vh" }}
      /> */}
    </div>
  );
}

// import { useEffect, useRef, useState } from "react";
// import mapboxgl from "mapbox-gl";
// import * as turf from "@turf/turf";
// import * as React from "react";

// mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_MAP_TOKEN;

// const base36 = [
//   ["0", "1", "2", "3", "4", "5"],
//   ["6", "7", "8", "9", "A", "B"],
//   ["C", "D", "E", "F", "G", "H"],
//   ["I", "J", "K", "L", "M", "N"],
//   ["O", "P", "Q", "R", "S", "T"],
//   ["U", "V", "W", "X", "Y", "Z"],
// ];
// const GEOHASH_MATRIX_SIDE = 6;

// const Home = () => {
//   const mapContainer = useRef(null);
//   const map = useRef(null);

//   const [zoom, setZoom] = useState(18);
//   const [gridCoordinates, setGridCoordinates] = useState({});
//   const [gridCenterPoints, setGridCenterPoints] = useState({
//     centerLat: 0,
//     centerLng: 0,
//   });
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
//     setGeneratedCode(generateCode);
//   }, [gridCoordinates]);
//   useEffect(() => {
//     if (map.current) return;
//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: "mapbox://styles/mapbox/streets-v12",
//       center: [72.585022, 23.033863],
//       zoom: zoom,
//       scrollZoom: true,
//     });
//     console.log("map loaded");
//     if (map.current !== null) {
//       const initialBounds = map.current.getBounds();
//       const initialNE = initialBounds.getNorthEast();
//       const initialSW = initialBounds.getSouthWest();

//       const createGrid = () => {
//         const cellSide = 0.002; // Adjust as needed

//         const grid = turf.squareGrid(
//           [initialSW.lng, initialSW.lat, initialNE.lng, initialNE.lat],
//           cellSide,
//           { units: "kilometers" }
//         );
//         // Set all features to highlighted == 'No'

//         for (let i = 0; i < grid.features.length; i++) {
//           grid.features[i].properties.highlighted = "No";
//           grid.features[i].properties.id = i;
//         }

//         return grid;
//       };

//       map.current.on("load", () => {
//         const grid = createGrid();

//         map.current.addSource("grid-source", {
//           type: "geojson",
//           data: grid,
//           generateId: true,
//         });
//         map.current.addLayer({
//           id: "grid-layer",
//           type: "fill",
//           source: "grid-source",
//           paint: {
//             "fill-outline-color": "rgba(0,0,0,0.1)",
//             "fill-color": "rgba(0,0,0,0.1)",
//           },
//         });
//         map.current.addLayer({
//           id: "grid-layer-highlighted",
//           type: "fill",
//           source: "grid-source",
//           paint: {
//             "fill-outline-color": "#484896",
//             "fill-color": "#6e599f",
//             "fill-opacity": 0.5,
//           },
//           //'filter': ['==', ['get', 'highlighted'], 'Yes']
//           filter: ["==", ["get", "id"], -1],
//         });

//         map.current.on("zoom", () => {
//           setZoom(parseInt(map.current.getZoom()));
//           console.log("map.current.getZoom(): ", map.current.getZoom());
//         });
//         map.current.on("moveend", () => {
//           console.log("mouse move");
//           const updatedGrid = createGrid();
//           console.log("updatedGrid: ", updatedGrid);

//           // Update the source data with the new grid
//           map.current.getSource("grid-source").setData(updatedGrid);
//         });

//         //click action
//         map.current.on("click", "grid-layer", function (e) {
//           let selectIndex = e.features[0].id;
//           grid.features[e.features[0].id].properties.highlighted = "Yes";
//           e.features[0].properties.highlighted = "Yes";

//           const filter = ["==", ["number", ["get", "id"]], selectIndex];

//           map.current.setFilter("grid-layer-highlighted", filter);
//           const selectedTile = e.features[0];
//           const tileCorners = getTileCorners(selectedTile);
//           setGridCoordinates({
//             TopLeft: tileCorners[0],
//             TopRight: tileCorners[1],
//             BottomLeft: tileCorners[2],
//             BottomRight: tileCorners[3],
//           });
//           setGridCenterPoints({
//             centerLat:
//               (tileCorners[0][0] +
//                 tileCorners[1][0] +
//                 tileCorners[2][0] +
//                 tileCorners[3][0]) /
//               4,
//             centerLng:
//               (tileCorners[0][1] +
//                 tileCorners[1][1] +
//                 tileCorners[2][1] +
//                 tileCorners[3][1]) /
//               4,
//           });
//         });
//       });
//     }

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
//       <div>{`Zoom :  ${zoom}, Generated Code : ${generatedCode}, Center Latitude : ${gridCenterPoints?.centerLat}, Center Longitude : ${gridCenterPoints?.centerLng}`}</div>

//       <div
//         ref={mapContainer}
//         className="map-container"
//         style={{ height: "100vh" }}
//       />
//     </div>
//   );
// };

// export default Home;
