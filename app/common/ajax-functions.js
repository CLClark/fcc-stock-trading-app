'use strict';

var appUrl = window.location.origin;
var ajaxFunctions = {
ready: function ready (fn) {
	if (typeof fn !== 'function') {
		return;
	}

	if (document.readyState === 'complete') {
		return fn();
	}

	document.addEventListener('DOMContentLoaded', fn, false);
},
	ajaxRequest: function ajaxRequest (method, url, syncBool, callback) {
		var xmlhttp = new XMLHttpRequest();

		xmlhttp.onreadystatechange = function () {
			// xmlhttp.response["status"] = xmlhttp.status;
			if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
				callback(xmlhttp.response, xmlhttp.status);
			}
			else if(xmlhttp.readyState === 4 && xmlhttp.status === 403){
				//error callback				
				callback(xmlhttp.response, xmlhttp.status);
			}
		};
		xmlhttp.open(method, url);
		xmlhttp.send();
	},
	
	ajaxRequestLim: function ajaxRequest (method, url, timeout, callback) {
		var xmlhttp = new XMLHttpRequest();
		
		xmlhttp.timeout = timeout;
		xmlhttp.ontimeout = function () {
			let err = "timeout";
			callback(err, null, xmlhttp.status);
			//remove global statusifier
			removeIt(xhrTrack);
			console.error("The request for " + url + " timed out.");
		};		
		
		function removeIt(childN){
// console.log(document.getElementById("xhr-track"));
			document.documentElement.removeChild(childN);
// console.log(document.getElementById("xhr-track"));
		}
		function checkIt(str){
			if(document.querySelector(str) !== null){
// console.log("node present");	
				return true;
			}else{				
// console.log("node absent");	
				return false;
			}
		}
		// if(checkIt("#xhr-track")){
			// callback("request aborted: please wait for response", null);
			// xmlhttp.abort();
			//TODO put in queue instead of aborting
		// }
		// if(!checkIt("#xhr-track")){
			//global statusifier
			var xhrTrack = document.createElement("data");
			xhrTrack.id	 = "xhr-track";
			xhrTrack.value = url;
			document.documentElement.appendChild(xhrTrack);

			xmlhttp.onreadystatechange = function () {				
				if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
					callback(null, xmlhttp.response, xmlhttp.status);
					//remove global statusifier
					removeIt(xhrTrack);				
				}
				else if(xmlhttp.readyState === 4 && xmlhttp.status === 403){
					//error callback
					callback(null, xmlhttp.response, xmlhttp.status);
					//remove global statusifier
					removeIt(xhrTrack);				
				}
			};
			xmlhttp.open(method, url);
			xmlhttp.send();
		// }
		// else{
			// callback("error: request out", null);
		// }
	},
};