import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import distance from "@turf/distance";
import { getGrid } from "./calc"; // Create a file named 'calc.js' with the 'getGrid' function
import * as turf from "@turf/turf";
function GridComponent() {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [code, setCode] = useState(null);
  const [latlng, setlatlng] = useState({});
  const [VERTICAL, setVERTICAL] = useState([]);
  console.log('VERTICAL: ', VERTICAL);
  const [HORIZONTAL, setHORIZONTAL] = useState([]);
  console.log('HORIZONTAL: ', HORIZONTAL);

  function geohash_encode_uniqueCode(inputLat, inputLong) {
    let northBorder = 90.0;
    let southBorder = -90.0;
    let eastBorder = 180.0;
    let westBorder = -180.0;
    const noOfLevels = 9;
    const numOfLinesPerLevel = 7;
    const noOfGridLines = 5;

    const base36List = [...Array(10).keys()]
      .map((i) => i.toString())
      .concat([...Array(26).keys()].map((i) => String.fromCharCode(65 + i)));

    // console.log("base36List: ", base36List);

    // console.log("\n++++++++++++ GPS TO LABEL ++++++++++++", inputLat, inputLong);

    inputLat = inputLat * 1.0;
    inputLong = inputLong * 1.0;
    const inputCoord = [inputLat, inputLong];

    // console.log("\nInput GPS coordinate: ", inputCoord);

    const b36Code = [];
    const midPointList = [];

    // Check if the lat input is a number (including numbers with .00 decimals), if yes, add a small value to avoid floating point issues
    if (Number.isInteger(inputLat)) {
      if (inputLat >= 90.0) {
        inputLat = 90 - 0.000001;
      } else if (inputLat <= -90.0) {
        inputLat = -90 + 0.000001;
      } else {
        inputLat = inputLat + 0.000001;
      }
    }

    // Check if the long input is a number (including numbers with .00 decimals), if yes, add a small value to avoid floating point issues
    if (Number.isInteger(inputLong)) {
      if (inputLong >= 180.0) {
        inputLong = 180 - 0.000001;
      } else if (inputLong <= -180.0) {
        inputLong = -180 + 0.000001;
      } else {
        inputLong = inputLong + 0.000001;
      }
    }

    // console.log("\nInput GPS coordinate: ", inputLat, inputLong);

    for (let levelIndex = 0; levelIndex < noOfLevels; levelIndex++) {
      // Calculate the step size
      const latStepSize =
        (northBorder - southBorder) / (numOfLinesPerLevel - 1);
      const longStepSize = (eastBorder - westBorder) / (numOfLinesPerLevel - 1);

      // Initialize arrays to store the latitude and longitude values
      const latList = [];
      const longList = [];

      // console.log("\n latStepSize: ", latStepSize);
      // console.log("\n longStepSize: ", longStepSize);

      // Generate the latitude and longitude values
      for (let i = 0; i < numOfLinesPerLevel; i++) {
        const latitude = southBorder + i * latStepSize;
        latList.push(latitude);
        const longitude = westBorder + i * longStepSize;
        longList.push(longitude);
      }

      // console.log("BEFORE REVERSE: ", latList);
      // Inverse the list
      latList.reverse();

      // console.log("AFTER REVERSE: ", latList);

      // Create an object to represent the DataFrame
      const dfBorder = {};

      // Fill in the DataFrame with obtained lat and long
      for (const i of latList) {
        for (const j of longList) {
          dfBorder[`${i},${j}`] = `${i},${j}`;
        }
      }

      // console.log("dfBorder: ", dfBorder);

      // Finding midpoint of all grids of a given lat, long at this level
      // Initialize new arrays to store the midpoints in this level
      const latListMid = [];
      const longListMid = [];

      // Calculate the midpoint of adjacent latitudes
      for (let i = 0; i < latList.length - 1; i++) {
        const midpoint = (latList[i] + latList[i + 1]) / 2.0;
        latListMid.push(midpoint);
      }

      // Calculate the midpoint of adjacent longitudes
      for (let i = 0; i < longList.length - 1; i++) {
        const midpoint = (longList[i] + longList[i + 1]) / 2.0;
        longListMid.push(midpoint);
      }

      // console.log("\n latListMid: ", latListMid);
      // console.log("\n longListMid: ", longListMid);

      // Create an object to represent the DataFrame
      const dfMid = {};

      // Fill in the DataFrame with sample data (you can replace this with your own data)
      for (const i of latListMid) {
        for (const j of longListMid) {
          dfMid[`${i},${j}`] = `${i},${j}`;
        }
      }

      // console.log("DataFrameMID: ", dfMid);

      const midValues = Object.values(dfMid);

      // console.log("midValues: ", midValues);

      // Initialize variables to store the closest pair and its index
      let closestIndex = null;
      let closestPair = null;
      let distance = Number.POSITIVE_INFINITY; // Initialize with positive infinity
      let closestDistance = Number.POSITIVE_INFINITY; // Initialize with positive infinity

      // Iterate through the list and compare each pair
      for (let index = 0; index < midValues.length; index++) {
        // Split the string into individual elements and convert them to floats
        const midPair = midValues[index].split(",").map(parseFloat);

        // Calculate the Euclidean distance between the input pair and the current pair
        distance = Math.sqrt(
          Math.pow(inputLat - midPair[0], 2) +
          Math.pow(inputLong - midPair[1], 2)
        );

        // Check if the current pair is closer than the previous closest pair
        if (distance < closestDistance) {
          closestPair = midPair;
          closestDistance = distance;
          closestIndex = index;
        }
      }

      // console.log("closestIndex: ", closestIndex);
      // Print the closest pair and its index
      b36Code.push(closestIndex);

      // Finding borders of a given lat, long
      // Initialize variables to track - North / South / East / West Borders of this level
      northBorder = null;
      southBorder = null;
      westBorder = null;
      eastBorder = null;
      let minDifferenceLess = Number.POSITIVE_INFINITY; // Initialize with positive infinity
      let minDifferenceGreater = Number.POSITIVE_INFINITY; // Initialize with positive infinity

      // Compare the given number to all elements in the list
      for (const element of latList) {
        const difference = inputLat - element;

        // Check if the current element is closer than the previous closest less and greater elements
        if (0 < difference && difference < minDifferenceGreater) {
          southBorder = element;
          minDifferenceGreater = difference;
        } else if (difference < 0 && Math.abs(difference) < minDifferenceLess) {
          northBorder = element;
          minDifferenceLess = Math.abs(difference);
        }
      }

      minDifferenceLess = Number.POSITIVE_INFINITY; // Initialize with positive infinity
      minDifferenceGreater = Number.POSITIVE_INFINITY; // Initialize with positive infinity

      // Compare the given number to all elements in the list
      for (const element of longList) {
        const difference = inputLong - element;

        // Check if the current element is closer than the previous closest less and greater elements
        if (0 < difference && difference < minDifferenceGreater) {
          westBorder = element;
          minDifferenceGreater = difference;
        } else if (difference < 0 && Math.abs(difference) < minDifferenceLess) {
          eastBorder = element;
          minDifferenceLess = Math.abs(difference);
        }
      }

      midPointList.push(closestPair);
    }

    // console.log(
    //   `\nOutput coordinates for the given coordinate: ${
    //     midPointList[noOfLevels - 1]
    //   }\n`
    // );

    const finalB36Code = [];

    // Use the index values to access and print data values
    for (const index of b36Code) {
      if (index < base36List.length) {
        finalB36Code.push(base36List[index]);
      } else {
        // console.log(`Index ${index} is out of range.`);
      }
    }

    const b36CodeString = finalB36Code.join("");
    // console.log("Output Label: ", b36CodeString);
    // }

    let dLat = northBorder - southBorder;
    let dLong = westBorder - eastBorder;
    let fakeGridLatList = [];

    for (let i = 0; i < noOfGridLines; i++) {
      northBorder -= dLat;
      fakeGridLatList.push(northBorder);
    }

    fakeGridLatList.reverse();

    for (let i = 0; i < noOfGridLines; i++) {
      southBorder += dLat;
      fakeGridLatList.push(southBorder);
    }

    fakeGridLatList.reverse();

    let fakeGridLongList = [];

    for (let i = 0; i < noOfGridLines; i++) {
      westBorder -= dLong;
      fakeGridLongList.push(westBorder);
    }

    fakeGridLongList.reverse();

    for (let i = 0; i < noOfGridLines; i++) {
      eastBorder += dLong;
      fakeGridLongList.push(eastBorder);
    }

    fakeGridLongList.reverse();

    for (let i = 0; i < fakeGridLatList.length; i++) {
      if (fakeGridLatList[i] > 90) {
        while (fakeGridLatList[i] > 90) {
          fakeGridLatList[i] -= 180;
        }
      } else if (fakeGridLatList[i] < -90) {
        while (fakeGridLatList[i] < -90) {
          fakeGridLatList[i] += 180;
        }
      }
    }

    for (let i = 0; i < fakeGridLongList.length; i++) {
      if (fakeGridLongList[i] > 180) {
        while (fakeGridLongList[i] > 180) {
          fakeGridLongList[i] -= 360;
        }
      } else if (fakeGridLongList[i] < -180) {
        while (fakeGridLongList[i] < -180) {
          fakeGridLongList[i] += 360;
        }
      }
    }

    const latListFirst = fakeGridLatList[0];
    const latListLast = fakeGridLatList[fakeGridLatList.length - 1];
    const longListFirst = fakeGridLongList[0];
    const longListLast = fakeGridLongList[fakeGridLongList.length - 1];

    const northLatPtsForTurfList = fakeGridLongList.map((long) => [
      latListFirst,
      long,
    ]);
    const southLatPtsForTurfList = fakeGridLongList.map((long) => [
      latListLast,
      long,
    ]);
    const westLongPtsForTurfList = fakeGridLatList.map((lat) => [
      lat,
      longListFirst,
    ]);
    const eastLongPtsForTurfList = fakeGridLatList.map((lat) => [
      lat,
      longListLast,
    ]);

    // Original
    for (let i = 0; i < northLatPtsForTurfList.length; i++) {
      const pair = [northLatPtsForTurfList[i]?.reverse(), southLatPtsForTurfList[i]?.reverse()];
      console.log(JSON.stringify(pair) + ",");
      setVERTICAL((prev) => [...prev, pair])

    }
    console.log("___________________________________________________");
    for (let i = 0; i < westLongPtsForTurfList.length; i++) {
      console.log('westLongPtsForTurfList: ', westLongPtsForTurfList[i]);
      const pair = [westLongPtsForTurfList[i]?.reverse(), eastLongPtsForTurfList[i]?.reverse()];
      console.log(JSON.stringify(pair) + ",");
      setHORIZONTAL((prev) => [...prev, pair])

    }

    return b36CodeString;
  }

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
      console.log(mapInstance.getBounds().getCenter());
    });

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  const vertical = [
    [
      [72.58475151463188, 23.033729138088702],
      [72.58459076360313, 23.033729138088702],
    ],
    [
      [72.58475151463188, 23.03376486053955],
      [72.58459076360313, 23.03376486053955],
    ],
    [
      [72.58475151463188, 23.033800582990395],
      [72.58459076360313, 23.033800582990395],
    ],
    [
      [72.58475151463188, 23.03383630544124],
      [72.58459076360313, 23.03383630544124],
    ],
    [
      [72.58475151463188, 23.033872027892087],
      [72.58459076360313, 23.033872027892087],
    ],
    [
      [72.58475151463188, 23.033907750342934],
      [72.58459076360313, 23.033907750342934],
    ],
    [
      [72.58475151463188, 23.03394347279378],
      [72.58459076360313, 23.03394347279378],
    ],
    [
      [72.58475151463188, 23.033979195244626],
      [72.58459076360313, 23.033979195244626],
    ],
    [
      [72.58475151463188, 23.034014917695472],
      [72.58459076360313, 23.034014917695472],
    ],
    [
      [72.58475151463188, 23.03405064014632],
      [72.58459076360313, 23.03405064014632],
    ],
  ];

  const horizontal = [
    [
      [72.58475151463188, 23.033729138088702],
      [72.58475151463188, 23.03405064014632],
    ],
    [
      [72.58473365340646, 23.033729138088702],
      [72.58473365340646, 23.03405064014632],
    ],
    [
      [72.58471579218104, 23.033729138088702],
      [72.58471579218104, 23.03405064014632],
    ],
    [
      [72.58469793095563, 23.033729138088702],
      [72.58469793095563, 23.03405064014632],
    ],
    [
      [72.58468006973021, 23.033729138088702],
      [72.58468006973021, 23.03405064014632],
    ],
    [
      [72.5846622085048, 23.033729138088702],
      [72.5846622085048, 23.03405064014632],
    ],
    [
      [72.58464434727938, 23.033729138088702],
      [72.58464434727938, 23.03405064014632],
    ],
    [
      [72.58462648605396, 23.033729138088702],
      [72.58462648605396, 23.03405064014632],
    ],
    [
      [72.58460862482855, 23.033729138088702],
      [72.58460862482855, 23.03405064014632],
    ],
    [
      [72.58459076360313, 23.033729138088702],
      [72.58459076360313, 23.03405064014632],
    ],
  ];



  useEffect(() => {
    console.log("HEREEEEEEEEE", VERTICAL?.length);

    if (map && HORIZONTAL?.length) {
      console.log("HEREEEEEEEEE", VERTICAL);
      console.log(map.getBounds());

      const horiArray = [];
      HORIZONTAL.map((coo) => {
        horiArray.push({
          id: Math.random(),
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coo,
          },
        });
      });
      const verArray = [];
      VERTICAL.map((coo) => {
        verArray.push({
          id: Math.random(),
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coo,
          },
        });
      });
      console.log('verArray: ', verArray);

      var line = turf.lineString([
        [
          [
            72.56615797896669,
            23.0289780521262
          ],
          [
            72.56647948102417,
            23.0289780521262
          ]
        ],
        [
          [
            72.56615797896669,
            23.02881730109739
          ],
          [
            72.56647948102417,
            23.02881730109739
          ]
        ]
      ]);
      var splitter = turf.lineString([[130.12312, -15], [130, -35]]);

      var split = turf.lineSplit(line, splitter);

      // Create a FeatureCollection containing both lines
      const lines = turf.featureCollection([...horiArray, ...verArray]);

      // Add the lines FeatureCollection to the map as a source
      map.addSource("lines", {
        type: "geojson",
        data: lines,
      });

      // Customize the layer styles for the lines
      map.addLayer({
        id: `lines-layer-${Math.random()}`,
        type: "line",
        source: "lines",
        layout: {},
        paint: {
          "line-color": "blue",
          "line-width": 3,
        },
      });
    }
    if (map) {
      map.on("click", (e) => {
        console.log(e);
        setlatlng({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        const geocode = geohash_encode_uniqueCode(e.lngLat.lat, e.lngLat.lng);
        console.log('geocode: ', geocode);
        setCode(geocode);
      });
    }
  }, [map, HORIZONTAL, VERTICAL]);

  return (
    <div>
      code : {code}
      <p>lat : {latlng?.lat}</p>
      <p>lng : {latlng?.lng}</p>
      <div
        id="mapContainer"
        ref={mapContainerRef}
        style={{ width: "100%", height: "100vh" }}
      />
    </div>
  );
}

export default GridComponent;
