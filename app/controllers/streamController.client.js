'use strict';

var STREAMLIB = STREAMLIB || (function () {

	var extScript;
	var ourKey;
	var dsClient;
	var apiKey;	
	var appUrl = window.location.host;
	var apiAuth = appUrl + '/stock/';
	var dsUrl;	
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
			ourKey = "demo";
			apiKey = "";
			extScript = _args[0] || null; //callback for external script
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
	
				// console.log(window.location); //testing
				if(window.location.protocol == "https:"){
				dsUrl = ("wss://" + window.location.hostname);	}
				else { dsUrl = ("ws://" + window.location.hostname); }
				
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
				});
				// client.getConnectionState() will now return 'AUTHENTICATING'
			});
		},

		//callback for "stock/add" event
		dsAdd: function (data, rawJson){
			return new Promise(function (resolve, reject) {
				console.log("dsAdd: " + data + " " + rawJson);
				function entryMaker(){
					let stockSubWrap = document.createElement("div");
					stockSubWrap.className = "stock-sub-wrap"
					stockSubWrap.id = ("wrap-" + data);
 				
					let stockSub = document.createElement("div");
					stockSub.className = "stock-sub";
					stockSub.id = data;

					let symbol = document.createElement("div");
					symbol.className = "stock-sub-symbol"
					symbol.innerHTML = data;
					stockSub.appendChild(symbol);
					stockSub.appendChild(xMaker());

					stockSubWrap.appendChild(stockSub);

					if (rawJson !== "undefined" && rawJson !== null) {
						let stockDat = document.createElement("div");
						stockDat.className = "stock-sub-dat";
						stockDat.id = ("stock-dat-" + data);
						console.log(rawJson);
						let meta = rawJson["series"];
						let sDatUL = document.createElement("ul");
						let dateTag = document.createElement("li");						
						dateTag.innerText = (("DATE: ") + meta[0]["date"]);
						sDatUL.appendChild(dateTag);
						let closeV = document.createElement("li");						
						closeV.innerText = ("CLOSE: " + meta[0]["close"]);
						sDatUL.appendChild(closeV);
						stockDat.appendChild(sDatUL);
						stockSubWrap.appendChild(stockDat);
					}		
					return stockSubWrap;				
				}

				//the DOM button to remove the stock
				function xMaker(){
					let xButton = document.createElement("button");
					xButton.setAttribute("symbol", data);
					xButton.className = "btn";
					xButton.addEventListener("click", function(arg){
						var which = this.getAttribute("symbol");
						let superNode = document.querySelector("#"+ data);
						superNode.setAttribute("display","none");
						deleter(which);
					}.bind(xButton));
					xButton.innerHTML = "x";
					return xButton;
				}

				//tells node to delete this chart
				function deleter(searchValue){
					let recordName = "stock/" + searchValue;
					if (dsClient.getConnectionState() == "OPEN") {
						//check if stock already gone...
						dsClient.record.has(recordName, (error, bool) => {
							if (bool == false) {
								console.log(error + ": stock not found!");
							}
							else{
								let stocks = dsClient.record.getList( "stocks" );
								stocks.whenReady((list) => {									
									list.removeEntry( searchValue );
									//TODO: check if the symbol is valid, before emitting									
									console.log("telling node server");																											
									//delete the record
									let rec = dsClient.record.getRecord(recordName);
									rec.delete();
									dsClient.event.emit("stocks/remove", searchValue);		
								});	
							}//else
						});//has callback					
					}//open client
				}//tellnode								

				//add to list
				let stocksView = document.querySelector("#stocks-view");					
				stocksView.appendChild(entryMaker());				
				resolve({});
			});//promise
		},

		//callback for "stock/remove" event, returns the removed symbol	
		dsRemove: function (stockSym){
			console.log("dsRemove: " + stockSym);
			//resolves to a string message
			return new Promise(function (resolve, reject) {
				let toRemove = document.querySelector("#wrap-" + stockSym);
				if (toRemove == null || toRemove == "undefined") {
					reject("dsRemove: stock node not found");
				}
				else {
					let parentNode = toRemove.parentNode;
					parentNode.removeChild(toRemove);
					if (document.querySelector("#wrap-" + stockSym) == null || document.querySelector("#wrap-" + stockSym) == "undefined") {
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

		//make a call to node server for alphavantage, returns JSON data
		fetchAlpha: function (stockSym) {
			console.log("fetchAlpha");
			return new Promise(function (resolve, reject) {
				if (stockSym == null || stockSym == "undefined") { stockSym = "MSFT" }
				let getPath  = "/stock/" + stockSym;
				ajaxFunctions.ready(ajaxFunctions.ajaxRequestLim("GET", getPath, 10000, (err, res, status) => {
					let resObj = JSON.parse(res);
					// console.log(res);
					if (err) {
						console.log("alphavantage: timeout or error : " + err);
						reject({});
					}
					else {
						resolve(JSON.parse(res));
					}
				}));
			});//promise
		},

		//make a call directly to alphavantage api, returns JSON data
		fetchAlphaDirect: function (stockSym) {
			console.log("fetchAlpha2");
			return new Promise(function (resolve, reject) {
				if (stockSym == null || stockSym == "undefined") { stockSym = "MSFT" }
				let alphaApi = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + stockSym + "&apikey=" + ourKey;
				ajaxFunctions.ready(ajaxFunctions.ajaxRequestLim("GET", alphaApi, 8000, (err, res, status) => {
					let resObj = JSON.parse(res);
					if (err) {
						console.log("alphavantage: timeout or error : " + err);
						reject({});
					}
					else {
						resolve(JSON.parse(res));
					}
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

		//validates the alpha api response
		validateAlpha: function (alphaRes) {
			return new Promise((resolve, reject) => {
				//validate the ticker symbol, based on alphavantage response
				let verifiedSym = alphaRes["Meta Data"]["2. Symbol"];
				if (verifiedSym == null || verifiedSym == "undefined") {
					let searchBar = document.querySelector("#zipSearch");
					searchBar.value = "";
					console.log("symbol not validated");
					reject(false);
				}
				else if (alphaRes.hasOwnProperty("Error Message")) {
					console.log("Error Message: true");
					reject(false);
				}
				else {
					console.log("symbol verified");
					//returns api response
					resolve(alphaRes);
				}	
			});
		},		

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

		asyncSetup: function(fetcher, validator){
			//fetcher calls alphavantage api, passing in symbol
			//validator receives json and performs the check
		      
			document.querySelector('input#zipSearch').addEventListener("keypress", function (e) {
				var i = document.querySelector('#zipSearch').value;

				var key = e.which || e.keyCode;
				if (key === 13) { // 13 is enter
					// code for enter
					console.log("fired input: " + i);

					let userInput = i.toUpperCase();

					fetcher(userInput)
					.then((symBack) => {
						return validator(symBack);
					})
					.then(
						(alphaJSON) => {
						document.querySelector('#zipSearch').value = "";
						let symbol = alphaJSON["Meta Data"]["2. Symbol"];
						tellNode(symbol);
					},
						(rejected) => {
						document.querySelector('#zipSearch').value = "";
						console.log("symbol rejected");	
					})
					.catch((e) => {
						document.querySelector('#zipSearch').value = "error";
						console.log(e);
					});					
				}				
			});

			function tellNode(tickerInput) {
				if (dsClient.getConnectionState() == "OPEN") {
					//check if stock already exists...
					let searchValue = "stock/" + tickerInput;
					dsClient.record.has(searchValue, (error, bool) => {
						let stocks = dsClient.record.getList("stocks");
						stocks.whenReady((list) => {
							// console.log(list);
							//exists as record, and exists in list?
							let listFrom = Array.from(list.getEntries());
							console.log(listFrom);
							let listBool = listFrom.includes(searchValue);
							if (bool == true && listBool == true) {
								throw "already a record! and in list!";
							}
							else {
								//emit add event
								console.log("client open; telling node server");
								//add stock to list records								
								dsClient.record.getRecord(searchValue).set("symbol", tickerInput);
								stocks.whenReady((list) => {
									list.addEntry(searchValue);
									dsClient.event.emit("stocks/add", searchValue);
								});
							}//else
						})//list ready		

					});//has callback	
				}//open client
			}//tellnode
		},

		//ds list removal
		removeStock: function (stock){
			//handle "remove" buttons
			let stocks = dsClient.record.getList( "stocks" );
			stocks.whenReady((list) => {
				//TODO: identify the stock to remove
				list.removeEntry( stock );		
			});			
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
