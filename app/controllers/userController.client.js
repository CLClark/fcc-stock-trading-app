'use strict';

(function () {

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

/********************************************************/

   /*
   var profilePolls = document.querySelector('#profile-polls') || null;
   var pollApi = appUrl + '/polls/db';

   function updateInnerElement (dataU, element) {
      element.innerHTML = dataU;
   }

   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', pollApi, false, function (dataU) {
         var pollObject = JSON.parse(dataU);
         if (profilePolls !== null) {
            updateInnerElement(JSON.stringify(pollObject), profilePolls);   
         }
      })
   );


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


   function callbackClick(cb){
      cb();
   }  
   */ 
})();
