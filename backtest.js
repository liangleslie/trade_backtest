var bench_ticker = "SPY";
var data_tickers = ["QQQ","IJJ","SPY"];
const cors_proxy = "https://cors-anywhere.herokuapp.com/";
var data = []

data_tickers.push(bench_ticker);
data_tickers = data_tickers.filter(onlyUnique);
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}



// download and store latest tickers from yahoo finance
for (var ticker of data_tickers) {
    var url = "https://query1.finance.yahoo.com/v8/finance/chart/"+ticker+"?interval=1d&range=30y"
    fetch(cors_proxy+url, {headers: {origin: ""}}) // origin needed by cors_proxy
        .then(
            response => response.json()
        ).then(
            response_data => {
                data[response_data["chart"]["result"][0]["meta"]["symbol"]] = response_data;
            }
        );
}

function ydata_to_series(y_data) {
	var series = {};
	for (var i = 0; i < y_data['chart']['result'][0]['timestamp'].length; i++) {
		date = new Date(y_data['chart']['result'][0]['timestamp'][i]*1000);
		series[date] = // implement loop for high low open close
	}
	return series;
};

function series(data) {
	this.first_date = Object.keys(data).shift();
	this.data = data;
	var type;
}