'use strict';

var STREAMLIB = STREAMLIB || (function () {
	// var divCB;
	var extScript; //deepstream.js
	var ourKey = "RFYNJQR3B41RMNYG";
	var dsClient;
	var apiKey;
	// var authScriptCB;
	// var apiAuth = appUrl + '/auth/check';
	// var defSearch = null;
	// var loader;
	var _args = {}; // private
	var charts = [];

	//polyfill:
	if (window.NodeList && !NodeList.prototype.forEach) {
		NodeList.prototype.forEach = function (callback, thisArg) {
			thisArg = thisArg || window;
			for (var i = 0; i < this.length; i++) {
				callback.call(thisArg, this[i], i, this);
			}
		};
	}
	return {
		init: function (Args) {

			_args = Args;
			apiKey = "";
			extScript = _args[0] || null; //callback for external script
			/* 
			divCB = _args[1];			
			authScriptCB = _args[2] || null;
			 */
			// some other initialising
			// loader = this.loadLock;
			poly();
			function poly() {
				// Production steps of ECMA-262, Edition 6, 22.1.2.1
				if (!Array.from) {
					Array.from = (function () {
						var toStr = Object.prototype.toString;
						var isCallable = function (fn) {
							return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
						};
						var toInteger = function (value) {
							var number = Number(value);
							if (isNaN(number)) { return 0; }
							if (number === 0 || !isFinite(number)) { return number; }
							return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
						};
						var maxSafeInteger = Math.pow(2, 53) - 1;
						var toLength = function (value) {
							var len = toInteger(value);
							return Math.min(Math.max(len, 0), maxSafeInteger);
						};

						// The length property of the from method is 1.
						return function from(arrayLike/*, mapFn, thisArg */) {
							// 1. Let C be the this value.
							var C = this;

							// 2. Let items be ToObject(arrayLike).
							var items = Object(arrayLike);

							// 3. ReturnIfAbrupt(items).
							if (arrayLike == null) {
								throw new TypeError('Array.from requires an array-like object - not null or undefined');
							}

							// 4. If mapfn is undefined, then let mapping be false.
							var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
							var T;
							if (typeof mapFn !== 'undefined') {
								// 5. else
								// 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
								if (!isCallable(mapFn)) {
									throw new TypeError('Array.from: when provided, the second argument must be a function');
								}

								// 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
								if (arguments.length > 2) {
									T = arguments[2];
								}
							}

							// 10. Let lenValue be Get(items, "length").
							// 11. Let len be ToLength(lenValue).
							var len = toLength(items.length);

							// 13. If IsConstructor(C) is true, then
							// 13. a. Let A be the result of calling the [[Construct]] internal method 
							// of C with an argument list containing the single item len.
							// 14. a. Else, Let A be ArrayCreate(len).
							var A = isCallable(C) ? Object(new C(len)) : new Array(len);

							// 16. Let k be 0.
							var k = 0;
							// 17. Repeat, while k < len… (also steps a - h)
							var kValue;
							while (k < len) {
								kValue = items[k];
								if (mapFn) {
									A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
								} else {
									A[k] = kValue;
								}
								k += 1;
							}
							// 18. Let putStatus be Put(A, "length", len, true).
							A.length = len;
							// 20. Return A.
							return A;
						};
					}());
				}
			}			
		},

		dsClient: function (){
			return new Promise(function (resolve, reject) {
				let dsUrl = "ws://localhost:6020" + apiKey;
				let options = {};
				const client = deepstream(dsUrl, options);
				
				//client accessor for document
				dsClient = client;

				client.login({
					// type: 'email',
					// email: 'user@example.com',
					// password: 'sesame'
				}, (success, data) => {
					if (success) {
						console.log(client.getConnectionState());
						if(data){
							console.log(data);
						}						
						resolve(client);
						defaultStock();
						console.log("login success");
						
						// data will be an object with {id: 'user-id'} plus
						// additional data specified in clientData
						// start application
						// client.getConnectionState() will now return 'OPEN'
					} else {
						console.log(client.getConnectionState());
						// extra data can be returned from the permissionHandler as client data
						// both successful and unsuccesful logins
						if(client.getConnectionState() == "CLOSED"){
							reject(client);
						}
						// client.getConnectionState() will now return
						// 'AWAITING_AUTHENTICATION' or 'CLOSED'
						// if the maximum number of authentication
						// attempts has been exceeded.
					}
					function defaultStock(){
						if (dsClient.getConnectionState() == "OPEN") {
							//check if stock already exists...
							dsClient.record.has("stock/MSFT", (error, bool) => {
								if (bool == true) {
									console.log("MSFT Default Stock");
								}
								else {		
									//emit add event
									console.log("client open; telling node server");
									dsClient.event.emit("stocks/add", "MSFT");
		
									//add stock to list records
									var id = "stock/MSFT"; //dsClient.getUid();
									dsClient.record.getRecord(id).set("symbol", "MSFT");
									let stocks = dsClient.record.getList("stocks");
									stocks.whenReady((list) => {
										list.addEntry(id);
									});
								}//else
							});//has callback		
						}
					}//defaultStock								
				});				
				// client.getConnectionState() will now return 'AUTHENTICATING'
			});
		},

		//callback for "stock/add" event
		dsAdd: function (data){
			console.log("dsAdd: " + data);
			return new Promise(function (resolve, reject) {

				function entryMaker(){
					let stockSub = document.createElement("div");
					stockSub.className = "stock-sub";
					stockSub.id = data;

					let symbol = document.createElement("div");
					symbol.className = "stock-sub-symbol"
					symbol.innerHTML = data;
					stockSub.appendChild(symbol);
					stockSub.appendChild(xMaker());
					return stockSub;				
				}
				function xMaker(){
					let xButton = document.createElement("button");
					xButton.setAttribute("symbol", data);
					xButton.className = "btn";
					xButton.addEventListener("click", function(arg){
						let which = this.getAttribute("symbol");
						let superNode = document.querySelector("#"+ data);
						superNode.setAttribute("display","none");
						deleter(which);
					}.bind(xButton));
					xButton.innerHTML = "x";
					return xButton;
				}

				//tells node to delete this chart
				function deleter(searchValue){
					if (dsClient.getConnectionState() == "OPEN") {
						//check if stock already gone...
						dsClient.record.has("stock/" + searchValue, (error, bool) => {
							if (bool == false) {
								console.log("already gone!");
							}
							else {
								//TODO: check if the symbol is valid, before emitting	
								//emit add event
								console.log("client open; telling node server");
								dsClient.event.emit("stocks/remove", searchValue);
	
								//draw a new chart
								//remove the symbol from the global stock array
							}//else
						});//has callback					
					}//open client
				}//tellnode								

				//add to list
				let stocksView = document.querySelector("#stocks-view");					
				stocksView.appendChild(entryMaker());
				

				resolve();
			});//promise
		},

		//callback for "stock/remove" event, returns the removed symbol	
		dsRemove: function (stockSym){
			console.log("dsRemove: " + stockSym);
			//resolves to a string message
			return new Promise(function (resolve, reject) {
				let toRemove = document.querySelector("#" + stockSym);
				if (toRemove == null || toRemove == "undefined") {
					reject("dsRemove: stock node not found");
				}
				else {
					let parentNode = toRemove.parentNode;
					parentNode.removeChild(toRemove);
					if (document.querySelector("#" + stockSym) == null || document.querySelector("#" + stockSym) == "undefined") {
						//remove from global array
						charts = charts.filter(stck => stck.symbol !== stockSym.toUpperCase());
						resolve(stockSym);
					}
					else {
						reject("dsRemove: node still found");
					}
				}
			});//promise
		},

		//make a call to alphavantage, returns JSON data
		fetchAlpha: function (stockSym){
			console.log("fetchAlpha");
			return new Promise(function (resolve, reject) {
				//TODO replace key 
				// let ourKey = apiKey
				if(stockSym == null || stockSym == "undefined"){ stockSym = "MSFT"}
				let alpha = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + stockSym + "&apikey=" + ourKey;
				ajaxFunctions.ready(ajaxFunctions.ajaxRequestLim("GET", alpha, 5000, (err, res, status) => {
					if(err){
						console.log("alphavantage: timeout or error : " + err);
						reject({});
					}
					resolve(JSON.parse(res));					
				}));
			});//promise
		},
		//accepts alpha object, inserts into global array (for chart drawing)
		formatAlpha: function (fetched){
			return new Promise((resolve, reject) => {
				var form = {};
				let dates = fetched["Time Series (Daily)"];
				let meta = fetched["Meta Data"];
				form.symbol = meta["2. Symbol"];
				form.info = meta["1. Information"];
				// form["series"] = [];
				let kingMaker = Object.keys(dates).map((d) => {
					return new Promise((res, rej) => {
						let rowDate = d;
						let row = dates[d];
						let rowClose = row["4. close"];
						let rowVolume = row["5. volume"];
						res({
							"symbol": meta["2. Symbol"],
							"date": rowDate,
							"close": Number(rowClose),
							"volume": Number(rowVolume)
						});						
					});
				});
				Promise.all(kingMaker)
					.then((seriesResolved) => {
						form["series"] = seriesResolved;
						resolve(form);
					})
					.catch((err) => {
						reject(err);
					});
			});//prom
		},//formatAlpha

		//add a chart to the global array
		add2Charts: function(formedRow){
			charts.push(formedRow);
			console.log("added " + formedRow.symbol + " to stocks array");
			return charts;
		},

		//remove a stock from the chart array
		delFromCharts: function(givenSymbol){
			charts = charts.filter(stck => stck.symbol !== givenSymbol);
			return charts;
		},

		getCharts: function(){
			return charts;
		},

		asyncSetup: function(){
						
		      
			document.querySelector('input#zipSearch').addEventListener("keypress", function (e) {
				var i = document.querySelector('#zipSearch').value;

				var key = e.which || e.keyCode;
				if (key === 13) { // 13 is enter
					// code for enter
					console.log("fired input: " + i);
					// var reg = new RegExp('\\b\\$[a-z]+\\b','gi');				
					// if (reg.test(i)) {					
					// Dispatch the event.
					// document.querySelector('#poll-view').dispatchEvent(adder);
					tellNode(i.toUpperCase());
					// }
				}
				// 	// let tDay = new Date();
				// 	// let timeFrame = new Date(tDay.getFullYear(), tDay.getMonth(), tDay.getDate())
				// 	// if (tDay.getHours() >= 20) {
				// 	// 	timeFrame.setDate(timeFrame.getDate() + 1);
				// 	// }
				// 	var request = ('/stocks/?sym=' + searchValue);// + "&timeframe=" + timeFrame.toISOString());
				// 	ajaxFunctions.ready(ajaxFunctions.ajaxRequestLim('GET', request, 7000, function (err, data, status) {
				// 		if(err){ console.log(err)}
				// 		else{
				// 			var barsFound = JSON.parse(data);
				// 			console.log(barsFound);							
				// 			//TODO
				// 			/* document.querySelector('#poll-view').innerHTML = "";							
				// 			functionCB(barsFound, 'poll-view', null, null);
				// 			passedInFunction();
				// 			 */
				// 			//barFormer callback
				// 			//					formerCB();
				// 		}//else						
				// 	}));//ajax request
				
			});

			function tellNode(searchValue) {
				if (dsClient.getConnectionState() == "OPEN") {
					//check if stock already exists...
					dsClient.record.has("stock/" + searchValue, (error, bool) => {
						if (bool == true) {
							console.log("already in the list!");
						}
						else {
							//TODO: check if the symbol is valid, before emitting

							//emit add event
							console.log("client open; telling node server");
							dsClient.event.emit("stocks/add", searchValue);

							//add stock to list records
							var id = "stock/" + searchValue; //dsClient.getUid();
							dsClient.record.getRecord(id).set("symbol", searchValue);
							let stocks = dsClient.record.getList("stocks");
							stocks.whenReady((list) => {
								list.addEntry(id);
							});
						}//else
					});//has callback					
				}//open client
			}//tellnode
		},

		removeStock: function (stock){
			//handle "remove" buttons
			let stocks = dsClient.record.getList( "stocks" );
			stocks.whenReady((list) => {
				//TODO: identify the stock to remove
				list.removeEntry( stock );		
			});			
		},

		naviOld: function () {
		//navigation icon+header
			var homeIcon = document.getElementById('home-icon') || null;

			function makeNaviDiv() {
				var aIcon = document.createElement("a");
				aIcon.href = "/";

				var imgIcon = document.createElement("img");
				imgIcon.src = "/public/img/vota.png";
				imgIcon.style = "height: 80px; width: auto;";
				aIcon.appendChild(imgIcon);
				return aIcon;
			}

			if (homeIcon !== null) {
				homeIcon.replaceWith(makeNaviDiv());
			}

			var apiIcon = document.getElementById('api-icon') || null;

			function makeAPIDiv() {
				var aIcon = document.createElement("a");
				aIcon.href = "https://www.yelp.com";
				var imgIcon = document.createElement("img");
				imgIcon.src = "/public/img/Yelp_trademark_RGB.png";
				imgIcon.id = "api-icon";
				aIcon.appendChild(imgIcon);
				return aIcon;
			}

			if (apiIcon !== null) {
				apiIcon.replaceWith(makeAPIDiv());
			}

			var clock = document.getElementById('clock-time') || null;
			function makeClock() {
				let cWrap = document.createElement("div");
				var now = new Date(Date.now());
				let dayForm = "";
				switch (now.getDay()) {
					case 0: dayForm = "Sunday"; break;
					case 1: dayForm = "Monday"; break;
					case 2: dayForm = "Tuesday"; break;
					case 3: dayForm = "Wednesday"; break;
					case 4: dayForm = "Thursday"; break;
					case 5: dayForm = "Friday"; break;
					case 6: dayForm = "Saturday"; break;
					default: dayForm = "";
				}

				let cFace = document.querySelector("#clockface") || null;
				if (cFace == null) {
					cFace = document.createElement("div");
					cFace.id = "clockface";
					//hh
					let ch1 = document.createElement("img"); ch1.id = "c1"; ch1.className = "c-dig";
					let ch2 = document.createElement("img"); ch2.id = "c2"; ch2.className = "c-dig";
					let cc1 = document.createElement("img"); cc1.id = "c3"; cc1.className = "c-dig";
					//mm
					let cm1 = document.createElement("img"); cm1.id = "c4"; cm1.className = "c-dig";
					let cm2 = document.createElement("img"); cm2.id = "c5"; cm2.className = "c-dig";
					let cc2 = document.createElement("img"); cc2.id = "c6"; cc2.className = "c-dig";
					//ss
					let cs1 = document.createElement("img"); cs1.id = "c7"; cs1.className = "c-dig";
					let cs2 = document.createElement("img"); cs2.id = "c8"; cs2.className = "c-dig";
					cFace.appendChild(ch1); cFace.appendChild(ch2);
					cFace.appendChild(cc1);
					cFace.appendChild(cm1); cFace.appendChild(cm2);
					cFace.appendChild(cc2);
					cFace.appendChild(cs1); cFace.appendChild(cs2);
				}
				else {
					let tMap = Array.from(now.toTimeString().substring(0, 8));
					tMap.forEach((digit, ind) => {
						if (digit == ":") { digit = ""; }
						let digHolder = document.querySelector("#c" + (ind + 1));
						digHolder.src = "/public/img/c" + digit + ".gif";
					});
				}
				let dateStr = document.createElement("span");
				dateStr.innerHTML = now.toDateString();
				cWrap.appendChild(cFace);
				cWrap.appendChild(dateStr);
				return (cWrap.innerHTML);
			}

			if (apiIcon !== null) {
				clock.innerHTML = makeClock();
				var intervalID = window.setInterval(myCallback, 1000);
				function myCallback() {
					clock.innerHTML = makeClock();
				}
			}

			let refresher = document.querySelector('#fresh-appts');
			if (refresher !== null) {
				refresher.addEventListener('click', () => {
					//resets all visible appts
					refresher.className = refresher.className + " w3-spin"; //spin the image
					let resetApptsList = document.querySelector("#appts-view");
					if (resetApptsList.hasChildNodes()) {
						while (resetApptsList.firstChild) {
							resetApptsList.removeChild(resetApptsList.firstChild);
						}
						authScriptCB(false);
					} else {
						authScriptCB(false);
					}
				}, false);//event listener "click"
			}//refresher if

		},

		fbControl: function (cb) {
			window.fbAsyncInit = function () { };
			// Load the SDK asynchronously
			(function (d, s, id) {
				var js, fjs = d.getElementsByTagName(s)[0];
				if (d.getElementById(id)) return;
				js = d.createElement(s); js.id = id;
				js.src = "https://connect.facebook.net/en_US/sdk.js";
				fjs.parentNode.insertBefore(js, fjs);
			}(document, 'script', 'facebook-jssdk'));

		},

		chooser: function (passedInFn) {
			var cButtons = document.querySelectorAll(".poll-wrap-sup") || null;
			for (var cButton of cButtons) {
				if (cButton.className !== "poll-wrap-sup appt-wrap-sup") {
					//add a new choice to an existing poll					
					cButton.addEventListener('click', clickHandle.bind(cButton), false);//click listener					
				}//classname check
			}//loop

			/*			Search Result bar clicks (add and remove)			*/
			function clickHandle() {
				//lockpic on
				loader(true);
				var tDay = new Date();
				// tDay.setHours(21); //for testing
				var toDate = new Date(tDay.getFullYear(), tDay.getMonth(), tDay.getDate())
				if (tDay.getHours() >= 20) {
					toDate.setDate(toDate.getDate() + 1);
					// toDate.setDate(toDate.getDate() - 1); //for testing
					// console.log('if passed');
				}
				var keyName = this.querySelector('.poll-view-list-poll');			
				let that = this;
				that.querySelector(".show-text").innerHTML = "please hold...";
				//if "app key" check
				if (!that.hasAttribute("appt-key")) {
					//post server for 'this' bar and 'today'					
					ajaxFunctions.ajaxRequestLim('POST', '/bars/db?date=' + toDate.toISOString() + "&" + "bid=" + keyName.getAttribute("poll-key"), 10000,
						function (err, response, status) {
							let respJSON = JSON.parse(response);
							if (status == 403) {
								//lockpic off
								loader(false);
								that.querySelector(".show-text").innerHTML = "Sign in to book...";
								alert("please sign in ...");
								that.removeEventListener('click', clickHandle);
								return;
							}
							else if (respJSON == null) {
								//lockpic off
								loader(false);
								that.querySelector(".show-text").innerHTML = "click to book...";
								alert("please wait...");
								that.removeEventListener('click', clickHandle);
								return;
							}
							else {
								that.setAttribute("style", "border-color: #ebc074; background-color: #f5deb7");
								that.querySelector(".show-text").innerHTML = "booked!";
								that.querySelector(".show-text").setAttribute("style", "color: #f15c00");
								//if keys match
								if (keyName.getAttribute("poll-key") == respJSON["appt"]["yelpid"]) {
									//append the new "appt-key" to this bar div
									that.setAttribute("appt-key", respJSON["appt"]["_id"]);
								}
							}
							//lockpic on
							loader(true);
							//execute AUTHLIB.authScript(false) as a cb
							authScriptCB(false);
						});//ajax
				} else {
					//click action to "unbook" this bar
					//lockpic off
					loader(false);
					deleteCB(that);
				}//else

				function deleteCB(arg) {
					var keyS = arg.getAttribute("appt-key");
					var titleS = arg.title;
					arg.setAttribute("style", "border-color: unset; background-color: unset");
					let zat = arg;
					ajaxFunctions.ajaxRequest('DELETE', '/bars/db?appt=' + keyS, false, function (response2) {

						let pareOut = document.querySelector("#appts-view");
						pareOut.removeChild(pareOut.querySelector('[appt-key=\"' + keyS + '\"').parentNode.parentNode.parentNode);

						zat.querySelector(".show-text").innerHTML = "click to book...";
						zat.querySelector(".show-text").setAttribute("style", "");
						zat.removeAttribute("appt-key");
						//execute AUTHLIB.authScript(false) as a cb
						authScriptCB(false);
					});
					//					 }
				}//deleteCB function			
			}// clickHandle function
		},//chooser

		authScript: function (zipIt) {		

			function makeDiv() {
				var newSpan2 = document.createElement("div");
				newSpan2.id = "login-nav";
				var aPro1 = document.createElement("a");
				aPro1.className = "menu";
				aPro1.href = "/profile";
				aPro1.innerHTML = "my Night";
				var aLog1 = document.createElement("a");
				aLog1.className = "menu";
				aLog1.href = "/logout";
				aLog1.innerHTML = "Logout";
				var pBar = document.createElement("p");
				pBar.innerHTML = "|";

				newSpan2.appendChild(aLog1);
				return newSpan2;
			}

			function makeDefaultDiv() {
				var newSpan = document.createElement("div");
				newSpan.id = "login-nav";
				var aPro = document.createElement("a");
				var aLog = document.createElement("div");
				aLog.className = "btn";
				aLog.id = "login-btn";
				var iBar = document.createElement("img");
				iBar.width = "24";
				iBar.height = "24";
				iBar.src = "https://static.xx.fbcdn.net/rsrc.php/v3/yC/r/aMltqKRlCHD.png";
				iBar.alt = "app-facebook";
				var pText = document.createElement("p");
				pText.innerHTML = "Sign in with Facebook";
				newSpan.appendChild(aPro);
				aPro.appendChild(aLog);
				aLog.appendChild(iBar);
				aLog.appendChild(pText);
				return newSpan;

			}
			//resets navigator placeholder when a new auth call is made
			function resetNavi() {
				var resetSpan = document.createElement("span");
				resetSpan.id = "auth-container";
				return resetSpan;
			}

			ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', apiAuth, false, function (data) {
				//reset navi for new auth call
				let resetAttempt = document.querySelector("#login-nav");

				if (resetAttempt !== null) {
					resetAttempt.replaceWith(resetNavi());
				}

				var authObj = JSON.parse(data);
				var authNode = document.getElementById('auth-container');
				var reg = new RegExp('^(\\d\\d\\d\\d\\d)$');
				if (reg.test(authObj.zipStore) && zipIt) { 
					//zipIt prevents search when authScript called elsewhere
					var keyup = new Event('keyup');
					document.querySelector('#zipSearch').value = authObj.zipStore;
					document.querySelector('input#zipSearch').dispatchEvent(keyup);
				}

				if (authObj.authStatus == true) {
					authNode.replaceWith(makeDiv()); //login header placement
					if (document.querySelector("#appts-img") == null) {
						document.querySelector("#profile-navi").insertBefore(makeAppts("My Appointments:"), document.querySelector("#fresh-appts"));
					}
					apptFind();
				}
				else if (authObj.authStatus == false) {
					//remove appts div "profile-container" because "not authed"
					document.querySelector('#profile-container').remove();
					if (authNode !== null) {
						authNode.replaceWith(makeDefaultDiv());
						document.querySelector('#login-btn').addEventListener('click', function () {
							location.replace('/auth/facebook');
						});
					}
					//remove lockpic
					loader(false);
				}//authObj.authStatus false, else
			}));

			function makeAppts(addText) {
				var newSpanTxt = document.createElement("img");
				//				newSpanTxt.className = "alternate";
				newSpanTxt.id = "appts-img";
				newSpanTxt.src = "public/img/myappointments.png";
				newSpanTxt.alt = "My Appointments: " + addText;
				newSpanTxt.addEventListener('click', () => {
					let clickEv = new Event('click');
					document.querySelector("#fresh-appts").dispatchEvent(clickEv);
				}, false);
				return newSpanTxt;
			}

			//query server for my appointments
			function apptFind() {
				var tempText = document.querySelector("#appts-text");
				if (tempText !== null) {
					tempText.innerHTML = "Loading...";
					//toggle lock pic
					loader(true);
				}

				//appointment functions
				var proCon = document.querySelector("#profile-container") || null;
				var request = ('/bars/db?');
				//1. find appts loaded on current page
				var haveAppts = document.querySelector("#appts-view");
				var hApptsList = haveAppts.querySelectorAll(".poll-view-list-poll");
				var ak2Add = [];
				let qString;

				for (var i = 0; i < hApptsList.length; i++) {
					let ak = hApptsList[i].getAttribute("appt-key");
					if (ak !== null) {
						ak2Add.push("appts[]=" + ak);
					}
				}
				if (ak2Add.length > 0) {
					qString = ak2Add.join("&");
					request += qString;
				}
				//2. get appt-key of those appts
				//3. append the appt-keys to the request path
				//4. xhr
				ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', request, false, function (data) {
					if (tempText !== null) { tempText.innerHTML = "My Appointments:"; }
					var apptsFound = JSON.parse(data);
					console.log(apptsFound);
					//no "new" bars compared to pre-delete					 
					if (apptsFound.barsFound == "none") {
						proCon.setAttribute("style", "display: unset");
						// proCon.appendChild(makeAppts("none found"));
						//lockpic off
						loader(false);
					} else {
						proCon.setAttribute("style", "display: unset");
						//third arg is div class //divCB is called within barFormer.addElement
						apptsFound.sort(function (a, b) {
							let aTime = new Date(a.appt["timestamp"]);
							let bTime = new Date(b.appt["timestamp"]);
							return aTime.getTime() - bTime.getTime();
						});
						divCB(apptsFound, "appts-view", { "classText": " appt-wrap-sup" }, null);
						addDeleteDiv();
						//toggle lock pic
						loader(false);
					}
					//unspin the icon
					let refreshIcon = document.querySelector('#fresh-appts')
					refreshIcon.className = refreshIcon.className.substring(0, (refreshIcon.className.length - 9));
				}));

				function addDeleteDiv() {

					var pWrapSup = document.querySelectorAll(".appt-wrap-sup") || null;
					for (var pWrapper of pWrapSup) {
						if (pWrapper.querySelector(".delete-poll") == null) {
							var deletePoll = document.createElement("div");
							deletePoll.className = ("delete-poll");
							var actionDel = document.createElement('a');
							var pollDataDiv = pWrapper.querySelector(".poll-view-list-poll");
							var keyOfPoll = pollDataDiv.getAttribute("appt-key");
							var titleOfPoll = pollDataDiv.getAttribute("poll-title");
							actionDel.setAttribute("appt-key", keyOfPoll);
							actionDel.setAttribute("title", titleOfPoll);
							var pollDel = document.createElement('div');
							pollDel.className = "btn delete-btn";
							pollDel.id = "delete-btn";
							pollDel.innerHTML = "<span class=\"del-text\">remove</span>";
							pollDel.setAttribute("style", "margin: auto;");
							actionDel.appendChild(pollDel);
							deletePoll.appendChild(actionDel);
							pWrapper.appendChild(deletePoll);

							actionDel.addEventListener('click', deleteCB.bind(actionDel), false);

							function deleteCB() {
								var keyS = this.getAttribute("appt-key");
								var titleS = this.title;
								var confirmDel = confirm("Expire your appointment: " + titleS + "?");
								let that = this;
								if (confirmDel == true) {									
									ajaxFunctions.ajaxRequestLim('DELETE', '/bars/db?appt=' + keyS, 5000, function (err, response, status) {
										if (err) { console.log("request error \'delete\'"); }
										else {											
											let nodeToRemove = that.parentNode.parentNode;
											if (nodeToRemove.className == "poll-wrap-sup appt-wrap-sup") {
												let nPare = nodeToRemove.parentNode;
												nPare.removeChild(nodeToRemove);
											}
											let pollRoot = document.querySelector("#poll-view");
											let resetThis = pollRoot.querySelector("div[appt-key='" + keyS + "']");
											//existing super-bar node
											if (resetThis !== null) {
												resetThis.setAttribute("style", "");
												resetThis.querySelector(".show-text").innerHTML = "click to book...";
												resetThis.querySelector(".show-text").setAttribute("style", "");
												resetThis.removeAttribute("appt-key");
											}
										}//else err
									});
								}
							}//deleteCB
						}//has .delete div child
					}
				}//function addDeelteteltelteltlet
			}//apptFind()
		},

		loadExtScript: function (givenUrl) {
			return new Promise(function (resolve, reject) {
				var s;
				s = document.createElement("script");
				if(givenUrl == null || givenUrl == "undefined"){
				s.src = extScript;
				}else{
				s.src = givenUrl;
				}				
				s.onload = resolve;
				s.onerror = reject;
				document.head.appendChild(s);
			});
		},
		
		loadLock: function loadLock(boo) {
			let lockPic = document.querySelector('#loading');
			if (boo === true) {
				lockPic.style = "";
				lockPic.setAttribute('lock', "on");
			}
			else if (boo === false) {
				lockPic.style = "display: none";
				lockPic.setAttribute('lock', "off");
			}
			else {
				if (lockPic.getAttribute('lock') == 'on') {
					lockPic.style = "display: none";
					lockPic.setAttribute('lock', "off");
				} else {
					lockPic.style = "";
					lockPic.setAttribute('lock', "on");
				}
			}
		}
	};
})();
