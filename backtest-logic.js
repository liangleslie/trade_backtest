function buildBacktestDates (quotes) {
    let dates = [];
    let temp
    let startDate = new Date(inputObj.start_date) ;
	for (var ticker of Object.values(quotes)) {
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
    let benchmarkUnits = inputObj.start_value / benchmark.getDataOnDate(dates[0],"close");
    for (date of dates) {
        chartData.benchmark.push({x: date, y: benchmarkUnits * benchmark.getDataOnDate(date,"close")});
		//implement model data
    };
    return chartData;
};

function rules(inputObj, indicators, date, tickers) { // rule should return number of units of each symbol to hold
	// rule should output bull or bear to position
	position = 1;
	
	// bull bear output to be converted to holding
	// 0: super bull ; 1: bull ; 2: bear; 3: safe; 4: short; 5: cash
	let portfolio = Array(tickers[position].tickersBefore).fill(0)			// tickers before position = 0
				.concat(Array(tickers[position].numberOfTickers).fill(1))	// tickers in position = 1
				.concat(Array(tickers[position].tickersAfter).fill(0))		// tickers after position = 0
	return portfolio;
};

function dotProduct (arr1, arr2) {
    return arr1.reduce((r,a,i) => r+a*arr2[i],0);
};

function arraysEqual(a1,a2) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1)==JSON.stringify(a2);
}

function backtestExec(inputObj, quotes, indicators, rules) {
    let backtestResult = {
        dates: [],
        benchmarkValue: [], 
        modelAllocation: [],
        modelValue: [], //initialise modelValue with start_value
        modelValues: [],
		modelUnits: [],
		tickerOpenPriceList: [],
        tickerClosePriceList: [],
        backtestProperties:{}
    };

	//organise tickers
    backtestResult.backtestProperties.tickerList = inputObj.super_bull_instrument.split(",")
                    .concat(inputObj.bull_instruments.split(","))
                    .concat(inputObj.bear_instruments.split(","))
                    .concat(inputObj.safe_stock.split(","))
                    .concat(inputObj.short.split(","))
					.concat("CASH");
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
	console.log(tickers);

    backtestResult.dates = buildBacktestDates(quotes); // build array of dates
    

	
    // build first day results
    let currentTickerPriceList = [];
    for (let ticker of backtestResult.backtestProperties.tickerList) {
        currentTickerPriceList.push(quotes[ticker].getDatasOnDate(backtestResult.dates[0],["close","open"]));
    };
    backtestResult.tickerClosePriceList.push(currentTickerPriceList);
    
    let benchmark = quotes[inputObj.benchmark];
    let benchmarkUnits = inputObj.start_value / benchmark.getDataOnDate(backtestResult.dates[0],"close");
    
    let currentPortfolio = rules(inputObj, indicators, backtestResult.dates[0], tickers);
    let currentPortfolioValues = currentPortfolio.map(x => x / currentPortfolio.reduce((a, b) => a + b, 0) * inputObj.start_value); // reweight as ratio
    let currentPortfolioUnits = currentPortfolioValues.map((x,i) => x / currentTickerPriceList[i][1]); // calculate units based on open price
    currentPortfolioValues = currentPortfolioUnits.map((x,i) => x * currentTickerPriceList[i][0]); // recalculate portfolio values based on close price

    backtestResult.modelAllocation.push(currentPortfolio);
    backtestResult.modelValues.push(currentPortfolioValues);
    backtestResult.modelUnits.push(currentPortfolioUnits);
    backtestResult.modelValue.push(currentPortfolioValues.reduce((a,b) => a + b, 0));

    // loop through results for subsequent days; SLOW 
    for (let date of backtestResult.dates.slice(1)) {
        currentTickerPriceList = [];
        for (let ticker of backtestResult.backtestProperties.tickerList) {
            currentTickerPriceList.push(quotes[ticker].getDatasOnDate(date,["close","open"]));
        };
        backtestResult.tickerClosePriceList.push(currentTickerPriceList);
        
        backtestResult.benchmarkValue.push(benchmarkUnits * benchmark.getDataOnDate(date,"close"));
        
        currentPortfolio = rules(inputObj, indicators, date, tickers);
        if (arraysEqual(currentPortfolio,backtestResult.modelAllocation[backtestResult.modelAllocation.length - 1])) { // if rules suggest no change in model allocation
            currentPortfolioUnits = backtestResult.modelUnits[backtestResult.modelUnits.length - 1]; // set currentPortfolioUnits to previous period
            currentPortfolioValues = currentPortfolioUnits.map((x,i) => x * currentTickerPriceList[i][0]); // recalculate portfolio values based on close price
        } else { // if rules suggest change in model allocation
            currentPortfolioValues = currentPortfolio.map((x,i) => x / currentPortfolio.reduce((a,b) => a + b, 0) * backtestResult.modelValue[backtestResult.modelValue.length - 1]); // calculate portfolio allocation based on last period modelValue 
            currentPortfolioUnits = currentPortfolioValues.map((x,i) => x / currentTickerPriceList[i][1]); // calculate units based on open price
            currentPortfolioValues = currentPortfolioUnits.map((x,i) => x * currentTickerPriceList[i][0]); // recalculate portfolio values based on close price
        }

        backtestResult.modelAllocation.push(currentPortfolio);
        backtestResult.modelValues.push(currentPortfolioValues);
        backtestResult.modelUnits.push(currentPortfolioUnits);
        backtestResult.modelValue.push(currentPortfolioValues.reduce((a,b) => a + b, 0));
    };
    
    return backtestResult;
};


/*
bear-instruments: "GLD,XLP"
bear-threshold: "40"
bull-instruments: "QQQ,SPY,IJJ"
bull-threshold: "60"
end-date: "12/31/2020"
high-low-sma: "1"
inflation: "1"
momentum: "1"
rebalance-frequency: "999"
s&p-beta: "1"
safe-stock: "TLT"
short: "VXX"
short-threshold: "20"
slippage: "0.1"
start-date: "01/01/2001"
start-value: "100000"
super-bull-instrument: "SPXL"
super-bull-threshold: "80"
unemployment: "1"
vix: "1"
*/