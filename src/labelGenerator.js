export function labelGenerator(inputLat, inputLong) {
    let northBorder = 90.0;
    let southBorder = -90.0;
    let eastBorder = 180.0;
    let westBorder = -180.0;
    const noOfLevels = 9;
    const numOfLinesPerLevel = 7;
    const noOfGridLines = 200;

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
    let VA = [];
    for (let i = 0; i < northLatPtsForTurfList.length; i++) {
        const pair = [
            northLatPtsForTurfList[i]?.reverse(),
            southLatPtsForTurfList[i]?.reverse(),
        ];
        VA.push(pair)
    }
    const uniqueArrayVA = [...new Set(VA)];

    let HA = [];
    // console.log("___________________________________________________");
    for (let i = 0; i < westLongPtsForTurfList.length; i++) {
        const pair = [
            westLongPtsForTurfList[i]?.reverse(),
            eastLongPtsForTurfList[i]?.reverse(),
        ];
        HA.push(pair);
    }
    const uniqueArrayHA = [...new Set(HA)];

    return b36CodeString;
}