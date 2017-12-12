'use strict';

(function () {

	// Load the Visualization API and the corechart package.
	loader.google.charts.load('current', {'callback': allOrNothing,'packages':['corechart', 'bar']});

	function allOrNothing(){
		var apiUrl = '/polls';

		function getTheJson(apiUrl, cb){
			ajaxFunctions.ready(
				ajaxFunctions.ajaxRequest('GET', apiUrl, true, function(data){			
					cb(data);
				})
			);	
		}

		getTheJson(apiUrl, function(jsonResponse){		
			var pollDashboard = document.querySelector('#pollDb');	//div
			var pollView = document.getElementById('poll-view');	//ul		
			var jsonData = JSON.parse(jsonResponse);
			//number of polls to make
			var numPolls = jsonData.length || 0;

			for(var i = 0; i < numPolls; i++){
				//create a div for each poll
				var pId = ("poll-").concat(i);
				var jone = jsonData[i];				
				addElement(pId, pollView);
			}
			for(var i = 0; i < numPolls; i++){
				var pId = ("poll-").concat(i);
				var jone = jsonData[i];
				//drawBack(jone, pId);
				//function drawBack(jdata1, pdata1){					
					//drawAPoll(jdata1, pdata1)
					//function drawAPoll(jdata3, pdata3){
						var jArray = jone.pollData || [];
						pString = pId;
						var cData = new loader.google.visualization.arrayToDataTable(jArray);
						//var view = new loader.google.visualization.DataView(cData);
						var options = {
							chart: { title: jone.title },
							titlePosition: 'in',
							bars: 'horizontal',
							vAxis: { textPosition: 'none', 'title': '' },	
							height: 200,
							legend: { position: "top" },							
							//hAxis: {maxValue: 200},
							//axisTitlesPosition: 'none',
							axes: { x: {all: {range: {min: 0, max: 50 }}}}
						};
						// Instantiate and draw our chart, passing in some options.
						var chart = new loader.google.charts.Bar(document.getElementById(pString)); 
						chart.draw(cData, loader.google.charts.Bar.convertOptions(options));
					//}
				//}
			}
		});
		
		function addElement (divName, parent) {
			// create a new div element 
			var newDiv = document.createElement("li");
			var newWrap = document.createElement("div");
			newWrap.className = "poll-wrap";
			newDiv.id = divName;
			newWrap.appendChild(newDiv);
			//add li to poll-view ul
			document.getElementById('poll-view').appendChild(newWrap);			
		}
	}


})();
