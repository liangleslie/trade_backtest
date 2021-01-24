function parseCSV(csv) {
        var lineArray = csv.split('\n'); /*1st separator*/
        var line = lineArray.length;
        while(line--)
        {
            if(lineArray[line] !== "")
                lineArray[line] = lineArray[line].split(','); /*2nd separator*/
            else
                lineArray.splice(line,1);
        }
    return lineArray;
};

function transpose(original) {
    var copy = [];
    for (var i = 0; i < original.length; ++i) {
        for (var j = 0; j < original[i].length; ++j) {
            // skip undefined values to preserve sparse array
            if (original[i][j] === undefined) continue;
            // create row if it doesn't exist yet
            if (copy[j] === undefined) copy[j] = [];
            // swap the x and y coords for the copy
            copy[j][i] = original[i][j];
        }
    }
    return copy;
}

// function to compute indicators using input parameters
function computeIndicators(rawIndicatorObj, inputObj) {
    var indicatorObj;
    indicatorObj["Date"] = rawIndicatorObj["Date"]
    indicatorObj["Momentum"] = computeMomentum(rawIndicatorObj["Momentum"], inputObj["momentum_entry_periods"],inputObj["momentum_exit_periods"]);
    indicatorObj["High Low"] = computeHighLow(rawIndicatorObj["High Low"], inputObj["high_low_entry"],inputObj["high_low_exit"]);
    indicatorObj["Inflation"] = computeInflation(rawIndicatorObj["Inflation"], inputObj["inflation_entry"], inputObj["inflation_exit"]);
    indicatorObj["Unemployment"] = computeUnemployment(rawIndicatorObj["Unemployement"], inputObj["unemployment_entry"], inputObj["unemployment_exit"]);
    indicatorObj["Vix"] = computeVix(rawIndicatorObj["Vix"], inputObj["vix_ratio_sma"], inputObj["vix_threshold"]);
    return indicatorObj;
}

function computeMomentum(rawIndicatorArray, entryPeriods, exitPeriods) {
    var computedIndicatorArray = rawIndicatorArray.map((x, i, array) => {
      try {
        let entrySmaArray = array.slice(i-entryPeriods+1,i+1);
        let entrySma = entrySmaArray.reduce((a,b) => a+parseFloat(b), 0) / entryPeriods;
        let exitSmaArray = array.slice(i-exitPeriods+1,i+1);
        let exitSma = exitSmaArray.reduce((a,b) => a+parseFloat(b), 0) / exitPeriods;
        return entrySma;
//        return x < entrySma ? 0 :
//                x > exitSma ? 1 : 3 // temp holder for periods with no change
        
      } catch (e) {
        console.log(e);
        return 1
      }
    // loop through to deal with temp holders
    for (let i = 0; i < computedIndicatorArray.length; i++) {
        if (computedIndicatorArray == 3) {
            computedIndicatorArray[i] = computedIndicatorArray[i-1];
        } else {
            continue;
        }
    }
    
    })

    return computedIndicatorArray;
}

const cors_proxy = "https://sofetch.glitch.me/";
const indicatorUrl = "https://drive.google.com/uc?export=download&id=1H35Ep35AYQ0PkAYgOzM0qS4eFu7Rw4ET";
var rawIndicatorObj = {}
var csvData
var indicatorHeaders
fetch(cors_proxy+indicatorUrl)
    .then(response => response.text())
    .then(csvRaw => {
        console.log("Indicator data downloaded successfully");
        csvData = parseCSV(csvRaw);
        indicatorHeaders = csvData.splice(0,1)[0];
        indicatorHeaders = indicatorHeaders.map(x => x.replace(/[^a-zA-Z ]/g, ""))
        let transposedCsvData = transpose(csvData);
        for (let i = 0; i < indicatorHeaders.length; i++) {
            rawIndicatorObj[indicatorHeaders[i]] = transposedCsvData[i];
        }
        rawIndicatorObj["Date"] = indicatorData["Date"].map(x => new Date(x).toLocaleDateString()) // to reformat dates
    })
    .catch(reject => console.log(reject))

indicatorObj = computeIndicators()
