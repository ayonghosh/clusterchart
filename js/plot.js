
/*
 * Author: Ayon Ghosh
 * Date: 15 February 2015
 */

var app = app || {};

// wrapper over actual library used to plot chart (Google Charts in this case)
app.Chart = function (el, options) {
	this.el = el;
	this.options = options;
	app.utils.extend(this.options, this.defaultOptions);
	
	google.load('visualization', '1', {packages: ['corechart']});
};

app.Chart.prototype.defaultOptions = {
	width: 800,
	height: 600
};

// function to parse API response and convert to format supported by Google Charts
app.Chart.prototype.parsePlotData = function (data) {
	this.plotData = [];
	for (var i = 0; i < data.length; i++) {
		var dataSet = [new Date(data[i].timestamp), data[i].usage];
		this.plotData.push(dataSet);
	}
};

app.Chart.prototype.plot = function () {
	var data = new google.visualization.DataTable();
	data.addColumn('datetime', 'Date');
	data.addColumn('number', 'Total Utilization (MB)');
	data.addRows(this.plotData);
	
	var chart = new google.visualization.LineChart(this.el);
    chart.draw(data, this.options);
};


