'use strict';

var AUTHLIB = AUTHLIB || (function () {
	var ajaxCb;
	var extScript;
	var authScriptCB;
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
			ajaxCb = _args[0];
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

			//var naviNode = document.getElementById('navi');
			if(homeIcon !== null){
				homeIcon.replaceWith(makeNaviDiv());
			}

		},
		authScript : function(){

			//var naviContainer = document.getElementById('navi') || null;
			//var authContainer = document.getElementById('auth-container') || null;
			var apiAuth = appUrl + '/auth/check';

			function makeDiv(){
				var newSpan2 = document.createElement("span");

				var aPro1 = document.createElement("a");
				aPro1.className = "menu";
				aPro1.href = "/profile";
				aPro1.innerHTML = "My Polls";
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
				var newSpan = document.createElement("span");

				var aPro = document.createElement("a");
				aPro.href = "/auth/github";		
				var aLog = document.createElement("div");
				aLog.className = "btn";
				aLog.id = "login-btn";
				var iBar = document.createElement("img");
				iBar.src= "/public/img/github_32px.png";
				iBar.alt= "github logo";
				var pText = document.createElement("p");
				pText.innerHTML = "LOGIN WITH GITHUB";
				newSpan.appendChild(aPro);
				aPro.appendChild(aLog);
				aLog.appendChild(iBar);
				aLog.appendChild(pText);
				return newSpan;
			}

			ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', apiAuth, false, function (data) {
				
				var authObj = JSON.parse(data);				
				var authNode = document.getElementById('auth-container');

				if(authObj.authStatus == true){
					//var randomNode = document.getElementById('auth-container');
					authNode.replaceWith(makeDiv());
					addPollDiv("null");					
					addChoiceListener(); //choice script
					addDeleteDiv();
					//prevent loading tweet api on home page (large poll count)					
					if(location.pathname !== "/"){
						addSocialDiv(); //tweet button (share)					
						authScriptCB(); //tweet script	
					}					
				}
				else if(authObj.authStatus == false){
					//var randomNode2 = document.getElementById('auth-container');
					if(authNode !== null){
						authNode.replaceWith(makeDefaultDiv());
					}
					addChoiceNotifier(); //choice script
				}				

			}));

			function addChoiceListener(){
				var cButtons = document.querySelectorAll(".choice-btn") || null;				
				for (var cButton of cButtons) {							
					cButton.setAttribute("style","background-color: green");
					//add a new choice to an existing poll
					cButton.addEventListener('click', function () {
						var choiceText = prompt("Type your choice here");
						while(choiceText.length > 140){
							choiceText = prompt("Choice is too long. (Too many characters, 140 max). Reenter choice:", choiceText);
						}
						if(choiceText !== "" && choiceText !== null){							
							ajaxFunctions.ajaxRequest('GET', '/polls/votes?choice=' + choiceText + "&" + "pid=" + this.pid, false, function (error, response) {
								 window.location.reload(true);
							});
						}
					}, false);
				}
			}
			
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

			function addDeleteDiv(){

				var pWrapSup = document.querySelectorAll(".poll-wrap-sup") || null;
				for (var pWrapper of pWrapSup) {
					if(pWrapper.id != "dummy"){
						var deletePoll = document.createElement("div");
						deletePoll.className = ("delete-poll");
						 var actionDel = document.createElement('a');
						var pollDataDiv = pWrapper.querySelector(".poll-view-list-poll");
						var keyOfPoll = pollDataDiv.getAttribute("poll-key");
						var titleOfPoll = pollDataDiv.getAttribute("poll-title");
						actionDel.setAttribute("poll-key", keyOfPoll);
						actionDel.setAttribute("title", titleOfPoll);
						    var pollDel = document.createElement('div');
						    pollDel.className = "btn delete-btn";
						    pollDel.id = "delete-btn";
						    pollDel.innerHTML = "Delete Poll";
						 actionDel.appendChild(pollDel);
						 deletePoll.appendChild(actionDel);
						pWrapper.appendChild(deletePoll);	
	
						actionDel.addEventListener('click', function () {
							var keyS = this.getAttribute("poll-key");
							var titleS = this.title;
							 var confirmDel = confirm("Delete Poll: " + titleS + "?");                     
							 if(confirmDel == true){
							 	window.addEventListener("unload", function(){
								    ajaxFunctions.ajaxRequest('DELETE', '/polls/db?pid=' + keyS, false, function (error, response) {						    	
								    });
							    });
							    window.location.reload(true);
							 }   
						}, false);
					}
				}
			}

			function addSocialDiv(){
				var pWrapSup = document.querySelectorAll(".poll-wrap-sup") || null;				
				for (var pWrapper of pWrapSup) {		
					
					var partLink = pWrapper.childNodes[0].childNodes[0] || null;
					var tweext = "Votarama! Vote vote Vote!";
					var shareLink = "http://" +window.location.hostname;
					if(partLink != null){
						try{
							tweext = partLink.innerHTML; 
							shareLink = "http://" + window.location.hostname + partLink[href];	
							console.log(shareLink);
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
			                  twiAn.setAttribute("data-url", shareLink);
			                  twiAn.setAttribute("data-text", tweext);
			                  twiAn.setAttribute("data-size", "large");
			                  twiAn.setAttribute("data-hashtags", "votarama");
			                  twiAn.setAttribute("data-show-count", "false");
			                  twiAn.innerHTML = "Tweet";
			                  socPla.appendChild(twiAn);
			                  pWrapper.appendChild(socCon);
				//});
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
		},

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
			         
				ajaxCb();
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