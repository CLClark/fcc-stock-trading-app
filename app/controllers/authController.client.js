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
					addPollDiv(); 
					addChoiceListener(); //choice script
					addDeleteDiv();
					addSocialDiv(); //tweet button (share)					
					authScriptCB(); //tweet script
					
				}
				else if(authObj.authStatus == false){
					//var randomNode2 = document.getElementById('auth-container');
					if(authNode !== null){
						authNode.replaceWith(makeDefaultDiv());
					}
				}				

			}));

			function addChoiceListener(){
				var cButtons = document.querySelectorAll(".choice-btn") || null;				
				for (var cButton of cButtons) {							
					cButton.setAttribute("style","background-color: green");
	               //add a new choice to an existing poll
	               cButton.addEventListener('click', function () {
	                  var choiceText = prompt("Type your choice here");
	                  console.log(choiceText);
	                  if(choiceText !== "" && choiceText !== null){
	                     ajaxFunctions.ajaxRequest('GET', '/polls/votes?choice=' + choiceText + "&" + "pid=" + this.pid, false, function (error, response) {

	                     });
	                  }   
	               }, false);
	           }
			}

			function addDeleteDiv(){

				var pWrapSup = document.querySelectorAll(".poll-wrap-sup") || null;
				for (var pWrapper of pWrapSup) {

					var deletePoll = document.createElement("div");
					deletePoll.className = ("delete-poll");
					 var actionDel = document.createElement('a');
					var pollDataDiv = pWrapper.querySelector(".poll-view-list-poll");
					var keyOfPoll = pollDataDiv.getAttribute("poll-key");
					var titleOfPoll = pollDataDiv.getAttribute("poll-title");
					actionDel.setAttribute("poll-key", keyOfPoll);
					actionDel.setAttribute("title", titleOfPoll);
					    var pollDel = document.createElement('div');
					    pollDel.className = "btn choice-btn";
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
						    ajaxFunctions.ajaxRequest('DELETE', '/polls/db?pid=' + keyS, false, function (error, response) {
						    });
						 }   
					}, false);
				}

			}

			function addSocialDiv(){
				var pWrapSup = document.querySelectorAll(".poll-wrap-sup") || null;				
				for (var pWrapper of pWrapSup) {				
				  
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
                  twiAn.setAttribute("data-size", "large");
                  twiAn.setAttribute("data-hashtags", "votarama");
                  twiAn.setAttribute("data-show-count", "false");
                  twiAn.innerHTML = "Tweet";
                  socPla.appendChild(twiAn);
                  pWrapper.appendChild(socCon);
				//});
				}
			}

			function addPollDiv() {		
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
						var choiceArray = [];         
						pollFields = { title: pTitle, choiceList: []};

						var c1 = prompt('Poll Choice 1:');
						choiceArray.push(c1);
						var c2 = prompt('Poll Choice 2:');
						choiceArray.push(c2);

						pollFields.choiceList = choiceArray;
						console.log(pollFields);

						document.querySelector('#poll-create').setAttribute('style','background-color: green');
						document.querySelector('#poll-create').innerHTML = "Create";
					}
					else if(clickFlag == true){
						document.querySelector('#poll-create').setAttribute('style','');
						document.querySelector('#poll-create').innerHTML = "New Poll";         
						ajaxFunctions.ajaxRequest('POST', '/polls?q=' + JSON.stringify(pollFields), false, function (error, response) {
						console.log("Request sent, response received");                
						document.querySelector('#poll-create').reset();
						});
						clickFlag = false;
						//Window.location.reload(true);         
					}        
					clickFlag = true;    
				}, false);

				var controlPad = document.querySelector('.poll-profile-control') || null;
				if(controlPad !== null){
					controlPad.appendChild(controlWrap);
				}
			}
		},

		userScript : function(){

			var profileId = document.querySelector('#profile-id') || null;
			var profileUsername = document.querySelector('#profile-username') || null;			

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

				ajaxCb();
			}));
			
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
			twiAn.setAttribute("data-size", "large");
			twiAn.setAttribute("data-hashtags", "votarama");
			twiAn.setAttribute("data-show-count", "false");
			twiAn.innerHTML = "Tweet";
			socPla.appendChild(twiAn);
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