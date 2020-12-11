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
		key: "Short", defaultValue: "VXX"
}]},{
	key: "Thresholds", collapsible: true, children: [{
		key: "Super bull threshold", defaultValue: "80%"
	},{
		key: "Bull threshold", defaultValue: "60%"
	},{
		key: "Bear threshold", defaultValue: "40%"
	},{
		key: "Short threshold", defaultValue: "20%"
}]},{
	key: "Other parameters", collapsible: true, children: [{
		key: "Slippage", defaultValue: "0.1%"
	},{
		key: "Rebalance frequency", defaultValue: "999"
	},{
		key: "Start date", defaultValue: "01/01/2001"
	},{
		key: "End date", defaultValue: "12/31/2020"
}]}]};

var indicatorParams = {
	key: "Indicator Parameters", collapsible: true, children:[{
	key: "Indicator weights", collapsible: true, children: [{
		key: "Momentum", defaultValue: "1%"
	},{
		key: "High-Low SMA", defaultValue: "1%"
	},{
		key: "Inflation", defaultValue: "1%"
	},{
		key: "VIX", defaultValue: "1%"
	},{
		key: "Unemployment", defaultValue: "1%"
	},{
		key: "S&P Beta", defaultValue: "1%"
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
	var htmlOutput = "";
	var idFromName = params.key.toLowerCase().replaceAll(" ","-");
	var currentClassName = "collapse level"+depth;
	htmlOutput += `<tr data-depth="${ depth }" class="${ currentClassName }">
<td><div class="param">${ params.collapsible ? `<span class="toggle collapse"></span>` : "" }${ params.key }</div></td>
${ "defaultValue" in params ? `<td><input class="inputData" type="text" id="${ idFromName }" name="${ idFromName }" value="${ params.defaultValue }"></td>` : ""}</tr>
`;
	if ("children" in params) {
		for (childParams of params.children) {htmlOutput += buildTable(childParams, depth+1)}
	};
	return htmlOutput;
};

//pull input params into inputObject
function pullInputParams() {
	var inputObject = {};
	inputNodes = document.querySelectorAll(".inputData");
	for (node of inputNodes) {
		inputObject[node.name] = node.value
	};
	return inputObject;
};


tableContents = buildTable(metaParam);
document.getElementById("paramTable").innerHTML = tableContents;
