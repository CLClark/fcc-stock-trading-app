'use strict';

var Bars = require('../models/bars.js');
var Users = require('../models/users.js');
var mongoose = require('mongoose');

function BarsHandler () {

	//search data for user profile + bars
	this.myBars = function (req, res) {			
		var idString = new String(req.user.github.id).substring(0,10);
		Bars
		.find({ $and: [{ "github.id": idString}, {'active': { $eq: true } } ]}, null, { sort: {date: -1}}, function (err, result2) {
			if (err) { throw err; }
			//add aggregate bar query data to user object
			var analyze = barBuilder(result2, true);
			var newUserObj = JSON.parse(JSON.stringify(req.user.github));
			newUserObj["totalVotes"] = analyze["totalVotes"];
			newUserObj["uniqueVoters"] = analyze["uniqueVoters"];
			res.json(newUserObj);				
		});		
	};

	//search DB for bar data that user owns
	//'GET' to /bars/db
	this.getBars = function (req, res) {
		console.log('handler.server.js.getBars');
		var idString = new String(req.user.github.id).substring(0,10);
		Bars
		.find({ $and: [{ "github.id": idString}, {'active': { $eq: true } } ]}, null, { sort: {date: -1}}, function (err, result) {
			if (err) { throw err; }
			var toSend = barBuilder(result);
			console.log('handler.server.js.getBars ' + result.length);				
			res.send(JSON.stringify(toSend));				
		});
	}
	
	//find a single bar in the db
	this.singleBar = function (req, res, next) {

		console.log('handler.server.js.singleBar');

		var ObjectId = require('mongoose').Types.ObjectId;
		var barId = new String(req.query.pid).substring(0,40) || "";
		var idCheck = ObjectId.isValid(barId);
		
		if(idCheck){
			var barKey = new mongoose.Types.ObjectId(barId);
			Bars
			.find({ $and: [{ "_id": barKey}, {'active': { $eq: true } } ]}, function (err, result) {
				if (err) { throw err; }
				if(result.length > 0){
					var singleResult = barBuilder(result);
					res.send(JSON.stringify(singleResult));	
				}
				else{				
					console.log("bar query failed");
					res.location('/');			
					res.sendStatus(404);
				}
			});	
		}else{
			console.log("id fails");
			res.location('/');			
			res.sendStatus(404);
		}		
	};

	//find all active bars (for votarama home page)
	this.allBars = function (req, res) {
		Bars
		.find({'active': true}, function (err, result){			
			if(err) {throw err;}
			var aggregator = [];		
			var currentBar = ""; var currentPIndex = -1;
			for( var i = 0; i < result.length; i++){
				var chartsForm = [
					['Choice', 'Votes', 'cid']
				];
				var barId = result[i]._id || "";
				// iterThrough.push(barTitle);
				var cList = result[i].choiceList || [];
				// console.log(JSON.stringify(cList));
				for( var l = 0; l < cList.length; l++){
					var iterThrough = [];
					var choiceName = cList[l].choice || "";
					var voteNum = cList[l].votes.length || 0;
					var cidToAdd = cList[l]["_id"] || null;
					iterThrough.push(choiceName);
					iterThrough.push(voteNum);
					iterThrough.push(cidToAdd);
					chartsForm.push(iterThrough);					
				}
				if(currentBar !== barId){
					currentBar = barId;
					aggregator.push({id: barId, title: result[i].title, barData: chartsForm});
					currentPIndex++;
				}

				//aggregator.push({id: barId, barData: chartsForm});
			}

			console.log(JSON.stringify(aggregator.length + " bars found"));
			res.send(JSON.stringify(aggregator));
		});
	}

	function barBuilder(result, options){
		var aggregator = [];		
		var currentBar = ""; var currentPIndex = -1;
		var totalVotes = 0;
		var vRay = [];
		for( var i = 0; i < result.length; i++){
			var chartsForm = [
				['Choice', 'Votes', 'cid']
			];
			var barId = result[i]._id || "";
			// iterThrough.push(barTitle);
			var cList = result[i].choiceList || [];
//			console.log(JSON.stringify(cList));
			for( var l = 0; l < cList.length; l++){
				var iterThrough = [];
				var choiceName = cList[l].choice || "";
				var voteNum = cList[l].votes.length || 0;
				var cidToAdd = cList[l]["_id"] || null;
				iterThrough.push(choiceName);
				iterThrough.push(voteNum);
				iterThrough.push(cidToAdd);
				chartsForm.push(iterThrough);
				//aggregation for users 
				totalVotes += voteNum;
				if(options){
					var ipArr = cList[l].votes || [];
					for(var vips = 0; vips < ipArr.length; vips++){
						var vipString = ipArr[vips].ip;
						if(vRay.indexOf(vipString) < 0){
							console.log(vipString);
							vRay.push(vipString);
						}
					}
				}
			}
			if(currentBar !== barId){
				currentBar = barId;
				aggregator.push({id: barId, title: result[i].title, barData: chartsForm});
				currentPIndex++;
			}
		}
		if(options){
			var userResults = {"totalVotes": totalVotes, "uniqueVoters": vRay.length};
			return userResults;
		}
		return aggregator;
	}
	
	this.addBar = function (req, res) { 
		console.log('handler.server.js.addBar');		
		var singleBar = new Bars();
		var queryObj = JSON.parse(req.query.q);
		var choicesObj = {};
		var choiceQArr = queryObj.choiceList;
		var stringId = new String(req.user.github.id).substring(0,10);

		console.log(queryObj);		
		for (var i = choiceQArr.length - 1; i >= 0; i--) {						
			choicesObj.owner = stringId;
			choicesObj.choice = choiceQArr[i];
			singleBar.choiceList.push(choicesObj);
		};
		
		singleBar.title = queryObj.title;
		singleBar.active = true;
		singleBar.github = req.user.github;
		singleBar.date = Date.now().toString();
		singleBar.save();		
		console.log(JSON.stringify(singleBar));
		res.sendStatus(200);
	}

	this.deleteBar = function (req, res) {
		// var mongoose = require('mongoose');				
		var barToDel = new String(req.query.pid).substring(0,40);
		var barKey = mongoose.Types.ObjectId(barToDel);
		var adminObject = {};		
		if(req.user.github.id == '16168260'){									
		}
		else{
			var field = new String(req.user.github.id).substring(0,10);
			adminObject['github.id'] = field;
		}
		Bars
		.find({ $and: [{ "_id": barKey}, adminObject, {'active': { $eq: true } } ]}, function (err, result) {
			console.log(req.user.github.id);
			if(result.length > 0){
				console.log('deleteBar callback' + JSON.stringify(result));
				if (err) { res.sendStatus(404); }
				var userId = new String(req.user.github.id).substring(0,10);
				// console.log(result);
				console.log(result[0]);
				var barOwner = result[0].github.id;			
				if(userId == barOwner || userId == '16168260'){
					Bars.findByIdAndUpdate(barToDel, { $set: { active: false }},{lean: false}, function (err, dResult){			
						if(err) {throw err;}
						console.log(barToDel + " found and deleted");			
						res.sendStatus(200);			
					});		
				}			
				else{
					res.sendStatus(403);
				}						
			}
			else{
				res.sendStatus(403);
			}			
		});	
	}//this.deleteBar

	this.removeChoice = function (req, res) {
		console.log('removeChoice callback');
	}

	this.addChoice = function (req, res) {
		var choiceString = new String(req.query.choice).substring(0,140);
		var barToFind = new String(req.query.pid).substring(0,30);
		var origin = new String(req.ip).substring(0,140); //arbitrary cut off

		Bars
		.findById(barToFind, {lean: false}, function (err, result){			
			if(err) {throw err;}
			//check if bar is active in the db
			if(result.active == true){
				var choicesArray = result.choiceList;
				var choiceToPush = {choice: choiceString, owner: origin, votes: []};
				choicesArray.push(choiceToPush);			
				console.log("saved: " + result.save());
				res.send(JSON.stringify(result));
			}
			else{
				res.status(403);
				res.json({bar: "not found"});
			}
		});
		console.log('addChoice callback');
	}

	this.addVote = function (req, res) {
		console.log('addVote callback' + req.ip.substring(0,100));
		//check if previously voted (ip or id)
		var barToFind = req.query.pid.substring(0,40);
		var choiceToAdd = req.query.cid.substring(0,140);
		var origin = req.ip.substring(0,100);
		console.log(req.ip.substring(0,100)+ " : IP ORIGIN ******************");
		
		
		Bars
		.findById(barToFind, {lean: false}, function (err, result){			
			if(err) {throw err;}
			//check if bar is active
			if(result.active == true){
				var choicesArray = result.choiceList;
				var combinator = []; 
				//combine IPs to check against
				for (var i = choicesArray.length - 1; i >= 0; i--) {
					combinator = combinator.concat(choicesArray[i].votes);
				};

				//check if vote exists for user's ip address
				var flagIp = false;
				combinator.forEach(function (vObj, index, combArray){				
					if(vObj.ip == origin) {					
						flagIp = true;					
						return;
					}
				});
				//if request passes the ip test, record vote
				if(flagIp == false){
					var whereToPush = choicesArray.id(choiceToAdd);
					var whenToPush = new Date().getTime();
					//console.log(whereToPush);
					var voteToPush = {ip: origin, date: whenToPush};
					var resultPush = whereToPush.votes.push(voteToPush);
					//console.log(resultPush);
					result.save();
					console.log("found " + resultPush);
					
					//respond with updated bar					
					var ObjectId = require('mongoose').Types.ObjectId;
					var barId = barToFind || "";
					var idCheck = ObjectId.isValid(barId);
					
					if(idCheck){
						var barKey = new mongoose.Types.ObjectId(barId);
						Bars
						.find({ $and: [{ "_id": barKey}, {'active': { $eq: true } } ]}, function (err, result) {
							if (err) { throw err; }
							if(result.length > 0){
								var singleResult = barBuilder(result);
								res.send(JSON.stringify(singleResult));	
							}
							else{				
								console.log("bar query failed");
								res.location('/');			
								res.sendStatus(404);
							}
						});	
					}else{
						console.log("id fails");
						res.location('/');			
						res.sendStatus(404);
					}
				}
				else if(flagIp == true){
					res.status(403);
					res.json({voteStatus: "already-voted"});
				}
			}			
		});
	}
}

module.exports = BarsHandler;
