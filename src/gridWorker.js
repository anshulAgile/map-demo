// gridWorker.js

const workercode = () => {
  onmessage = function (e) {
    const { gridSize } = e.data;

    // Generate the grid data
    const grid = calculateGrid(gridSize);

    // Send the generated grid back to the main thread
    postMessage(grid);
  };
  function calculateGrid(params) {
    if (params) {
      const { bbox, gridWidth, gridHeight, units } = params;

      // Your grid calculation logic goes here
      // For this example, we'll create a simple grid covering the given bbox

      const grid = [];
      for (let lon = bbox[0]; lon <= bbox[2]; lon += gridWidth) {
        for (let lat = bbox[1]; lat <= bbox[3]; lat += gridHeight) {
          grid.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [lon, lat],
                  [lon + gridWidth, lat],
                  [lon + gridWidth, lat + gridHeight],
                  [lon, lat + gridHeight],
                  [lon, lat],
                ],
              ],
            },
            properties: {},
          });
        }
      }

      return grid;
    }
  }
  // function generateGrid(gridSize) {
  //   const grid = {
  //     type: "FeatureCollection",
  //     features: [],
  //   };

  //   // Generate grid lines for latitude (horizontal)
  //   for (let lat = -90; lat <= 90; lat += gridSize) {
  //     const coordinates = [
  //       [-180, lat],
  //       [180, lat],
  //     ];
  //     const feature = {
  //       type: "Feature",
  //       geometry: {
  //         type: "LineString",
  //         coordinates,
  //       },
  //     };
  //     grid.features.push(feature);
  //   }

  //   // Generate grid lines for longitude (vertical)
  //   for (let lon = -180; lon <= 180; lon += gridSize) {
  //     const coordinates = [
  //       [lon, -90],
  //       [lon, 90],
  //     ];
  //     const feature = {
  //       type: "Feature",
  //       geometry: {
  //         type: "LineString",
  //         coordinates,
  //       },
  //     };
  //     grid.features.push(feature);
  //   }

  //   return grid;
  // }
};
let code = workercode.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

const blob = new Blob([code], { type: "application/javascript" });
const worker_script = URL.createObjectURL(blob);

module.exports = worker_script;
