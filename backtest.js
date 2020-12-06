var bench_ticker = "SPY";
var data_tickers = ["QQQ","IJJ","SPY"];
data_tickers.push(bench_ticker);
data_tickers = data_tickers.filter(onlyUnique);
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

// for (var ticker of data_tickers) {
//     var url = "https://query1.finance.yahoo.com/v8/finance/chart/"+ticker+"?interval=1d&range=30y"
//     fetch(url, {mode: 'no-cors'}) // temporarily enabling 'no-cors'
//         .then(
//             response => response.text() // .json(), etc.
//             // same as function(response) {return response.text();}
//         ).then(
//             html => console.log(html)
//         );
// }

const url = "https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=30y"
fetch(url).then(
        response => response.json()
    ).then(
        data => console.log(data)
    );