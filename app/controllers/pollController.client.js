'use strict';      

var MYLIBRARY = MYLIBRARY || (function () {
   var _args = {}; // private   
   return {
      init : function(Args) {
         _args = Args;
         // some other initialising
      },
      pollProducer : function(passedInFunction) {         

         google.charts.load('current', {'callback': allOrNothing,'packages':['corechart']}); //, 'bar'd

         function allOrNothing(){
            var apiUrl = _args[0];

            function getTheJson(apiUrl, cb){
               ajaxFunctions.ready(
                  ajaxFunctions.ajaxRequest('GET', apiUrl, true, function(data){
                     cb(data);
                     //add another ajax call here
                     passedInFunction();
                  })
               ); 
            }

            getTheJson(apiUrl, function(jsonResponse){      
               var pollDashboard = document.querySelector('#pollDb');   //div
               var pollView = document.getElementById('poll-view');  //ul     
               var jsonData = JSON.parse(jsonResponse);
               //number of polls to make
               var numPolls = jsonData.length || 0;

               for(var i = 0; i < numPolls; i++){
                  //create a div for each poll
                  var pId = ("poll-").concat(i);
                  var jone = jsonData[i];          
                  addElement(pId, pollView, jone);
               }
               
               for(var i = 0; i < numPolls; i++){
                  var pId = ("poll-").concat(i);
                  var jone = jsonData[i];
                  var pString = pId;
                  //drawBack(jone, pId);
                  //function drawBack(jdata1, pdata1){               
                     //drawAPoll(jdata1, pdata1)
                     //function drawAPoll(jdata3, pdata3){
                  document.getElementById(pString).parentNode.parentNode.addEventListener('click', function(element){
                     //document.getElementById(pString).addEventListener('click', function(element2){
                        //console.log(this.getAttribute("poll-data"));
                        var jArray = JSON.parse(this.childNodes[1].childNodes[1].getAttribute("poll-data"));
                        //var jArray = jone.pollData || [];                      
                        var cData = new google.visualization.arrayToDataTable(jArray);
                        //var view = new google.visualization.DataView(cData);
                        var options = {
                           bars: 'horizontal',
                           bar: {groupWidth: '50px'},
                           forceIFrame: true,
                           chartArea: { left: 0, top: 0, height: '100%' },
                           vAxis: { textPosition: 'in'},
                           hAxis: { textPosition: 'none', 'title': 'Votes'},
                           axes: { x: {all: {range: {min: 0, max: 50 }}}},
                           width: '80%',
                           //height: '100%'
                        };                
                        // Instantiate and draw our chart, passing in some options.                
                        var chart = new google.visualization.BarChart(this.childNodes[1].childNodes[1]);//document.getElementById(pString)); 
                        var viewFinal = new google.visualization.DataView(cData)
                        viewFinal.setColumns([0,1]);                 
                        chart.draw(viewFinal, options); 
                        //document.getElementById('some_frame_id').contentWindow.location.reload();                
                     //});
                  });
               }     
            });

            
            
            function addElement (divName, parent, polljone) {
               var pollCopy = JSON.parse(JSON.stringify(polljone));
               var pollChoices = pollCopy.pollData;
               //console.log(pollChoices);
               // create a new div element 
               var newWrapSup = document.createElement("div");
               newWrapSup.className = "poll-wrap-sup";
               var titleDiv = document.createElement("div");
                  titleDiv.className = "poll-title";
                  titleDiv.innerHTML = polljone.title;
                  newWrapSup.appendChild(titleDiv);
               var newWrap = document.createElement("div");
                  newWrap.className = "poll-wrap";
                  newWrapSup.appendChild(newWrap);             
               
               var contDiv = document.createElement("div");
               contDiv.className = "container";
               contDiv.id = "vote-controls";
               //divs: choice buttons
               //divs: add choice button
                  //console.log(polljone.map(xNasE => xNasE));             
               for (var i = 0; i < pollChoices.length - 1; i++) {
                  //console.log("in loop");
                  //console.log(pollChoices);
                  var cNIndex = i;
                  var choiceName = pollChoices[(cNIndex + 1)][0] || "";
                  var choiceCount = pollChoices[(cNIndex + 1)][1] || 0;
                  var cid = pollChoices[(cNIndex + 1)][2] || 0;
                  //console.log(cNIndex);
                  //choice wrapper
                  var choiceDiv = document.createElement("div");
                  choiceDiv.className = "vote";
                     //actual anchor
                     var actionDiv = document.createElement("a");
                     var voteLink = "/polls/votes?" + "pid=" + pollCopy["id"] + "&" + "cid=" + cid;
                     //actionDiv.className = "vote-btn";                
                     actionDiv.id = voteLink;
                           //actual button
                           var btnDiv = document.createElement("div");
                           btnDiv.className = "btn vote-btn";
                           var choiceText = document.createElement("a");
                           //btnDiv.id = "vote-btn";
                           choiceText.innerHTML = choiceName || "";
                           btnDiv.appendChild(choiceText);
                        actionDiv.appendChild(btnDiv);
                     choiceDiv.appendChild(actionDiv);
                  contDiv.appendChild(choiceDiv);
                  newWrap.appendChild(contDiv);

                  function updateVoteCount (data) {
                     var voteObj = JSON.parse(data);
                     window.alert(voteObj.voteStatus);
                     //redraw the GoogleChart      
                  }
                  //vote ajax call
                  actionDiv.addEventListener('click', function () {
                     ajaxFunctions.ajaxRequest('POST', this.id, false, function (error, response) {
                     });   
                  }, false);
               };

               //poll placeholder
               var newDiv = document.createElement("li");            
                  newDiv.id = divName;
                  newDiv.className = "poll-view-list-poll";
                  //newDiv.innerHTML = "";
                  newDiv.setAttribute("poll-key", polljone.id);
                  newDiv.setAttribute("poll-data", JSON.stringify(polljone.pollData));
               newWrap.appendChild(newDiv);

               var newChoice = document.createElement("div");
               newChoice.className = ("add-choice");
                  var actionChoice = document.createElement('a');
                     var choiceBtn = document.createElement('div');
                     choiceBtn.className = "btn choice-btn";
                     choiceBtn.innerHTML = "New Choice";
                  actionChoice.appendChild(choiceBtn);
                  newChoice.appendChild(actionChoice);
               contDiv.appendChild(newChoice);

               //add a new choice to an existing poll
               actionChoice.addEventListener('click', function () {
                  var choiceText = prompt("Type your choice here");
                  console.log(choiceText);
                  if(choiceText !== ""){
                     ajaxFunctions.ajaxRequest('GET', '/polls/votes?choice=' + choiceText + "&" + "pid=" + pollCopy["id"], false, function (error, response) {

                     });
                  }   
               }, false);
               //add++i to poll-view ul
               document.getElementById('poll-view').appendChild(newWrapSup);
            } //add element
         } //all or nothing          
      } //poll producer
   }; //return statement
}());
