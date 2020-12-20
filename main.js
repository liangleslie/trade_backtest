/*
Variables defined here
Should be temporary - variables should be defined and modified from HTML
*/
var inputObj = pullInputParams();
var bench_ticker = inputObj.benchmark;
var data_tickers = inputObj.super_bull_instrument.split(",")
                    .concat(inputObj.bull_instruments.split(","))
                    .concat(inputObj.bear_instruments.split(","))
                    .concat(inputObj.safe_stock.split(","))
                    .concat(inputObj.short.split(",")) 
const cors_proxy = "https://cors-anywhere.herokuapp.com/";
var chartStartDate = new Date(inputObj.start_date);


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
	this.createChartData = function(property, data = this.data, dates = this.dates) { // converts data into chart.js format; property refers to a key for each element of data object
		let chartData = [];
		for (let i = 0; i < dates.length; i++) {
			chartData.push({t:dates[i],
				y:data[property][i]});
		}
		return chartData;
	};
	this.closeChartData = this.createChartData("close");
	this.getDataOnDate = function(date, property) {  // gets data on date, and if date is non-market day, get data on last market day
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
	};
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

function updateExec() {
	inputObj = pullInputParams();
	console.log(inputObj);
	backtestResult = backtestExec(inputObj, quotes, indicators,rules);
	// update backtest and buildChartContents
	myChart.options = chartOptions(new Date(inputObj["start-date"])); // update options including start date
	myChart.data.datasets = backtestResult.chartData; // update chart data on myChart
	myChart.update()
};

/*
Execution starts here
*/	// download and store latest tickers from yahoo finance
var quotes = [];
var promises = [];
data_tickers.push(bench_ticker);
data_tickers = data_tickers.filter(onlyUnique);

/* 	temporarily disabled to use offline data
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
}
*/

// temp block for offline json loading
for (let ticker of data_tickers) {
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

// build chartData using backtest logic after all data is downloaded
backtestResult = backtestExec(inputObj, quotes, indicators,rules);
var modelSeries = {}
modelSeries.benchmark = new series(backtestResult.dates, {"close": backtestResult.benchmarkValue});
modelSeries.model = new series(backtestResult.dates, {"close": backtestResult.modelValue});

//build chart temp
Promise.all(promises).then(x=> {
	chartDataArray = [];
	chartDataArray = addToChartDataArray(modelSeries.model.closeChartData,"Model", chartDataArray, "rgba(255, 99, 132, 0.5)");
	chartDataArray = addToChartDataArray(modelSeries.benchmark.closeChartData,"Benchmark - "+inputObj.benchmark, chartDataArray, "rgba(99, 255, 132, 0.5)");
	chartContents.data.datasets = chartDataArray;
})
.then(x=> {
	myChart = new Chart(ctx, chartContents) //build chart into html
});