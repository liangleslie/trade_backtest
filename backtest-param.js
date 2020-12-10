var instrumentParams = [{
	key: "Instruments", collapsible: true, children: [{
		key: "Super bull instrument", collapsible: false, defaultValue: "SPXL"
	},{
		key: "Bull instruments", collapsible: false, defaultValue: "QQQ,SPY,IJJ"
	}]},
	{key: "Param Name", defaultValue: "Param Value"}
];

//build nested table from key

function buildTable(params, depth = 0) {
	var htmlOutput = "";
	var currentClassName = "collapse level"+depth;
	htmlOutput += `<tr data-depth="${ depth }" class="${ currentClassName }">
<td>${ params.collapsible ? `<span class="toggle collapse"></span>` : "" }${ params.key }</td>
${ "defaultValue" in params ? `<td>${ params.defaultValue }</td>` : ""}</tr>
`;
	if ("children" in params) {
		for (childParams of params.children) {htmlOutput += buildTable(childParams, depth+1)}
	};
	return htmlOutput;
};


tableContents = buildTable({
	key: "Instrument Parameters", collapsible: true, children: instrumentParams
});
document.getElementById("paramTable").innerHTML = tableContents