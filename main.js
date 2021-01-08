/*
Variables defined here
Should be temporary - variables should be defined and modified from HTML
*/
var bar1 = new ldBar("#ldBar");
var inputObj = pullInputParams();
var quotesPromises = buildQuotes(inputObj);
var chartStartDate = new Date(inputObj.start_date);

//create indicators
var indicators = {};
for (let indicatorName of ["momentum","highLow","inflation","vix","unemployment","spbeta"]) {
	let indicator = window[indicatorName];
	let dataObj = {"close":indicator};
	let tempDate = indicatorDate.slice(indicatorDate.length - indicator.length).map(x => new Date((x+60*60*24-x%(60*60*24))*1000));
	indicators[indicatorName] = new series(tempDate,dataObj);
}

/*
Chart related variables go here
*/
const ctx = document.getElementById('myChart').getContext('2d');
var chartDataArray = [];

var chartOptions = function(chartStartDate) {
	return {
		elements: {
			point: {
				radius: 0
			}
		},
		events: ['click'],
		tooltips: {
			borderColor: 'rgba(255, 255, 255, 0.5)',
			borderWidth: 1,
			mode: "index",
			intersect: false,
			position: "nearest",
			callbacks: {
				afterBody: function(tooltipItems, data) { // include model details in tooltip
					//console.log(tooltipItems); // for debugging
					//console.log(data); // for debugging
					
					let index = tooltipItems[0].index
					let symbolValues = backtestResult.modelValues[index];
					let symbolList = backtestResult.backtestProperties.tickerList
					
					let output = [""]
					let position = backtestResult.modelAllocation[index][3] == 0 ? "Super Bull" :
									backtestResult.modelAllocation[index][3] == 1 ? "Bull" :
									backtestResult.modelAllocation[index][3] == 2 ? "Bear" :
									backtestResult.modelAllocation[index][3] == 3 ? "Safe" :
									backtestResult.modelAllocation[index][3] == 4 ? "Short" : "Error" ;
					
					//return position details
					output.push("Current position: " + position);
    				output.push("Current Model Drawdown: " + Math.round(backtestResult.modelDrawdown[index] * 10000) / 100 + "% (vs. " + Math.round(backtestResult.benchmarkDrawdown[index] * 10000) / 100 + "%)");
					output.push("Days in position: " + backtestResult.daysInPosition[index]);
					output.push("");
					
					//return portfolio value
					output.push("Current portfolio:");
					for (let i = 0; i < symbolValues.length; i++) {
						symbolValues[i] > 0 ? output.push(symbolList[i] + ": $" + numberWithCommas(Math.round(symbolValues[i] * 100)/100)) : null;
					};
					output.push("");
					
					//return ROI results
					positionROIToDate = Math.round((backtestResult.modelValue[index] / backtestResult.modelValue[index - backtestResult.daysInPosition[index]] - 1) * 10000) / 100 ;
					benchmarkPerformance = Math.round((backtestResult.benchmarkValue[index] / backtestResult.benchmarkValue[index - backtestResult.daysInPosition[index]] - 1) * 10000) / 100 ;
					output.push("ROI from position to date: " + positionROIToDate + "%" );
					output.push("Benchmark ROI: " + benchmarkPerformance + "%");
					
					return output;
				},
				labelColor: function(tooltipItems, data) {
					return {
						borderColor: myChart.data.datasets[tooltipItems.datasetIndex].borderColor,
						backgroundColor: myChart.data.datasets[tooltipItems.datasetIndex].borderColor
					}
				},
				label: function(tooltipItems, data) { // fix chart label output
					var label = data.datasets[tooltipItems.datasetIndex].label + ": $"
					value = Math.round(data.datasets[tooltipItems.datasetIndex].data[tooltipItems.index].y * 100) / 100;
					label += numberWithCommas(value);
                    return label;
				},
				title: function(tooltipItems, data) { // clean up date in chart title
					var label = new Date(tooltipItems[0].label).toDateString();
					return label;
				}
			}
		},
		animation: {
			duration: 0 // general animation time
		},
		hover: {
			animationDuration: 0 // duration of animations when hovering an item
		},
		responsiveAnimationDuration: 0, // animation duration after a resize
		scales: {
			yAxes: [{
				gridLines: {
				    color: 'rgba(255, 255, 255, 0.1)'
				},
				ticks: {
					beginAtZero: true
				}
			}],
			xAxes: [{
				type: 'time',
				gridLines: {
				    color: 'rgba(255, 255, 255, 0.1)'
				},
				ticks: {
					min: chartStartDate // set start date
				},
				time: {
					unit: 'month'
				}
			}]
		}
	};
}

var chartContents = {
		type: 'line',
		data: {
			datasets: chartDataArray
		},
		options: chartOptions(chartStartDate)
};



/*
functions defined here
*/
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//create series object to store quote and indicator data
function series(dates,dataObject) {
	this.dates = dates;
	this.firstDate = Math.min(... this.dates);
	this.data = dataObject; //data object format {'property1':[],'property2':[],...}
};

function createChartData(data, dates, property = "close") { // converts data into chart.js format; property refers to a key for each element of data object
	let chartData = [];
	for (let i = 0; i < dates.length; i++) {
		chartData.push({t:dates[i],
			y:data[property][i]});
	}
	return chartData;
};

var addToChartDataArray = function (chartData, label, chartDataArray, color) {
	chartDataArray.push({
		label: label,
		data: chartData,
		borderColor: [
			color
		],
		fill: false
	});
	return chartDataArray;
};

function uniqueTickers (inputObj) {
	let dataTickers = inputObj.super_bull_instrument.split(",")
						.concat(inputObj.bull_instruments.split(","))
						.concat(inputObj.bear_instruments.split(","))
						.concat(inputObj.safe_stock.split(","))
						.concat(inputObj.short.split(",")) 
	dataTickers.push(inputObj.benchmark);
	return [dataTickers, dataTickers.filter(onlyUnique)];
}

function buildQuotes(inputObj) {
	let quotes = {};
	let promises = [];
	[fullDataTickers, uniqueDataTickers] = uniqueTickers(inputObj);
	
	
	/* temp block for cors_proxy
	document.getElementById("status").innerHTML = "Downloading data from Yahoo..."
	const cors_proxy = "https://sofetch.glitch.me/"; // cors_proxy @ https://observablehq.com/@alecglassford/so-fetch
	for (var ticker of data_tickers) {
		var url = "https://query1.finance.yahoo.com/v8/finance/chart/"+ticker+"?interval=1d&range=30y";
		promises.push(fetch(cors_proxy+url, {headers: {origin: ""}}) // origin needed by cors_proxy
			.then(
				response => response.json()
			).then(
				response_data => {
					dates = response_data['chart']['result'][0]['timestamp'].map(x => new Date((x-x%(60*60*24))*1000));
					dataObject = {
						'close': response_data['chart']['result'][0]["indicators"]["quote"][0]['close'],
						'open': response_data['chart']['result'][0]["indicators"]["quote"][0]['open'],
						'high': response_data['chart']['result'][0]["indicators"]["quote"][0]['high'],
						'low': response_data['chart']['result'][0]["indicators"]["quote"][0]['low'],
						'volume': response_data['chart']['result'][0]["indicators"]["quote"][0]['volume']
					};
					quotes[response_data["chart"]["result"][0]["meta"]["symbol"]] = new series(dates,dataObject);
				}
			)
		)
	};
	Promise.all(promises).then(resolved => {
	   quotes["CASH"] = new series (quotes.SPY.dates, {
		'close': Array(quotes.SPY.dates.length).fill(1),
		'open': Array(quotes.SPY.dates.length).fill(1)
	    }); 
		document.getElementById("status").innerHTML = "Data download done";
	});
	
	return {'quotes': quotes, 'promises': promises};
	
	*/
	

	// /* temp block for offline json loading
	for (let ticker of uniqueDataTickers) {
		if (ticker === "CASH") {
			continue;
		}
		ticker = window[ticker];
		dates = ticker['chart']['result'][0]['timestamp'].map(x => new Date((x-x%(60*60*24))*1000));
		dataObject = {
			'close': ticker['chart']['result'][0]["indicators"]["quote"][0]['close'],
			'open': ticker['chart']['result'][0]["indicators"]["quote"][0]['open'],
			'high': ticker['chart']['result'][0]["indicators"]["quote"][0]['high'],
			'low': ticker['chart']['result'][0]["indicators"]["quote"][0]['low'],
			'volume': ticker['chart']['result'][0]["indicators"]["quote"][0]['volume']
		};
		quotes[ticker["chart"]["result"][0]["meta"]["symbol"]] = new series(dates,dataObject);	
	}
    
	//create CASH quote
	quotes["CASH"] = new series (SPY.chart.result[0].timestamp.map(x => new Date((x-x%(60*60*24))*1000)), {
		'close': Array(SPY.chart.result[0].timestamp.length).fill(1),
		'open': Array(SPY.chart.result[0].timestamp.length).fill(1)
	});
	
	return {'quotes': quotes, 'promises': promises};
	// */
};

function buildModelCharts(backtestResult) {
	var modelSeries = {}
	modelSeries.benchmark = new series(backtestResult.dates, {"close": backtestResult.benchmarkValue});
	modelSeries.model = new series(backtestResult.dates, {"close": backtestResult.modelValue});
	var chartDataArray = [];
	chartDataArray = addToChartDataArray(createChartData(modelSeries.model.data,modelSeries.model.dates), "Model", chartDataArray, "rgba(255, 99, 132, 0.5)");
	chartDataArray = addToChartDataArray(createChartData(modelSeries.benchmark.data,modelSeries.benchmark.dates), "Benchmark - "+inputObj.benchmark, chartDataArray, "rgba(99, 255, 132, 0.5)");
	return chartDataArray;
}

function copyToClipboard(string) {
	var data = [new ClipboardItem({ "text/plain": new Blob([string], { type: "text/plain" }) })];
	navigator.clipboard.write(data);
	console.log("Settings copied to clipboard");
}

function limitedUpdateChecker(newInputObj, oldInputObj) { 	//check quotes to see if anything needs to be redownloaded
	let rebuildQuotes = false
	let rebuildTickerPrice = false
	let rebuildIndicators = false
	
	let [oldFullQuotes, oldUniqueQuotes] = uniqueTickers(oldInputObj);
	let [newFullQuotes, newUniqueQuotes]  = uniqueTickers(newInputObj);
	rebuildQuotes = newUniqueQuotes.every(val => oldUniqueQuotes.includes(val)) ? false : true; //if newQuotes is subset of oldQuotes, do not rebuild quotes
	
	//check dates
	if (new Date(newInputObj.start_date).getTime() < new Date(oldInputObj.start_date).getTime()) {
		rebuildTickerPrice = true;
		rebuildIndicators = true;
	} else if (JSON.stringify(oldFullQuotes) != JSON.stringify(newFullQuotes)) { //test if arrays are same
		rebuildTickerPrice = true;
	};
	
	return {"rebuildQuotes": rebuildQuotes,
			"rebuildTickerPrice": rebuildTickerPrice,
			"rebuildIndicators": rebuildIndicators
	}
}

function updateExec() {
	var oldInputObj = inputObj;
	inputObj = pullInputParams();
	console.log(inputObj);
	
	// compare new and old inputObj to decide what needs to update
	let updateCheck = limitedUpdateChecker(inputObj, oldInputObj)
	console.log("Update check","Rebuild quotes: " + updateCheck.rebuildQuotes, "Rebuild ticker prices: " + updateCheck.rebuildTickerPrice, "Rebuild indicators: " + updateCheck.rebuildIndicators);
	
	// rebuild quote?
	if (updateCheck.rebuildQuotes = true) {
		quotesPromises = buildQuotes(inputObj);
	};
	
	startTime = new Date().getTime()
    Promise.all(quotesPromises.promises).then(resolved => {
		backtestWorker.postMessage({
							"inputObj": inputObj, 
							"quotes": quotesPromises.quotes,
							"indicators": indicators,
							"oldBacktestResult": backtestResult,
							"rebuildTickerPrice": updateCheck.rebuildTickerPrice,
							"rebuildIndicators": updateCheck.rebuildIndicators
							});
    })
};

/*
Execution starts here
*/	


// call computation as async function
backtestWorker = new Worker('backtest-logic.js')
Promise.all(quotesPromises.promises).then(resolved => {
    backtestWorker.postMessage({
								"inputObj": inputObj, 
								"quotes": quotesPromises.quotes,
								"indicators": indicators,
								"oldBacktestResult": defaultBacktestResult,
								"rebuildTickerPrice": false,  // should do full rebuild if using yahoo data; disabled while developing
								"rebuildIndicators": false    // should do full rebuild if using updated indicator data; disabled while developing
								});
	startTime = new Date().getTime()
})

backtestWorker.onmessage = function(e) {
	if (e.data[0] === "backtestResult") {
		endTime = new Date().getTime()
		console.log("Backtest runtime: " + (endTime - startTime).toString());
		backtestResult = e.data[1];
		var chartDataArray = buildModelCharts(backtestResult);
		chartContents.options = chartOptions(new Date(inputObj.start_date))
		chartContents.data.datasets = chartDataArray;
		myChart = new Chart(ctx, chartContents); //build chart into html
	} else if (e.data[0] === "bar1") {
		bar1.set(e.data[1]);
	} else if (e.data[0] === "status") {
		document.getElementById("status").innerHTML = e.data[1];
	}
};
