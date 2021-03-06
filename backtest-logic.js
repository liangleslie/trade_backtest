function buildBacktestDates (uniqueTickerList, inputObj, quotes) {
    let dates = [];
    let temp
    let startDate = new Date(inputObj.start_date) ;
	for (var tickerName of uniqueTickerList) {
		ticker = quotes[tickerName];
		startDate = ticker.firstDate > startDate ? ticker.firstDate : startDate;
        temp = ticker.dates.filter(x => x >= startDate);
		dates = dates.filter(x => x >= startDate);
        dates = temp.length > dates.length ? temp : dates;
    };
    return dates;
};

function buildChartData(inputObj, quotes, dates) {
    let chartData = {benchmark: [], model: []};
    let benchmark = quotes[inputObj.benchmark];
    let benchmarkUnits = inputObj.start_value / getDataOnDate(dates[0], benchmark, "close");
    for (date of dates) {
        chartData.benchmark.push({x: date, y: benchmarkUnits * getDataOnDate(date, benchmark, "close")});
		//implement model data
    };
    return chartData;
};

function getDataOnDate(date, tickerObj, property = "close") {  // gets data on date, and if date is non-market day, get data on last market day
	let dataRequest;
	if (typeof(date) == "number") {
		try {
			requestDate = new Date(date - date%(60*60*24*1000) + 60*60*24*1000);
		} catch {
			throw "Date argument is invalid number"
		}
	} else if (typeof(date) == "object") {
		try {
			requestDate = date;
		} catch {
			throw "Date argument is invalid date object"
		}
	} else if (typeof(date) == "string") {
		try {
			requestDate = new Date(date);
			requestDate.setUTCHours(0,0,0,0);
			requestDate.setDate(requestDate.getDate()+1);
		} catch {
			throw "Date argument is invalid date string"
		}
	};
	dateIndex = tickerObj.dates.findIndex(x => x > requestDate) - 1;
	dataRequest = tickerObj.data[property][dateIndex];
	// console.log(date,requestDate,this.dates[dateIndex],dateIndex,dataRequest);  // for debug purposes
	return dataRequest;
};

function getDatasOnDate(date, tickerObj, properties) {  // gets data on date, and if date is non-market day, get data on last market day
	let dataRequest = [];
	if (typeof(date) == "number") {
		try {
			requestDate = new Date(date - date%(60*60*24*1000) + 60*60*24*1000);
		} catch {
			throw "Date argument is invalid number"
		}
	} else if (typeof(date) == "object") {
		try {
			requestDate = date;
		} catch {
			throw "Date argument is invalid date object"
		}
	} else if (typeof(date) == "string") {
		try {
			requestDate = new Date(date);
			requestDate.setUTCHours(0,0,0,0);
			requestDate.setDate(requestDate.getDate()+1);
		} catch {
			throw "Date argument is invalid date string"
		}
	};
	dateIndex = tickerObj.dates.findIndex(x => x > requestDate) - 1;
	for (property of properties) {
		dataRequest.push(tickerObj.data[property][dateIndex]);
	};
	// console.log(date,requestDate,this.dates[dateIndex],dateIndex,dataRequest);  // for debug purposes
	return dataRequest;
};

function rules(weights, thresholds, indicators, date, tickers, currentIndicators = []) { // rule should return number of units of each symbol to hold
	// rule should output bull or bear to position
	if (arraysEqual(currentIndicators, [])) {
		currentIndicators = [getDataOnDate(date, indicators.momentum),
							getDataOnDate(date, indicators.highLow),
							getDataOnDate(date, indicators.inflation),
							getDataOnDate(date, indicators.vix),
							getDataOnDate(date, indicators.unemployment),
							getDataOnDate(date, indicators.spbeta)];
	};
	let compositeIndicator = currentIndicators.reduce((a,b,i) => b == null ? NaN : weights[i] == 0 ? a+0 : a+b*weights[i], 0) / weights.reduce((a,b) => a+b, 0) // fix for null values
	let position = compositeIndicator > thresholds.superBull ? 0 :
					compositeIndicator > thresholds.bull ? 1 :
					compositeIndicator > thresholds.bear ? 2 :
					compositeIndicator > thresholds.short && compositeIndicator < thresholds.bear ? 3 :
					compositeIndicator < thresholds.short ? 4 : 5;
	
	// bull bear output to be converted to holding
	// 0: super bull ; 1: bull ; 2: bear; 3: safe; 4: short; 5: cash
	let portfolio = Array(tickers[position].tickersBefore).fill(0)			// tickers before position = 0
				.concat(Array(tickers[position].numberOfTickers).fill(1))	// tickers in position = 1
				.concat(Array(tickers[position].tickersAfter).fill(0))		// tickers after position = 0
	return [portfolio,currentIndicators,compositeIndicator,position];
};

function dotProduct (arr1, arr2) {
    return arr1.reduce((r,a,i) => r+a*arr2[i],0);
};

function arraysEqual(a1,a2) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1)==JSON.stringify(a2);
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function buildTickerPriceList(uniqueTickerList, tickerList, date, quotes) {
	let currentTickerPriceList = [];
	let currentTickerPriceObj = {};
	for (let ticker of uniqueTickerList) {
		currentTickerPriceObj[ticker] = getDatasOnDate(date, quotes[ticker], ["close","open"]);
	};
	for (let ticker of tickerList) {
		currentTickerPriceList.push(currentTickerPriceObj[ticker]);
	};
	return currentTickerPriceList;
}

function backtestExec(inputObj, quotes, indicators, rules, oldBacktestResult, rebuildTickerPrice = true, rebuildIndicators = true) {
	console.log("Rebuild prices: " + rebuildTickerPrice, "Rebuild indicators: " + rebuildIndicators);
	let backtestResult = {
		dates: [],
		benchmarkValue: [],
		benchmarkHighestValue: [],
		benchmarkDrawdown: [],
		modelAllocation: [],
		modelValue: [], //initialise modelValue with start_value
		modelValues: [],
		modelUnits: [],
		modelHighestValue: [],
		modelDrawdown: [],
		daysInPosition: [],
		tickerPriceList: [],
		backtestProperties:{}
	};

	postMessage(["status","Starting backtest..."]);
	
	//organise tickers
    backtestResult.backtestProperties.tickerList = inputObj.super_bull_instrument.split(",")
                    .concat(inputObj.bull_instruments.split(","))
                    .concat(inputObj.bear_instruments.split(","))
                    .concat(inputObj.safe_stock.split(","))
                    .concat(inputObj.short.split(","))
					.concat("CASH");
	backtestResult.backtestProperties.uniqueTickerList = backtestResult.backtestProperties.tickerList.filter(onlyUnique);
	
	let tickers = [];
	let tickersTemp = 0;
	for (item of ["super_bull_instrument","bull_instruments","bear_instruments","safe_stock","short"]) {
		let tickerObj = {};
		tickerObj.tickers = inputObj[item].split(",");
		tickerObj.tickersBefore = tickersTemp;
		tickerObj.numberOfTickers = tickerObj.tickers.length;
		tickerObj.tickersAfter = backtestResult.backtestProperties.tickerList.length - tickerObj.numberOfTickers - tickerObj.tickersBefore;
		
		tickers.push(tickerObj);
		tickersTemp += tickerObj.numberOfTickers;
	};
	tickers.push({"tickersBefore":tickersTemp,"numberOfTickers":1,"tickersAfter":0}); // manual input for CASH
	
	// extract weights and thresholds from inputs
	backtestResult.backtestProperties.weights = [parseInt(inputObj["momentum"]),
									parseInt(inputObj["high-low_sma"]),
									parseInt(inputObj["inflation"]),
									parseInt(inputObj["vix"]),
									parseInt(inputObj["unemployment"]),
									parseInt(inputObj["s&p_beta"])]
	backtestResult.backtestProperties.thresholds = {"superBull": parseInt(inputObj["super_bull_threshold"])/100,
										"bull": parseInt(inputObj["bull_threshold"])/100,
										"bear": parseInt(inputObj["bear_threshold"])/100,
										"short": parseInt(inputObj["short_threshold"])/100
	}
	
    //define variables outside loop
    backtestResult.dates = buildBacktestDates(backtestResult.backtestProperties.uniqueTickerList, inputObj, quotes); // build array of dates
	totalDays = backtestResult.dates.length;
	currentDay = 0;
	postMessage(["bar1",currentDay/totalDays*100]);
	
	//align old backtest array to new period
	if (Object.keys(oldBacktestResult).length != 0) { 
		oldBacktestResult.modelAllocation[1].splice(oldBacktestResult.dates.length - backtestResult.dates.length, oldBacktestResult.dates.length - 1); // implement try and default to no rebuild
	};
	
	let benchmark = quotes[inputObj.benchmark];
	let benchmarkIndex = backtestResult.backtestProperties.tickerList.findIndex(ticker => ticker == inputObj.benchmark);
	
    // loop through results for all days; SLOW 
    for (let date of backtestResult.dates) {
        let currentTickerPriceList = rebuildTickerPrice ? 
										buildTickerPriceList(backtestResult.backtestProperties.uniqueTickerList, backtestResult.backtestProperties.tickerList, date, quotes) :
										oldBacktestResult.tickerPriceList[currentDay];
        let [currentPortfolio,currentIndicators,compositeIndicator,currentPosition] = rules(backtestResult.backtestProperties.weights, backtestResult.backtestProperties.thresholds, indicators, date, tickers, rebuildIndicators ? [] : oldBacktestResult.modelAllocation[currentDay][1]); //use existingBacktestResults where available
        
        //set last period variables
        if (date == backtestResult.dates[0]) { //if first day
            var benchmarkUnits = (inputObj.start_value * (1 - inputObj.slippage/100)) / currentTickerPriceList[benchmarkIndex][1];
            var lastPeriodValue = inputObj.start_value;
            var lastPeriodAllocation = [[]];
            var highestBenchmarkValue = inputObj.start_value;
            var highestModelValue = inputObj.start_value;
        } else { // for all other days
            var lastPeriodValue = backtestResult.modelValue[backtestResult.modelValue.length - 1];
            var lastPeriodAllocation = backtestResult.modelAllocation[backtestResult.modelAllocation.length - 1];
        };
        
        if (arraysEqual(currentPortfolio,lastPeriodAllocation[0])) { // if rules suggest no change in model allocation
            currentPortfolioUnits = backtestResult.modelUnits[backtestResult.modelUnits.length - 1]; // set currentPortfolioUnits to previous period
            currentPortfolioValues = currentPortfolioUnits.map((x,i) => x * currentTickerPriceList[i][0]); // recalculate portfolio values based on close price
			currentDaysInPosition = backtestResult.daysInPosition[backtestResult.daysInPosition.length - 1] + 1;
        } else { // if rules suggest change in model allocation
            currentPortfolioValues = currentPortfolio.map((x) => x / currentPortfolio.reduce((a,b) => a + b, 0) * lastPeriodValue * (1 - inputObj.slippage/100)); // calculate portfolio allocation based on last period modelValue & slippage
            currentPortfolioUnits = currentPortfolioValues.map((x,i) => x / currentTickerPriceList[i][1]); // calculate units based on open price
            currentPortfolioValues = currentPortfolioUnits.map((x,i) => x * currentTickerPriceList[i][0]); // recalculate portfolio values based on close price
			currentDaysInPosition = 0;
        };
        
        let currentBenchmarkValue = benchmarkUnits * currentTickerPriceList[benchmarkIndex][0]
        let currentPortfolioValue = currentPortfolioValues.reduce((a,b) => a + b, 0)
        
        //store results in backtestResult
        backtestResult.tickerPriceList.push(currentTickerPriceList);
		backtestResult.modelAllocation.push([currentPortfolio,currentIndicators,compositeIndicator,currentPosition]);
        backtestResult.modelValues.push(currentPortfolioValues);
        backtestResult.modelUnits.push(currentPortfolioUnits);
        backtestResult.benchmarkValue.push(currentBenchmarkValue);
        backtestResult.modelValue.push(currentPortfolioValue);
		
		highestBenchmarkValue = currentBenchmarkValue > highestBenchmarkValue ? currentBenchmarkValue : highestBenchmarkValue;
        highestModelValue = currentPortfolioValue > highestModelValue ? currentPortfolioValue : highestModelValue;
        backtestResult.benchmarkHighestValue.push(highestBenchmarkValue);
        backtestResult.benchmarkDrawdown.push(currentBenchmarkValue / highestBenchmarkValue - 1);
        backtestResult.modelHighestValue.push(highestModelValue);
        backtestResult.modelDrawdown.push(currentPortfolioValue / highestModelValue - 1)
        
        backtestResult.daysInPosition.push(currentDaysInPosition);
		currentDay += 1;
		postMessage(["bar1",currentDay/totalDays*100]);
    };
	postMessage(["status","Backtest done"]);
    console.log(backtestResult);
    return backtestResult;
};

onmessage = function(e) {
	var inputObj = e.data.inputObj;
	var quotes = e.data.quotes;
	var indicators = e.data.indicators;
	var oldBacktestResult = e.data.oldBacktestResult;
	var rebuildTickerPrice = e.data.rebuildTickerPrice;
	var rebuildIndicators = e.data.rebuildIndicators;
	var backtestResult = backtestExec(inputObj, quotes, indicators, rules, oldBacktestResult, rebuildTickerPrice, rebuildIndicators);
	postMessage(["backtestResult",backtestResult]);
}

