'use strict';
(function () {
	// Load the Visualization API and the corechart package.
	google.charts.load('current', {'packages':['corechart', 'bar']});

	// Set a callback to run when the Google Visualization API is loaded.
	//google.charts.setOnLoadCallback(drawChart);

	// Callback that creates and populates a data table,
	// instantiates the pie chart, passes in the data and
	// draws it.
	/*
	function drawChart() {

		// Create the data table.
		var data = new google.visualization.arrayToDataTable([
			['Topping', 'Votes'],
			['Mushrooms', 3],
			['Pepperoni', 2]
			]);

		// Set chart options
		var options = {
		'title':'How Much Pizza I Ate Last Night',
		'titleTextStyle': {fontSize: 20, bold: true},
		'width': '100%',
		'height':150};

		// Instantiate and draw our chart, passing in some options.
		var chart = new google.visualization.BarChart(document.getElementById('chart_div'));		
		chart.draw(data, options);
	}*/
});