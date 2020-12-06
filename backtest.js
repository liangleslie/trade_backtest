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