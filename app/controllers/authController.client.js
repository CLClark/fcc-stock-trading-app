'use strict';

var AUTHLIB = AUTHLIB || (function () {
	var divCB;
	var extScript;
	var authScriptCB;
	var apiAuth = appUrl + '/auth/check';
	var defSearch = null;
	var loader;
	var _args = {}; // private
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
			divCB = _args[0];
			extScript = _args[1] || null; //callback for external script
			authScriptCB = _args[2] || null;
			// some other initialising
			loader = this.loadLock;
		},
		navi: function () { 
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

		loadExtScript: function () {
			return new Promise(function (resolve, reject) {
				var s;
				s = document.createElement('script');
				s.src = extScript;
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
