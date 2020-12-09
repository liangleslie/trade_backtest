/*
Variables defined here
*/
var bench_ticker = "SPY";
var data_tickers = ["QQQ","IJJ","SPY"];
const cors_proxy = "https://cors-anywhere.herokuapp.com/";
var quotes = []


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

function series(data) {
	this.dates = [Object.keys(data)][0]; // turn data keys into dates array
	this.dates = this.dates.map(x => new Date(x)); //convert elements in dates array into DateTime objects
	this.first_date = Math.min(... this.dates);
	this.data = data;
	this.createChartData = function(property, data = this.data, dates = this.dates) { // property refers to a key for each element of data object
		var chartData = [];
		for (var i = 0; i < Object.keys(data).length; i++) {
			date = dates[i]
			chartData.push({t:date,
							y:data[date.toLocaleDateString('en-US')][property]});
		}
		return chartData; // converts data into chart.js format
	}
	this.closeChartData = this.createChartData("close");
}



var buildChartContents = function() {
	return ({
		type: 'line',
		data: {
			labels: data_tickers, // to update with annual stamps
			datasets: [{
				label: 'IJJ',
				data: quotes.IJJ.closeChartData,
				borderColor: [
					'rgba(255, 99, 132, 0.2)'
				],
				fill: false
			},
			{
				label: 'SPY',
				data: quotes.SPY.closeChartData,
				borderColor: [
					'rgba(100, 99, 132, 0.2)'
				],
				fill: false
			},
			{
				label: 'QQQ',
				data: quotes.QQQ.closeChartData,
				borderColor: [
					'rgba(50, 150, 200, 0.2)'
				],
				fill: false
			}]
		},
		options: {
			elements: {
				point: {
					radius: 0
				}
			},
			tooltips: {
				mode: 'index'
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
						min: Math.min(... [quotes.IJJ.first_date, quotes.SPY.first_date, quotes.QQQ.first_date])
					},
					time: {
						unit: 'month'
					}
				}]
			}
		}
	})
};

/*
Execution starts here
*/

// download and store latest tickers from yahoo finance
data_tickers.push(bench_ticker);
data_tickers = data_tickers.filter(onlyUnique);

for (var ticker of data_tickers) {
    var url = "https://query1.finance.yahoo.com/v8/finance/chart/"+ticker+"?interval=1d&range=30y"
    fetch(cors_proxy+url, {headers: {origin: ""}}) // origin needed by cors_proxy
        .then(
            response => response.json()
        ).then(
            response_data => {
                quotes[response_data["chart"]["result"][0]["meta"]["symbol"]] = new series(ydata_to_series(response_data));
            }
        );
}

