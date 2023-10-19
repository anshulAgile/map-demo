import React, { useEffect } from "react";
import { getGrid, getGridCell, GRID_CLICK_EVENT, randomString } from "./calc";

/** @typedef {import('maplibre-gl').Map} Map */
/** @typedef {import('maplibre-gl').GeoJSONSource} GeoJSONSource */
/** @typedef {import('maplibre-gl').LngLatBounds} LngLatBounds */
/** @typedef {import('maplibre-gl').MapMouseEvent} MapMouseEvent */
/** @typedef {import('@turf/helpers').Units} Units */
/** @typedef {import('./grid').GridConfig} GridConfig */
/** @typedef {import('./grid').GridClickEvent} GridClickEvent */

function Grid(props) {
  // Extract props
  const { config } = props;

  // Create a unique ID for the grid
  const gridId = `grid-${randomString()}`;

  useEffect(() => {
    let map;
    let onMapClickBound;
    let updateBound;

    // Initialize the grid when the component mounts
    const initializeGrid = () => {
      // Initialize Map object (Replace with your Map initialization logic)
      map = new Map({
        container: gridId,
        // Add your Map options here
      });

      // Add grid layer and update when the map is ready
      map.on("load", update);
      map.on("move", update);

      // Handle map click events
      onMapClickBound = onMapClick.bind(null, map);
      map.on("click", onMapClickBound);

      // Update the grid if the map is already loaded
      if (map.loaded()) {
        update();
      }
    };

    // Update the grid based on the current map state
    const update = () => {
      if (!map) return;

      let grid = [];
      if (active) {
        grid = getGrid(bbox, config.gridWidth, config.gridHeight, config.units);
      }

      const source = map.getSource(gridId);
      if (!source) {
        map.addSource(gridId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: grid },
        });
        map.addLayer({
          id: gridId,
          source: gridId,
          type: "line",
          paint: config.paint ?? {},
        });
      } else {
        source.setData({ type: "FeatureCollection", features: grid });
      }
    };

    // Check if the grid should be active based on zoom levels
    const active = () => {
      if (!map) return false;

      const minZoom = config.minZoom ?? 0;
      const maxZoom = config.maxZoom ?? 22;
      const zoom = map.getZoom();

      return minZoom <= zoom && zoom < maxZoom;
    };

    // Calculate the bounding box of the grid cell for a given point
    const getGridCellForPoint = (point) => {
      if (!map) {
        throw new Error("Invalid state");
      }

      const bounds = map.getBounds();
      if (bounds.getEast() - bounds.getWest() >= 360) {
        bounds.setNorthEast([bounds.getWest() + 360, bounds.getNorth()]);
      }

      const bbox = bounds.toArray().flat();
      return getGridCell(
        point,
        config.gridWidth,
        config.gridWidth,
        config.units
      );
    };

    // Handle map click events
    const onMapClick = (map, event) => {
      if (!map || !active()) return;

      const point = event.lngLat.toArray();
      const bbox = getGridCellForPoint(point);

      const gridClickEvent = { bbox };
      map.fire(GRID_CLICK_EVENT, gridClickEvent);
    };

    // Initialize the grid component
    initializeGrid();

    // Cleanup when the component unmounts
    return () => {
      if (map) {
        map.off("load", updateBound);
        map.off("move", updateBound);
        map.off("click", onMapClickBound);
      }
    };
  }, [bbox, config, gridId]);

  // Calculate the bounding box based on map bounds
  const bbox = () => {
    // Replace with your logic to calculate the bounding box based on map bounds
  };

  return <div id={gridId} style={{ width: "100%", height: "100%" }}></div>;
}

export default Grid;
