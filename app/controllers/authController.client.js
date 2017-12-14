'use strict';

var AUTHLIB = AUTHLIB || (function () {
	var ajaxCb;
	var _args = {}; // private	 
	return{
		init : function(Args) {
			_args = Args;
			ajaxCb = _args[0];
			// some other initialising
		},
		navi : function(){

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
				}
				else if(authObj.authStatus == false){
					//var randomNode2 = document.getElementById('auth-container');
					if(authNode !== null){
						authNode.replaceWith(makeDefaultDiv());
					}
				}				

			}));

			function addPollDiv() {		
				var controlWrap = document.createElement("div");
				controlWrap.className = "control-btns";

				var newPoll = document.createElement("div");
				newPoll.className = ("add-poll");
				var actionPoll = document.createElement('a');
				var pollBtn = document.createElement('div');
				pollBtn.className = "btn choice-btn";
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

		}
	}
})();