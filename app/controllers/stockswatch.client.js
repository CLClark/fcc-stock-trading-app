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

				// window.addEventListener("resize", function(){					
				// 	chart.draw(this, options);					
				// 	console.log("resized");          		  
				//     }.bind(dTab));
			});
		},

		pollProducer: function (passedInFunction) {

			google.charts.load('current', { 'callback': allOrNothing, 'packages': ['corechart'] }); //, 'bar'd

			function allOrNothing() {
				var apiUrl = _args[0];
				var reqMethod = _args[1];
				//var cbPostLoops = _args[2]; //uncalled

				function getTheJson(apiUrl, cb) {
					ajaxFunctions.ready(
						ajaxFunctions.ajaxRequest(reqMethod, apiUrl, true, function (data) {
							cb(data);
						})
					);
				}

				getTheJson(apiUrl, function (jsonResponse) {

					var pollDashboard = document.querySelector('#pollDb');   //div
					var pollView = document.getElementById('poll-view');  //ul     
					var jsonData = JSON.parse(jsonResponse);
					//number of polls to make
					var numPolls = jsonData.length || 0;

					//for profile.html (or any poll count display)
					var pollCount = document.querySelector('#active-poll-count') || null;
					if (pollCount !== null) {
						pollCount.innerHTML = numPolls;
					}

					for (var i = 0; i < numPolls; i++) {
						//create a div for each poll
						var pId = ("poll-").concat(i);
						var jone = jsonData[i];
						addElement(pId, pollView, jone, null);
					}

					for (var i = 0; i < numPolls; i++) {
						var pId = ("poll-").concat(i);
						var jone = jsonData[i];
						var pString = pId;
						//document.getElementById(pString).parentNode.parentNode.addEventListener('click', function(element){
						var that = document.getElementById(pString).parentNode.querySelector('#show-text');
						that.addEventListener('click', showChart.bind(null, that));
					}
					passedInFunction();
					//cbPostLoops();
				});//getthejson

				function showChart(arg) {
					arg.style.display = "none"; //hide the "show results" text

					var jArray = JSON.parse(arg.parentNode.childNodes[1].getAttribute("poll-data"));
					var cData = new google.visualization.arrayToDataTable(jArray);

					var chartOptions = {
						colors: ['#212dcd'],
						bars: 'horizontal',
						bar: {
							"groupWidth": '50px'
						},
						chartArea: { left: 0, top: 0, height: '99%' },
						vAxis: { textPosition: 'none' },
						hAxis: { textPosition: 'none', 'title': 'Votes' },
						axes: { x: { all: { range: { min: 0, max: 50 } } } },
						width: '80%',
					};
					// Instantiate and draw our chart, passing in some options.
					var chart = new google.visualization.BarChart(arg.parentNode.childNodes[1]);
					var viewFinal = new google.visualization.DataView(cData)
					viewFinal.setColumns([0, 1, {
						calc: "stringify",
						sourceColumn: 1,
						type: "string",
						role: "annotation"
					}
					]);
					chart.draw(viewFinal, chartOptions);

					window.addEventListener("resize", function () {
						chart.draw(viewFinal, chartOptions);
						console.log("resized");
					}.bind(arg));
				}

				function addElement(divName, parent, polljone, options) {
					var pollCopy = JSON.parse(JSON.stringify(polljone));
					var pollChoices = pollCopy.pollData;
					//console.log(pollChoices);
					// create a new div element 
					var newWrapSup = document.createElement("div");
					newWrapSup.className = "poll-wrap-sup";
					newWrapSup.id = ("poll-wrap-sup-" + pollCopy["id"]);

					var titleDiv = document.createElement("div");
					titleDiv.className = "poll-title";
					var titleA = document.createElement("a");
					titleA.className = "poll-title";
					titleA.innerHTML = polljone.title;
					titleA.href = ("/polls/view?pid=" + pollCopy["id"]);
					titleDiv.appendChild(titleA);
					newWrapSup.appendChild(titleDiv);
					var newWrap = document.createElement("div");
					newWrap.className = "poll-wrap";
					newWrapSup.appendChild(newWrap);

					var contDiv = document.createElement("div");
					contDiv.className = "container";
					contDiv.id = "vote-controls";
					//divs: choice buttons
					//divs: add choice button               
					for (var i = 0; i < pollChoices.length - 1; i++) {

						var cNIndex = i;
						var choiceName = pollChoices[(cNIndex + 1)][0] || "";
						var choiceCount = pollChoices[(cNIndex + 1)][1] || 0;
						var cid = pollChoices[(cNIndex + 1)][2] || 0;

						//choice wrapper
						var choiceDiv = document.createElement("div");
						choiceDiv.className = "vote";
						//actual anchor
						var actionDiv = document.createElement("a");
						var voteLink = "/polls/votes?" + "pid=" + pollCopy["id"] + "&" + "cid=" + cid;
						//actionDiv.className = "vote-btn";                
						actionDiv.id = voteLink;
						actionDiv.setAttribute("poll-key", pollCopy["id"]);
						//actual button
						var btnDiv = document.createElement("div");
						btnDiv.className = "btn vote-btn";
						var choiceText = document.createElement("a");
						//btnDiv.id = "vote-btn";
						choiceText.innerHTML = choiceName || "";
						btnDiv.appendChild(choiceText);
						actionDiv.appendChild(btnDiv);
						choiceDiv.appendChild(actionDiv);
						contDiv.appendChild(choiceDiv);
						newWrap.appendChild(contDiv);

						function updateVoteCount(data) {
							var voteObj = JSON.parse(data);
							window.alert(voteObj.voteStatus);
							//redraw the GoogleChart      
						}
						//vote ajax call
						actionDiv.addEventListener('click', function () {
							var existNodeId = this.getAttribute("poll-key");
							ajaxFunctions.ajaxRequest('POST', this.id, false, function (response) {
								//RECREATE THE POLL DIV with response object
								var responseArray = JSON.parse(response);
								if (responseArray.length > 0) {
									window.location.reload(true);
									//unimplemented: redraw and update chart             	    
								}
								else if (responseArray.voteStatus == "already-voted") {
									var noVote = alert("You've already voted on this poll");
								}
							});
						}, false);
					};

					//poll placeholder
					var newDiv = document.createElement("li");
					newDiv.id = divName;
					newDiv.className = "poll-view-list-poll";
					//newDiv.innerHTML = "";
					newDiv.setAttribute("poll-key", polljone.id);
					newDiv.setAttribute("poll-title", polljone.title);
					newDiv.setAttribute("poll-data", JSON.stringify(polljone.pollData));
					newWrap.appendChild(newDiv);

					var showText = document.createElement("span");
					showText.id = "show-text";
					showText.innerHTML = "Click for Results...";
					showText.style = "color";
					newWrap.appendChild(showText);

					//add-choice button
					var newChoice = document.createElement("div");
					newChoice.className = ("add-choice");
					var actionChoice = document.createElement('a');
					var choiceBtn = document.createElement('div');
					choiceBtn.className = "btn choice-btn";
					choiceBtn.innerHTML = "New Choice";
					choiceBtn.pid = pollCopy["id"];
					actionChoice.appendChild(choiceBtn);
					newChoice.appendChild(actionChoice);
					contDiv.appendChild(newChoice);

					//add++i to poll-view ul               
					if (options == null) {
						document.getElementById('poll-view').appendChild(newWrapSup);
					} else {               //options variant (replace existing node)?          	     
						var oldNode = document.getElementById("poll-wrap-sup-" + options);
						var pareNode = oldNode.parentNode;
						pareNode.replaceChild(newWrapSup, oldNode);
					}
				} //add element
			} //all or nothing          
		} //poll producer
	}; //return statement
}());
