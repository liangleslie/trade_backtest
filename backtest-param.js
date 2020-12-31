/* 
Input parameter definitions
all default inputs controlled by defaultInputObj
 */

const defaultInputObj = {"super_bull_instrument":"QQQ,SPY,IJJ","bull_instruments":"QQQ,SPY,IJJ","bear_instruments":"GLD,XLP","safe_stock":"TLT,IEF","short":"TLT,IEF","super_bull_threshold":"80","bull_threshold":"60","bear_threshold":"40","short_threshold":"20","start_value":"100000","benchmark":"SPY","slippage":"0.1","rebalance_frequency":"999","start_date":"01/01/2020","end_date":"12/31/2020","momentum":"1","high-low_sma":"2","inflation":"1","vix":"2","unemployment":"1","s&p_beta":"0","rolling_cut_loss_threshold":"10", "rolling_cut_loss_size":"0", "high_low_entry":"-10", "high_low_exit":"0", "inflation_entry":"0.7", "inflation_exit":"-0.2", "unemployment_entry":"-0.1", "unemployment_exit":"0", "vix_ratio_sma":"1", "vix_threshold":"0.95", "momentum_entry_periods":"100", "momentum_exit_periods":"100"};

var inputObj = defaultInputObj;

var instrumentParams = {
	key: "Instrument Parameters", collapsible: true, children:[{
	key: "Instruments", collapsible: true, children: [{
		key: "Super bull instrument"
	},{
		key: "Bull instruments"
	},{
		key: "Bear instruments"
	},{
		key: "Safe stock"
	},{
		key: "Short"
}]},{
	key: "Thresholds", collapsible: true, children: [{
		key: "Super bull threshold", units: "%"
	},{
		key: "Bull threshold", units: "%"
	},{
		key: "Bear threshold", units: "%"
	},{
		key: "Short threshold", units: "%"
}]},{
	key: "Other parameters", collapsible: true, children: [{
		key: "Start value"
	},{
		key: "Benchmark"
	},{
		key: "Slippage", units: "%"
	},{
		key: "Rebalance frequency"
	},{
		key: "Start date"
	},{
		key: "End date"
}]}]};

var indicatorParams = {
	key: "Indicator Parameters", collapsible: true, children:[{
		key: "Indicator relative weights", collapsible: true, children: [{
			key: "Momentum", units: "%"
		},{
			key: "High-Low SMA", units: "%"
		},{
			key: "Inflation", units: "%"
		},{
			key: "VIX", units: "%"
		},{
			key: "Unemployment", units: "%"
		},{
			key: "S&P Beta", units: "%"
	}]},{
		key: "Indicator Variables", collapsible: true, collapsed: true, children: [{
			key: "Rolling cut loss threshold", units: "%"
		},{
			key: "Rolling cut loss size", units: "%"
		},{
			key: "High low entry", units: "%"
		},{
			key: "High low exit", units: "%"
		},{
			key: "Inflation entry", units: "%"
		},{
			key: "Inflation exit", units: "%"
		},{
			key: "Unemployment entry", units: "%"
		},{
			key: "Unemployment exit", units: "%"
		},{
			key: "Vix ratio SMA"
		},{
			key: "Vix threshold"
		},{
			key: "Momentum entry periods"
		},{
			key: "Momentum exit periods"
	}]}
]};

var metaParam = {
	key: "Inputs", collapsible: true, children: [instrumentParams,indicatorParams]
}


/* 
Functions start here
 */


//build nested table from key
function buildTable(params, inputObj, hidden = 0, depth = 0) {
	let htmlOutput = "";
	let idFromName = params.key.toLowerCase().replaceAll(" ","_");
	let currentClassName = params.collapsed ? "expand level"+depth : "collapse level"+depth;
	htmlOutput += `<tr data-depth="${ depth }" class="${ currentClassName }" ${ hidden == 1 ? `style = "display: none;"` : ""}>
<td ${ Object.keys(inputObj).includes(idFromName) ? "" : `colspan="2"`}><div class="param">${ params.collapsible ? `<span class="toggle collapse"></span>` : "" }${ params.key }</div></td>
${ Object.keys(inputObj).includes(idFromName) ? `<td><input class="inputData" type="text" id="${ idFromName }" name="${ idFromName }" value="${ inputObj[idFromName] }">
${ params.units == "%" ? `<span>%</span>`:""}</td>` : ""}</tr>
`;
	if ("children" in params) {
		for (childParams of params.children) {
			if (params.collapsed == true) {
				htmlOutput += buildTable(childParams, inputObj, 1, depth+1)
			} else {
			htmlOutput += buildTable(childParams, inputObj, 0, depth+1)
		}}
	};
	return htmlOutput;
};

//pull input params into inputObject
function pullInputParams() {
	let inputObject = {};
	inputNodes = document.querySelectorAll(".inputData");
	for (node of inputNodes) {
		inputObject[node.name] = node.value
	};
	return inputObject;
};

tableContents = buildTable(metaParam, inputObj);
document.getElementById("paramTable").innerHTML = tableContents;
