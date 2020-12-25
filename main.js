/*
Variables defined here
Should be temporary - variables should be defined and modified from HTML
*/
var bar1 = new ldBar("#ldBar");
var inputObj = pullInputParams();
var quotes = buildQuotes(inputObj);
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
			mode: "nearest",
			intersect: false
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
				ticks: {
					beginAtZero: true
				}
			}],
			xAxes: [{
				type: 'time',
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

//create series object to store quote and indicator data
function series(dates,dataObject) {
	this.dates = dates;
	this.firstDate = Math.min(... this.dates);
	this.data = dataObject; //data object format {'property1':[],'property2':[],...}
/* 	
	this.getDataOnDate = function(date, property = "close") {  // gets data on date, and if date is non-market day, get data on last market day
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
		dateIndex = this.dates.findIndex(x => x > requestDate) - 1;
		dataRequest = this.data[property][dateIndex];
		// console.log(date,requestDate,this.dates[dateIndex],dateIndex,dataRequest);  // for debug purposes
		return dataRequest;
	};
	
	this.getDatasOnDate = function(date, properties) {  // gets data on date, and if date is non-market day, get data on last market day
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
		dateIndex = this.dates.findIndex(x => x > requestDate) - 1;
		for (property of properties) {
		    dataRequest.push(this.data[property][dateIndex]);
		};
		// console.log(date,requestDate,this.dates[dateIndex],dateIndex,dataRequest);  // for debug purposes
		return dataRequest;
	}; */
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

function buildQuotes(inputObj) {
	let quotes = {};
	let data_tickers = inputObj.super_bull_instrument.split(",")
						.concat(inputObj.bull_instruments.split(","))
						.concat(inputObj.bear_instruments.split(","))
						.concat(inputObj.safe_stock.split(","))
						.concat(inputObj.short.split(",")) 
	data_tickers.push(inputObj.benchmark);
	data_tickers = data_tickers.filter(onlyUnique);
	
	/* 	temporarily disabled to use offline data
		const cors_proxy = "https://cors-anywhere.herokuapp.com/";	for (var ticker of data_tickers) {
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
	}
	*/

	// temp block for offline json loading
	for (let ticker of data_tickers) {
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
	
	return quotes;
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

function updateExec() {
	inputObj = pullInputParams();
	quotes = buildQuotes(inputObj);
	console.log(inputObj);
	
	backtestWorker.postMessage([inputObj, quotes, indicators]);
};

/*
Execution starts here
*/	


// call computation as async function
backtestWorker = new Worker('backtest-logic.js')
backtestWorker.postMessage([inputObj, quotes, indicators]);

backtestWorker.onmessage = function(e) {
	if (e.data[0] === "backtestResult") {
		backtestResult = e.data[1];
		var chartDataArray = buildModelCharts(backtestResult);
		chartContents.data.datasets = chartDataArray;
		myChart = new Chart(ctx, chartContents); //build chart into html
	} else if (e.data[0] === "bar1") {
		bar1.set(e.data[1]);
	}
};
