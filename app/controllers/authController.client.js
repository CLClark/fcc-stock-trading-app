'use strict';

var AUTHLIB = AUTHLIB || (function () {
	return{
		authScript : function(){

			var authContainer = document.getElementById('auth-container') || null;
			var apiUrl = appUrl + '/auth/check';

			function makeDiv(){
				var newSpan2 = document.createElement("span");
				//newSpan.id ="auth-instance";
				var aPro1 = document.createElement("a");
				aPro1.className = "menu";
				aPro1.href = "/profile";
				aPro1.innerHTML = "Profile";
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
				//newSpan.id ="auth-instance";
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

			ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', apiUrl, false, function (data) {
				
				var authObj = JSON.parse(data);

				if(authObj.authStatus == true){
					var randomNode = document.getElementById('auth-container');
					randomNode.replaceWith(makeDiv());
				}
				else if(authObj.authStatus == false){
					var randomNode2 = document.getElementById('auth-container');
					if(randomNode2 !== null){
						randomNode2.replaceWith(makeDefaultDiv());
					}
				}

			})
			);
		},

		userScript : function(){

		   var profileId = document.querySelector('#profile-id') || null;
		   var profileUsername = document.querySelector('#profile-username') || null;
		   var profileRepos = document.querySelector('#profile-repos') || null;
		   var displayName = document.querySelector('#display-name');

		   var apiUrl = appUrl + '/api/:id';

		   function updateHtmlElement (dataU, element, userProperty) {
		      element.innerHTML = dataU[userProperty];
		   }

		   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', apiUrl, false, function (dataU) {
		         var userObject = JSON.parse(dataU);
		         
		         if (userObject.displayName !== null) {
		            updateHtmlElement(userObject, displayName, 'displayName');
		         } else {
		            updateHtmlElement(userObject, displayName, 'username');
		         }

		         if (profileId !== null) {
		            updateHtmlElement(userObject, profileId, 'id');   
		         }

		         if (profileUsername !== null) {
		            updateHtmlElement(userObject, profileUsername, 'username');   
		         }

		         if (profileRepos !== null) {
		            updateHtmlElement(userObject, profileRepos, 'publicRepos');   
		         }

		      })
		   );
		}
	}
})();