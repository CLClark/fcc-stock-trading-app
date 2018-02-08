'use strict';

var STOCKSWATCH = STOCKSWATCH || (function () {
	var _args = {}; // private   
	return {
		init: function (Args) {
			_args = Args;
			// some other initialising
		},
		gc: function (givenCb) {
			/* 
			1.  call google.charts.load (with a callback)
			2.  callback inserts chart divs (allorNothiing)
			3.  getTheJson() call to apachevantage API
			4.	
			5.		
			*/
			// google.charts.load('current', { 'callback': allOrNothing, 'packages': ['corechart'] });
			google.charts.load("current", {'callback': givenCb, packages: ['annotationchart']});

			function allOrNothing() {
			}

			function getTheJson(apiUrl, cb) {
				//call to Alphavantage API, after receiving "events" Records list from Node server
				ajaxFunctions.ready(
					ajaxFunctions.ajaxRequest(reqMethod, apiUrl, true, function (data) {
						cb(data);
					})
				);
			}//getTheJson

			// getTheJson(apiUrl, function (jsonResponse) {
			// 	for (var i = 0; i < numStocks; i++) {
			// 		//add a "stock" div for each
			// 	}
			// });
		},

		drawFactory: function (stocksArray) {
			//accepts json data (ie from "fetched") and draws the chart
			return new Promise((resolve, reject) => {				
				//@stocksArray.series
				// "symbol": meta["2. Symbol"],						
				// "date": rowDate,
				// "close": rowClose,
				// "volume": rowVolume

				//data
				var dTab = new google.visualization.DataTable();
	
				// let allRows = [];
				stocksArray.forEach(form => {
					// var dt1 = new google.visualization.DataTable();	
					if(dTab.getNumberOfColumns() == 0){
						dTab.addColumn("date", "Date");				
						dTab.addColumn("number", form.symbol);								

						let elementRows = form.series.map((row) => {
							let year = parseInt(row.date.substring(0, 4));						
							let month = (parseInt(row.date.substring(5, 7))+ 1);
							let day = parseInt(row.date.substring(8));
							let rDate = new Date(row.date);
							// rDate.setFullYear(year, month, day);
							return [rDate, row.close];
						});						
						dTab.addRows(elementRows);
					} else {
						var dt2 = new google.visualization.DataTable();
						dt2.addColumn("date", "Date");				
						dt2.addColumn("number", form.symbol);
						let tempRows = form.series.map((row) => {
							let year = parseInt(row.date.substring(0, 4));						
							let month = (parseInt(row.date.substring(5, 7))+ 1);
							let day = parseInt(row.date.substring(8));
							let rDate = new Date(row.date);
							// rDate.setFullYear(year, month, day);
							return [rDate, row.close];
						});
						dt2.addRows(tempRows);
						//keep the first column and then each added "column" to dTab
						let keepCols = [1];
						for (let i = 2; i < dTab.getNumberOfColumns(); i++) {							
							keepCols.push(i);
						}
							(dTab.getNumberOfColumns() - 1);
						dTab = google.visualization.data.join(dTab, dt2, "full", [[0,0]], keepCols,[1]);
					}					
				});	
				// console.log(dTab.toJSON());					

				var chart = new google.visualization.AnnotationChart(document.getElementById('chart-super'));
				var options = {
					displayAnnotations: false,
					fill: 40				
				};
				//draw
				chart.draw(dTab, options);
				function reDraw(){					
					chart.draw(dTab, options);					
					console.log("resized");          		  
				    }
				window.addEventListener("resize",reDraw, false);
			});
		}

	}; //return statement
}());
