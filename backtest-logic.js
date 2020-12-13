function buildBacktestDates (quotes) {
    let dates = [];
    let temp
    let startDate = new Date(inputObj.start_date) ;
    for (var ticker of Object.values(quotes)) {
        startDate = ticker.first_date > startDate ? ticker.first_date : startDate;
        temp = ticker.dates.filter(x => x >= startDate);
        dates = temp.length < dates.length || dates.length === 0 ? temp : dates;
    };
    return dates;
};

function buildChartData(inputObj, quotes, dates) {
    let chartData = {benchmark: [], model: []};
    let benchmark = quotes[inputObj.benchmark];
    let units = inputObj.start_value / benchmark.getDataOnDate(dates[0],"close");
    for (date of dates) {
        chartData.benchmark.push({x: date, y: units * benchmark.getDataOnDate(date,"close")});
    };
    return chartData;
};

function rules(inputObj, indicators, date) {
    let units = [1,1,1,1,1,1,1,1];
    return units;
};

function dotProduct (arr1, arr2) {
    return arr1.reduce((r,a,i) => r+a*arr2[i],0);
};

// implement faster price list extraction

function backtestExec(inputObj, quotes, indicators, rules) {
    let backtestResult = {
        dates: [],
        benchmarkValue: [], 
        modelValue: [],
        modelUnits: [],
        tickerPriceList: [],
        backtestProperties:{}
    };

    backtestResult.backtestProperties.tickerList = inputObj.super_bull_instrument.split(",")
                    .concat(inputObj.bull_instruments.split(","))
                    .concat(inputObj.bear_instruments.split(","))
                    .concat(inputObj.safe_stock.split(","))
                    .concat(inputObj.short.split(","));
    backtestResult.dates = buildBacktestDates(quotes); // build array of dates
    
    
    
    let benchmark = quotes[inputObj.benchmark];
    let benchmarkUnits = inputObj.start_value / benchmark.getDataOnDate(backtestResult.dates[0],"close");

    for (let date of backtestResult.dates) {
        backtestResult.benchmarkValue.push(benchmarkUnits * benchmark.getDataOnDate(date,"close"));
        currentUnits = rules(inputObj, indicators, date)
        backtestResult.modelUnits.push(currentUnits);
        let currentTickerPriceList = [];
        for (let ticker of backtestResult.backtestProperties.tickerList) {
            currentTickerPriceList.push(quotes[ticker].getDataOnDate(date,"close"));
        };
        backtestResult.tickerPriceList.push(currentTickerPriceList);
        backtestResult.modelValue.push(dotProduct(currentUnits,currentTickerPriceList));
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