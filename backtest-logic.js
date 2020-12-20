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

function rules(inputObj, indicators, date) { // rule should return number of units of each symbol to hold
	let tickerList = inputObj.super_bull_instrument.split(",")
                    .concat(inputObj.bull_instruments.split(","))
                    .concat(inputObj.bear_instruments.split(","))
                    .concat(inputObj.safe_stock.split(","))
                    .concat(inputObj.short.split(","))
					.concat("CASH");
    let portfolio = Array(tickerList.length).fill(1);
    return portfolio;
};

function dotProduct (arr1, arr2) {
    return arr1.reduce((r,a,i) => r+a*arr2[i],0);
};

// implement faster price list extraction

function backtestExec(inputObj, quotes, indicators, rules) {
    let backtestResult = {
        dates: [],
        benchmarkValue: [], 
        modelValue: [], //initialise modelValue with start_value
        modelValues: [],
		modelUnits: [],
        tickerClosePriceList: [],
        backtestProperties:{}
    };

    backtestResult.backtestProperties.tickerList = inputObj.super_bull_instrument.split(",")
                    .concat(inputObj.bull_instruments.split(","))
                    .concat(inputObj.bear_instruments.split(","))
                    .concat(inputObj.safe_stock.split(","))
                    .concat(inputObj.short.split(","))
					.concat("CASH");
    backtestResult.dates = buildBacktestDates(quotes); // build array of dates
    
    modelValues.push(Array(backtestResult.backtestProperties.tickerList.length - 1).fill(0).concat(modelValue[0])) // start with 100 value in cash
    
    let benchmark = quotes[inputObj.benchmark];
    let benchmarkUnits = inputObj.start_value / benchmark.getDataOnDate(backtestResult.dates[0],"close");

    for (let date of backtestResult.dates) {
        backtestResult.benchmarkValue.push(benchmarkUnits * benchmark.getDataOnDate(date,"close"));
        let currentPortfolio = rules(inputObj, indicators, date);
		currentPortfolio = currentPortfolio.map(x => x/currentPortfolio.reduce((a, b) => a + b, 0) * backtestResult.modelValue[backtestResult.dates.length])) // reweight as ratio
		
        backtestResult.modelUnits.push(currentPortfolio);
        let currentTickerPriceList = [];
        for (let ticker of backtestResult.backtestProperties.tickerList) {
            currentTickerPriceList.push(quotes[ticker].getDataOnDate(date,"close"));
        };
        backtestResult.tickerClosePriceList.push(currentTickerPriceList);
        backtestResult.modelValue.push(dotProduct(currentPortfolio,currentTickerPriceList));
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