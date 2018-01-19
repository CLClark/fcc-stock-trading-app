'use strict';

var AUTHLIB = AUTHLIB || (function () {
	var divCB;
	var extScript;
	var authScriptCB;
	var apiAuth = appUrl + '/auth/check';
	var defSearch = null;
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
	return{
		init : function(Args) {
			_args = Args;
			divCB = _args[0];
			extScript = _args[1] || null; //callback for external script
			authScriptCB = _args[2] || null;			
			// some other initialising
		},
		navi : function(){ ///navigation icon

			var homeIcon = document.getElementById('home-icon') || null;

			function makeNaviDiv(){

				var aIcon = document.createElement("a");
				aIcon.href = "/";		
				var imgIcon = document.createElement("img");
				imgIcon.src = "/public/img/vota.png";
				imgIcon.style = "height: 80px; width: 80px;";
				aIcon.appendChild(imgIcon);
				return aIcon;
			}

			if(homeIcon !== null){
				homeIcon.replaceWith(makeNaviDiv());
			}
			
			var apiIcon = document.getElementById('api-icon') || null;			
			function makeAPIDiv(){

				var aIcon = document.createElement("a");
				aIcon.href = "https://www.yelp.com";		
				var imgIcon = document.createElement("img");
				imgIcon.src = "/public/img/Yelp_trademark_RGB.png";
				imgIcon.id = "api-icon";				
				aIcon.appendChild(imgIcon);
				return aIcon;
			}
			
			if(apiIcon !== null){
				apiIcon.replaceWith(makeAPIDiv());
			}
			
			var clock = document.getElementById('clock-time') || null;			
			function makeClock(){
				
				var now = new Date(Date.now());				
				let dayForm = "";
				switch (now.getDay()) {
		                           case 0:	dayForm = "Sunday";	break;		                           
		                           case 1:	dayForm = "Monday";	break;
		                           case 2:	dayForm = "Tuesday";	break;
		                           case 3:	dayForm = "Wednesday";	break;
		                           case 4:	dayForm = "Thursday";	break;
		                           case 5:	dayForm = "Friday";	break;
		                           case 6:	dayForm = "Saturday";	break;
		                           default: dayForm = "";
				}		                           
//				return (now.toLocaleString() + "<br>" + "tonight, " +dayForm);
				return (now.toUTCString());
			}
			
			if(apiIcon !== null){
				clock.innerHTML = makeClock();
				var intervalID = window.setInterval(myCallback, 1000);				
				function myCallback() {
				  clock.innerHTML = makeClock();
				}				
			}
		},
		
		fbControl : function(cb){ 
			
			// This is called with the results from from FB.getLoginStatus().
			function statusChangeCallback(response) {
				console.log('statusChangeCallback');
				console.log(response);
				// The response object is returned with a status field that lets the
				// app know the current login status of the person.
				// Full docs on the response object can be found in the documentation
				// for FB.getLoginStatus().				
				if (response.status === 'connected') {
					// Logged into your app and Facebook.
//					testAPI(appUrl +"/auth/facebook");					
				} else if (response.status === 'not_authorized') {
					document.getElementById('status').innerHTML = 'FB authorized ' +
					'app: not_authorized.';
//					testAPI(appUrl +"/auth/facebook");		
				} else {
					// The person is not logged into your app or we are unable to tell.
					document.getElementById('status').innerHTML = 'Please log ' +
					'into this app.';
//					testAPI(appUrl +"/auth/facebook");
				}
			}	

			// This function is called when someone finishes with the Login
			// Button.  See the onlogin handler attached to it in the sample
			// code below.
			function checkLoginState() {
				FB.getLoginStatus(function(response) {
					statusChangeCallback(response);
				});
			}

			window.fbAsyncInit = function() {
			};

			// Load the SDK asynchronously
			(function(d, s, id) {
				var js, fjs = d.getElementsByTagName(s)[0];
				if (d.getElementById(id)) return;
				js = d.createElement(s); js.id = id;
				js.src = "https://connect.facebook.net/en_US/sdk.js";
				fjs.parentNode.insertBefore(js, fjs);
			}(document, 'script', 'facebook-jssdk'));

			// Here we run a very simple test of the Graph API after login is
			// successful.  See statusChangeCallback() for when this call is made.
			function testAPI(apiPath) {
				ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', apiPath , false, function (data) {					
					var authObj = JSON.parse(data);
					console.log(authObj);
				}));				
//			
			}	  				  
		},
		
		chooser : function(passedInFn){
			var cButtons = document.querySelectorAll(".poll-wrap-sup") || null;				
			for (var cButton of cButtons) {
				if(cButton.className !== "poll-wrap-sup appt-wrap-sup"){
					//add a new choice to an existing poll					
					cButton.addEventListener('click', clickHandle.bind(cButton), false);//click listener					
				}//classname check
			}//loop
			
			function clickHandle() {
				var today = new Date();
				var keyName = this.querySelector('.poll-view-list-poll');
//				console.log(keyName.getAttribute("poll-key"));						
				let that = this;
				that.querySelector("#show-text").innerHTML = "please hold...";
				if(!that.hasAttribute("appt-key")){//if app key check					
					ajaxFunctions.ajaxRequest('POST', '/bars/db?date=' + today.toISOString() + "&" + "bid=" + keyName.getAttribute("poll-key"), false, function (response) {
						let respJSON = JSON.parse(response);
						
						if(respJSON.hasOwnProperty("note")){
							that.querySelector("#show-text").innerHTML = "please sign in to book...";
							that.removeEventListener('click', clickHandle);
						}
						else{
							that.setAttribute("style","border-color: #ebc074; background-color: #f5deb7");								
							that.querySelector("#show-text").innerHTML = "booked!";
							that.querySelector("#show-text").setAttribute("style","color: #f15c00");
						}
						if(keyName.getAttribute("poll-key") == respJSON["yelpid"]){
							that.setAttribute("appt-key", respJSON["appt-key"]);//									
						}//if keys match
						authScriptCB(false);
					});//ajax
				}else{
					deleteCB(that);
				}//else
				
				function deleteCB(arg) {
					var keyS = arg.getAttribute("appt-key");
					var titleS = arg.title;
					arg.setAttribute("style","border-color: unset; background-color: unset");
					 let zat = arg;
//					 if(confirmDel == true){
					 ajaxFunctions.ajaxRequest('DELETE', '/bars/db?appt=' + keyS, false, function (response2) {
//						 document.querySelectorAll(".appt-wrap-sup").querySelector();
//						 zat.parentNode.parentNode.setAttribute("style","display: none");
						 zat.querySelector("#show-text").innerHTML = "click to book...";
						 zat.querySelector("#show-text").setAttribute("style","");
						 zat.removeAttribute("appt-key");
						 authScriptCB(false);
					 });
//					 }
				}//deleteCB function			
			}//function
		},
		
		authScript : function(zipIt){

			//var naviContainer = document.getElementById('navi') || null;
			//var authContainer = document.getElementById('auth-container') || null;			

			function makeDiv(){
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
				newSpan2.appendChild(aPro1);
				newSpan2.appendChild(pBar);
				newSpan2.appendChild(aLog1);
				return newSpan2;
			}

			function makeDefaultDiv(){
				var newSpan = document.createElement("div");
				newSpan.id = "login-nav";
				var aPro = document.createElement("a");
//				aPro.href = "/auth/facebook";		
				var aLog = document.createElement("div");
				aLog.className = "btn";
				aLog.id = "login-btn";
				var iBar = document.createElement("img");
				iBar.width = "24";
				iBar.height = "24";
				iBar.src= "https://static.xx.fbcdn.net/rsrc.php/v3/yC/r/aMltqKRlCHD.png";
				iBar.alt= "app-facebook";
				var pText = document.createElement("p");
				pText.innerHTML = "Sign in with Facebook";
				newSpan.appendChild(aPro);
				aPro.appendChild(aLog);
				aLog.appendChild(iBar);
				aLog.appendChild(pText);
				return newSpan;				
				
			}
			//resets navigator placeholder when a new auth call is made
			function resetNavi(){
				var resetSpan = document.createElement("span");
				resetSpan.id = "auth-container";
				return resetSpan;
			}			

			ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', apiAuth, false, function (data) {
				
				//reset navi for new auth call
				let resetAttempt = document.querySelector("#login-nav");
				let resetApptsList = document.querySelector("#appts-view");
				if(resetAttempt!==null){
					resetAttempt.replaceWith(resetNavi());
				}
				if(resetApptsList.hasChildNodes()){
					while (resetApptsList.firstChild) {
						resetApptsList.removeChild(resetApptsList.firstChild);
					}
				}
				var authObj = JSON.parse(data);				
				var authNode = document.getElementById('auth-container');
				var reg = new RegExp('^(\\d\\d\\d\\d\\d)$');				
				if(reg.test(authObj.zipStore)  && zipIt){					
					var keyup = new Event('keyup'); 
					document.querySelector('#zipSearch').value = authObj.zipStore;
					document.querySelector('input#zipSearch').dispatchEvent(keyup);
				}

				if(authObj.authStatus == true){
					authNode.replaceWith(makeDiv()); //login header placement
					
					let tempText = document.querySelector("#appts-text");					
					if(tempText!==null){
						tempText.replaceWith(makeAppts("Loading..."));						
					} else {
						document.querySelector("#profile-container").appendChild(makeAppts(""));
					}					
					apptFind();
//					addChoiceListener();
					
					if(location.pathname !== "/"){
					}					
				}
				else if(authObj.authStatus == false){
//					loginPrompt();
					//var randomNode2 = document.getElementById('auth-container');
					if(authNode !== null){
						authNode.replaceWith(makeDefaultDiv());
						document.querySelector('#login-btn').addEventListener('click', function(){
							location.replace('/auth/facebook');							
						});						
					}
				}				
			}));
			/*
			function loginPrompt(){
				var cButtons = document.querySelectorAll(".poll-wrap-sup") || null;				
				for (var cButton of cButtons) {
					if(cButton.className !== "poll-wrap-sup appt-wrap-sup"){
						//add a new choice to an existing poll					
							
					}//classname check
				}//loop
			}
			*/						
			function makeAppts(addText){
				var newSpanTxt = document.createElement("h3");
//				newSpanTxt.className = "alternate";
				newSpanTxt.id = "appts-text";				
				newSpanTxt.innerHTML = "My Appointments: " + addText;				
				return newSpanTxt;
			}
			
			//query server for my appointments
			function apptFind() {
				//appointment functions
				var proCon = document.querySelector("#profile-container") || null;				
				var request = ( '/bars/db' );				
				ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', request, false, function (data) {
					var apptsFound = JSON.parse(data);
					console.log(apptsFound);
					document.querySelector("#appts-text").remove(); //remove placeholder
					if(apptsFound.barsFound !== "none"){
						proCon.setAttribute("style", "display: unset");
						proCon.insertBefore(makeAppts(""), document.querySelector("#appts-view"));
						//third arg is div class //divCB is called within barFormer.addElement
						divCB(apptsFound, "appts-view", {"classText": " appt-wrap-sup"}, null);
						addDeleteDiv();
					} else {						
						proCon.setAttribute("style", "display: unset");
						proCon.appendChild(makeAppts("none found"));
//						if(passedInFn){
//							passedInFn(apptsFound, "appts-view", {"classText": " appt-wrap-sup"}, null);
//						}
					}
					
				}));
			};
			
			function addDeleteDiv(){

				var pWrapSup = document.querySelectorAll(".appt-wrap-sup") || null;
				for (var pWrapper of pWrapSup) {
					if(pWrapper.querySelector(".delete-poll") == null){
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
						    pollDel.innerHTML = "<span class=\"del-text\">unbook?</span>";
						    pollDel.setAttribute("style","margin: auto;");
						 actionDel.appendChild(pollDel);
						 deletePoll.appendChild(actionDel);
						pWrapper.appendChild(deletePoll);	
	
						actionDel.addEventListener('click', deleteCB.bind(actionDel), false);
						
						function deleteCB() {
							var keyS = this.getAttribute("appt-key");
							var titleS = this.title;
							 var confirmDel = confirm("Expire your appointment: " + titleS + "?");
							 let that = this;
							 if(confirmDel == true){
//							 	window.addEventListener("unload", function(){
								    ajaxFunctions.ajaxRequestLim('DELETE', '/bars/db?appt=' + keyS, 0, function (err, response) {
									    if(err){ console.log("request error \'delete\'");}
									    else{
	//									    document.querySelectorAll(".appt-wrap-sup").querySelector();
										    let nodeToRemove = that.parentNode.parentNode;
										    if(nodeToRemove.className == "poll-wrap-sup appt-wrap-sup") {
											   let nPare = nodeToRemove.parentNode;
											   nPare.removeChild(nodeToRemove);
										    }
										    let pollRoot = document.querySelector("#poll-view");
										    let resetThis = pollRoot.querySelector("div[appt-key='"+ keyS + "']");
										    //existing super-bar node
										    if(resetThis !== null){
											    resetThis.setAttribute("style","");
											    resetThis.querySelector("#show-text").innerHTML = "click to book...";
											    resetThis.querySelector("#show-text").setAttribute("style","");
											    resetThis.removeAttribute("appt-key");										    
										    }
									    }//else err
								    });
//							    });							 
//							    window.location.reload(true);
							 }   
						}
					}//has .delete div child
				}
			}

			/*function addChoiceListener(){
				var cButtons = document.querySelectorAll(".poll-wrap-sup") || null;				
				for (var cButton of cButtons) {							
					cButton.setAttribute("style","background-color: green");
					//add a new choice to an existing poll
					cButton.addEventListener('click', function () {
						var choiceText = prompt("Type your choice here");
						while(choiceText.length > 140){
							choiceText = prompt("Choice is too long. (Too many characters, 140 max). Reenter choice:", choiceText);
						}
						if(choiceText !== "" && choiceText !== null){
							var today = new Date(Date.now);
							ajaxFunctions.ajaxRequest('POST', '/bars/db?date=' + today.toISOString() + "&" + "bid=" + this.id, false, function (error, response) {
								 window.location.reload(true);
							});
						}
					}, false);
				}
			}*/
/*	
			function addChoiceNotifier(){
				var cButtons = document.querySelectorAll(".choice-btn") || null;				
				for (var cButton of cButtons) {							
					cButton.setAttribute("style","background-color: grey");
					//add a new choice to an existing poll
					cButton.addEventListener('click', function () {
						var choiceText = alert("Sign-in to add a choice");					
					}, false);
				}
			}

			function addSocialDiv(){
				var pWrapSup = document.querySelectorAll(".poll-wrap-sup") || null;				
				for (var pWrapper of pWrapSup) {	
					if(pWrapper.id !== "dummy"){	

						var partLink = pWrapper.childNodes[0].childNodes[0] || null;
						console.log(partLink["href"]);
						var tweext = "Votarama! Vote vote Vote!";
						if(partLink != null){
							try{
								tweext = partLink.innerHTML;
							} catch(e) {}				
						}				  
						//social container
						var socCon = document.createElement('div');
						socCon.id = "social-container";
						socCon.className = "container";
						var socPla = document.createElement('div');
						socPla.id = "social-place";
						socCon.appendChild(socPla);

						//social               
						var twiAn = document.createElement("a");
						twiAn.href = "https://twitter.com/share?ref_src=twsrc%5Etfw";
						twiAn.className = "twitter-share-button";
						twiAn.setAttribute("data-url", partLink);
						twiAn.setAttribute("data-text", tweext);
						twiAn.setAttribute("data-size", "large");
						twiAn.setAttribute("data-hashtags", "votarama");
						twiAn.setAttribute("data-show-count", "false");
						twiAn.innerHTML = "Tweet";
						socPla.appendChild(twiAn);
						pWrapper.appendChild(socCon);
					}					
				}
			}

			function addPollDiv(cb) {
				var controlWrap = document.createElement("div");
				controlWrap.className = "control-btns";

				var newPoll = document.createElement("div");
				newPoll.className = ("add-poll-container");
				var actionPoll = document.createElement('a');
				var pollBtn = document.createElement('div');
				pollBtn.className = "btn add-poll";
				pollBtn.id = "poll-create";
				pollBtn.innerHTML = "New Poll";
				actionPoll.appendChild(pollBtn);
				newPoll.appendChild(actionPoll);
				controlWrap.appendChild(newPoll);

				var clickFlag = false;
				var pollFields;
				newPoll.addEventListener('click', function () {

					if(clickFlag == false){
						var pTitle = prompt('Enter poll question:');
						while(pTitle.length > 140){
							pTitle=prompt("Question is too long (max 140 characters), Reenter: ", pTitle);
						}
						while(pTitle.trim() == "" || pTitle == null){
							pTitle=prompt("Invalid format, reenter: Poll Question:");
						}
						var choiceArray = [];						
						pollFields = { title: pTitle, choiceList: []};
						
						var c1 = prompt('Poll Choice 1:');
						while(c1.length > 140){
							c1=prompt("Choice is too long (max 140 characters), Reenter: ", c1);
						}
						while(c1.trim() == "" || c1 == null){
							c1=prompt("Invalid format, reenter: Poll Choice 1:");
						}
						c1 = c1.substring(0,140);
						choiceArray.push(c1);
						
						var c2 = prompt('Poll Choice 2:');
						while(c2.length > 140){
							c2=prompt("Choice is too long (max 140 characters), Reenter: ", c2);
						}
						while(c2.trim() == "" || c2 == null){
							c2=prompt("Invalid format, reenter: Poll Choice 2:");
						}
						c2 = c2.substring(0,140);
						choiceArray.push(c2);					
						

						pollFields.choiceList = choiceArray;
						console.log(pollFields);

						//populate dummy preview poll
						document.querySelector('#dummy-title').innerHTML = pTitle;
						document.querySelector('#dummy-btn-1').innerHTML = c1;
						document.querySelector('#dummy-btn-2').innerHTML = c2;
						document.querySelector('#dummy').setAttribute('style','display: flex');										

						document.querySelector('#poll-create').setAttribute('style','background-color: green');
						document.querySelector('#poll-create').innerHTML = "Create";
												
						//add more choices create
						document.querySelector('#addmore-poll-container').setAttribute('style', 'display: ');						
						document.querySelector('#addmore-poll-container').addEventListener('click',
							function () {
								clickFlag = true;	
								
								var cN = prompt('Poll Choice:');
								while(cN.length > 140){
									cN=prompt("Choice is too long (max 140 characters), Reenter: ", cN);
								}
								while(cN.trim() == "" || cN == null){
									cN=prompt("Invalid format, reenter: Poll Choice:");
								}
								if(cN != null){									
									var btnN = document.createElement('div');
									btnN.className = "btn dummy-btn";
									btnN.id = "dummy-btn-n"; //button1									
									btnN.innerHTML = cN;
									document.querySelector('#dummy').appendChild(btnN);
									choiceArray.push(cN);	
								}
								pollFields.choiceList = choiceArray;
								console.log(pollFields);								
							}
						);				
						
												
						//cancel create
						document.querySelector('#cancel-poll-container').setAttribute('style', 'display: ');						
						document.querySelector('#cancel-poll-container').addEventListener('click',
							function () {
								clickFlag = false;
								document.querySelector('#poll-create').setAttribute('style','');
								document.querySelector('#poll-create').innerHTML = "New Poll";  
								document.querySelector('#cancel-poll-container').setAttribute('style', 'display: none;');
								document.querySelector('#addmore-poll-container').setAttribute('style', 'display: none;');
								document.querySelector('#dummy').setAttribute('style','display: none');
							}
						);						
					}
					else if(clickFlag == true){
						document.querySelector('#poll-create').setAttribute('style','display: none;');
//						document.querySelector('#poll-create').innerHTML = "please wait...";         
						ajaxFunctions.ajaxRequest('POST', '/polls?q=' + JSON.stringify(pollFields), false, function (error, response) {
							console.log("Request sent, response received");                
							window.location.reload(true);	
						});
						clickFlag = false;
						
					}        
					clickFlag = true;    
				}, false);
				
				//poll preview dummy
				var pollDum = document.createElement("div");
				pollDum.className = "poll-wrap-sup";
				pollDum.id = "dummy";
				var pollT = document.createElement('div');
				pollT.className = "poll-title";
				pollT.id = "dummy-title"; //title
				var btnD1 = document.createElement('div');
				btnD1.className = "btn dummy-btn";
				btnD1.id = "dummy-btn-1"; //button1
				var btnD2 = document.createElement('div');
				btnD2.className = "btn dummy-btn";
				btnD2.id = "dummy-btn-2"; //button2

				pollDum.appendChild(pollT);
				pollDum.appendChild(btnD1);
				pollDum.appendChild(btnD2);	
				
				//add more choices button
				var addMore = document.createElement("div");
				addMore.className = ("addmore-poll-container");
				addMore.id = ('addmore-poll-container');
				addMore.setAttribute('style','display: none');
				var actionAddMore = document.createElement('a');
				var moreBtn = document.createElement('div');
				moreBtn.className = "btn more-choices";
				moreBtn.id = "more-choices";
				moreBtn.innerHTML = "Add Choices";
				actionAddMore.appendChild(moreBtn);
				addMore.appendChild(actionAddMore);
				controlWrap.appendChild(addMore);	
				
				//cancel button
				var cancelPoll = document.createElement("div");
				cancelPoll.className = ("cancel-poll-container");
				cancelPoll.id = ('cancel-poll-container');
				cancelPoll.setAttribute('style','display: none');
				var actionCancel = document.createElement('a');
				var cancelBtn = document.createElement('div');
				cancelBtn.className = "btn cancel-poll";
				cancelBtn.id = "poll-cancel";
				cancelBtn.innerHTML = "Cancel Create";
				actionCancel.appendChild(cancelBtn);
				cancelPoll.appendChild(actionCancel);
				controlWrap.appendChild(cancelPoll);

				var controlPad = document.querySelector('.poll-profile-control') || null;
				if(controlPad !== null){					
					controlPad.appendChild(controlWrap);	
					controlPad.appendChild(pollDum);
				}
			}
		*/},

		userScript : function(){

			var profileId = document.querySelector('#profile-id') || null;
			var profileUsername = document.querySelector('#profile-username') || null;	
			var profileVotesCount = document.querySelector('#votes-count') || null;	
			var profileVotersCount = document.querySelector('#voters-count') || null;	

			var apiUser = appUrl + '/api/:id';

			function updateHtmlElement (dataU, element, userProperty) {
				element.innerHTML = dataU[userProperty];
			}

			ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', apiUser, false, function (dataU) {
				var userObject = JSON.parse(dataU);

			         if (profileId !== null) {
			            updateHtmlElement(userObject, profileId, 'id');   
			         }
	
			         if (profileUsername !== null) {
			            updateHtmlElement(userObject, profileUsername, 'username');   
			         }
			         
			         if (profileVotesCount !== null) {
				            updateHtmlElement(userObject, profileVotesCount, 'totalVotes');   
				         }
			         
			         if (profileVotersCount !== null) {
				            updateHtmlElement(userObject, profileVotersCount, 'uniqueVoters');   
				         }
			         

			}));
		},

		loadScript : function(){
    		return new Promise(function (resolve, reject) {
	        	var s;
		        s = document.createElement('script');
		        s.src = extScript;
		        s.onload = resolve;
		        s.onerror = reject;
		        document.head.appendChild(s);
		    });
		}	
	};
})();
