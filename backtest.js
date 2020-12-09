/*
Variables defined here
*/
var bench_ticker = "SPY";
var data_tickers = ["QQQ","IJJ","SPY"];
const cors_proxy = "https://cors-anywhere.herokuapp.com/";
const ctx = document.getElementById('myChart').getContext('2d');
var chartStartDate = new Date("1/1/2001")

/*
functions defined here
*/
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function ydata_to_series(y_data) {
	var series = {};
	for (var i = 0; i < y_data['chart']['result'][0]['timestamp'].length; i++) {
		date = new Date(y_data['chart']['result'][0]['timestamp'][i]*1000).toLocaleDateString('en-US'); // convert ydata timestamps into date keys
		properties = [Object.keys(y_data['chart']['result'][0]["indicators"]["quote"][0])][0]; // extract ydata quote properties into an array
		series[date] = { [properties[0]] : y_data['chart']['result'][0]["indicators"]["quote"][0][properties[0]][i],
						[properties[1]] : y_data['chart']['result'][0]["indicators"]["quote"][0][properties[1]][i],
						[properties[2]] : y_data['chart']['result'][0]["indicators"]["quote"][0][properties[2]][i],
						[properties[3]] : y_data['chart']['result'][0]["indicators"]["quote"][0][properties[3]][i],
						[properties[4]] : y_data['chart']['result'][0]["indicators"]["quote"][0][properties[4]][i]};
	}
	return series;
};

function series(dates,dataObject) {
	this.dates = dates;
	this.first_date = Math.min(... this.dates);
	this.data = dataObject; //data object format {'property1':[],'property2':[],...}
	this.createChartData = function(property, data = this.data, dates = this.dates) { // converts data into chart.js format; property refers to a key for each element of data object
		var chartData = [];
		for (var i = 0; i < dates.length; i++) {
			chartData.push({t:dates[i],
				y:data[property][i]});
		}
		return chartData;
	}
	this.closeChartData = this.createChartData("close");
	this.getDataOnDate = function(date, property) {
		var dataRequest
		// implement data search function for single and array of date/properties
		return dataRequest
	}
}

var buildChartContents = function(chartDataArray, chartStartDate) {
	return ({
		type: 'line',
		data: {
			datasets: chartDataArray
		},
		options: {
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
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true
					}
				}],
				xAxes: [{
					type: 'time',
					ticks: {
						min: chartStartDate
					},
					time: {
						unit: 'month'
					}
				}]
			}
		}
	})
};

var addToChartDataArray = function (chartData, label, chartDataArray, color = "rgba(255, 99, 132, 0.2)") {
	chartDataArray.push({
		label: label,
		data: chartData,
		borderColor: [
			color
		],
		fill: false
	});
	return chartDataArray;
}

/*
Execution starts here
*/

// download and store latest tickers from yahoo finance
var quotes = [];
var chartDataArray = [];
var promises = [];
data_tickers.push(bench_ticker);
data_tickers = data_tickers.filter(onlyUnique);

for (var ticker of data_tickers) {
    var url = "https://query1.finance.yahoo.com/v8/finance/chart/"+ticker+"?interval=1d&range=30y";
    promises.push(fetch(cors_proxy+url, {headers: {origin: ""}}) // origin needed by cors_proxy
        .then(
            response => response.json()
        ).then(
            response_data => {
				dates = response_data['chart']['result'][0]['timestamp'].map(x => new Date(x*1000));
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

//build chartData after all data is downloaded
Promise.all(promises).then(x=> {
	chartDataArray = addToChartDataArray(quotes.IJJ.closeChartData,"IJJ",chartDataArray)
	chartDataArray = addToChartDataArray(quotes.SPY.closeChartData,"SPY",chartDataArray, "rgba(99, 255, 132, 0.2)")
	chartDataArray = addToChartDataArray(quotes.QQQ.closeChartData,"QQQ",chartDataArray, "rgba(99, 132, 255, 0.2)")
})
.then(x=> {
	new Chart(ctx, buildChartContents(chartDataArray, chartStartDate)) //build chart into html
});