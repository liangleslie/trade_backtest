/* 
Input parameter definitions
 */

var instrumentParams = {
	key: "Instrument Parameters", collapsible: true, children:[{
	key: "Instruments", collapsible: true, children: [{
		key: "Super bull instrument", defaultValue: "SPXL"
	},{
		key: "Bull instruments", defaultValue: "QQQ,SPY,IJJ"
	},{
		key: "Bear instruments", defaultValue: "GLD,XLP"
	},{
		key: "Safe stock", defaultValue: "TLT"
	},{
		key: "Short", defaultValue: "TLT"
}]},{
	key: "Thresholds", collapsible: true, children: [{
		key: "Super bull threshold", defaultValue: "80", units: "%"
	},{
		key: "Bull threshold", defaultValue: "60", units: "%"
	},{
		key: "Bear threshold", defaultValue: "40", units: "%"
	},{
		key: "Short threshold", defaultValue: "20", units: "%"
}]},{
	key: "Other parameters", collapsible: true, children: [{
		key: "Start value", defaultValue: "100000"
	},{
		key: "Benchmark", defaultValue: "SPY"
	},{
		key: "Slippage", defaultValue: "0.1", units: "%"
	},{
		key: "Rebalance frequency", defaultValue: "999"
	},{
		key: "Start date", defaultValue: "01/01/2001"
	},{
		key: "End date", defaultValue: "12/31/2020"
}]}]};

var indicatorParams = {
	key: "Indicator Parameters", collapsible: true, children:[{
	key: "Indicator relative weights", collapsible: true, children: [{
		key: "Momentum", defaultValue: "1", units: "%"
	},{
		key: "High-Low SMA", defaultValue: "1", units: "%"
	},{
		key: "Inflation", defaultValue: "1", units: "%"
	},{
		key: "VIX", defaultValue: "1", units: "%"
	},{
		key: "Unemployment", defaultValue: "1", units: "%"
	},{
		key: "S&P Beta", defaultValue: "1", units: "%"
	}]
}]};

var metaParam = {
	key: "Inputs", collapsible: true, children: [instrumentParams,indicatorParams]
}


/* 
Functions start here
 */


//build nested table from key
function buildTable(params, depth = 0) {
	let htmlOutput = "";
	let idFromName = params.key.toLowerCase().replaceAll(" ","_");
	let currentClassName = "collapse level"+depth;
	htmlOutput += `<tr data-depth="${ depth }" class="${ currentClassName }">
<td ${ "defaultValue" in params ? "" : `colspan="2"`}><div class="param">${ params.collapsible ? `<span class="toggle collapse"></span>` : "" }${ params.key }</div></td>
${ "defaultValue" in params ? `<td><input class="inputData" type="text" id="${ idFromName }" name="${ idFromName }" value="${ params.defaultValue }">
${ params.units == "%" ? `<span>%</span>`:""}</td>` : ""}</tr>
`;
	if ("children" in params) {
		for (childParams of params.children) {htmlOutput += buildTable(childParams, depth+1)}
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


tableContents = buildTable(metaParam);
document.getElementById("paramTable").innerHTML = tableContents;
