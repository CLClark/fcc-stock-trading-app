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
   ajaxRequest: function ajaxRequest (method, url, syncBoo, callback) {
      var xmlhttp = new XMLHttpRequest();

      xmlhttp.onreadystatechange = function () {
         if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {	         
            callback(xmlhttp.response);
         }
         else if(xmlhttp.readyState === 4 && xmlhttp.status === 403){
	         //error callback
	         callback(xmlhttp.response);
         }
      };      
      xmlhttp.open(method, url);
//      xmlhttp.setRequestHeader('Access-Control-Allow-Origin', 'http://localhost:8080/auth/facebook/callback');  //Access-Control-Allow-Origin: http://mozilla.org
      xmlhttp.send();
   },
};