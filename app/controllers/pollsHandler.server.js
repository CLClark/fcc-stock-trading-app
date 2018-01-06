'use strict';

var Polls = require('../models/polls.js');
var Users = require('../models/users.js');
var mongoose = require('mongoose');

function PollsHandler () {

	//search data for user profile + polls
	this.myPolls = function (req, res) {			
		var idString = new String(req.user.github.id).substring(0,10);
		Polls
		.find({ $and: [{ "github.id": idString}, {'active': { $eq: true } } ]}, null, { sort: {date: -1}}, function (err, result2) {
			if (err) { throw err; }
			//add aggregate poll query data to user object
			var analyze = pollBuilder(result2, true);
			var newUserObj = JSON.parse(JSON.stringify(req.user.github));
			newUserObj["totalVotes"] = analyze["totalVotes"];
			newUserObj["uniqueVoters"] = analyze["uniqueVoters"];
			res.json(newUserObj);				
		});		
	};

	//search DB for poll data that user owns
	//'GET' to /polls/db
	this.getPolls = function (req, res) {
		console.log('handler.server.js.getPolls');
		var idString = new String(req.user.github.id).substring(0,10);
		Polls
		.find({ $and: [{ "github.id": idString}, {'active': { $eq: true } } ]}, null, { sort: {date: -1}}, function (err, result) {
			if (err) { throw err; }
			var toSend = pollBuilder(result);
			console.log('handler.server.js.getPolls ' + result.length);				
			res.send(JSON.stringify(toSend));				
		});
	}
	
	//find a single poll in the db
	this.singlePoll = function (req, res, next) {

		console.log('handler.server.js.singlePoll');

		var ObjectId = require('mongoose').Types.ObjectId;
		var pollId = new String(req.query.pid).substring(0,40) || "";
		var idCheck = ObjectId.isValid(pollId);
		
		if(idCheck){
			var pollKey = new mongoose.Types.ObjectId(pollId);
			Polls
			.find({ $and: [{ "_id": pollKey}, {'active': { $eq: true } } ]}, function (err, result) {
				if (err) { throw err; }
				if(result.length > 0){
					var singleResult = pollBuilder(result);
					res.send(JSON.stringify(singleResult));	
				}
				else{				
					console.log("poll query failed");
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

	//find all active polls (for votarama home page)
	this.allPolls = function (req, res) {
		Polls
		.find({'active': true}, function (err, result){			
			if(err) {throw err;}
			var aggregator = [];		
			var currentPoll = ""; var currentPIndex = -1;
			for( var i = 0; i < result.length; i++){
				var chartsForm = [
					['Choice', 'Votes', 'cid']
				];
				var pollId = result[i]._id || "";
				// iterThrough.push(pollTitle);
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
				if(currentPoll !== pollId){
					currentPoll = pollId;
					aggregator.push({id: pollId, title: result[i].title, pollData: chartsForm});
					currentPIndex++;
				}

				//aggregator.push({id: pollId, pollData: chartsForm});
			}

			console.log(JSON.stringify(aggregator.length + " polls found"));
			res.send(JSON.stringify(aggregator));
		});
	}

	function pollBuilder(result, options){
		var aggregator = [];		
		var currentPoll = ""; var currentPIndex = -1;
		var totalVotes = 0;
		var vRay = [];
		for( var i = 0; i < result.length; i++){
			var chartsForm = [
				['Choice', 'Votes', 'cid']
			];
			var pollId = result[i]._id || "";
			// iterThrough.push(pollTitle);
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
			if(currentPoll !== pollId){
				currentPoll = pollId;
				aggregator.push({id: pollId, title: result[i].title, pollData: chartsForm});
				currentPIndex++;
			}
		}
		if(options){
			var userResults = {"totalVotes": totalVotes, "uniqueVoters": vRay.length};
			return userResults;
		}
		return aggregator;
	}
	
	this.addPoll = function (req, res) { 
		console.log('handler.server.js.addPoll');		
		var singlePoll = new Polls();
		var queryObj = JSON.parse(req.query.q);
		var choicesObj = {};
		var choiceQArr = queryObj.choiceList;
		var stringId = new String(req.user.github.id).substring(0,10);

		console.log(queryObj);		
		for (var i = choiceQArr.length - 1; i >= 0; i--) {						
			choicesObj.owner = stringId;
			choicesObj.choice = choiceQArr[i];
			singlePoll.choiceList.push(choicesObj);
		};
		
		singlePoll.title = queryObj.title;
		singlePoll.active = true;
		singlePoll.github = req.user.github;
		singlePoll.date = Date.now().toString();
		singlePoll.save();		
		console.log(JSON.stringify(singlePoll));
		res.sendStatus(200);
	}

	this.deletePoll = function (req, res) {
		// var mongoose = require('mongoose');				
		var pollToDel = new String(req.query.pid).substring(0,40);
		var pollKey = mongoose.Types.ObjectId(pollToDel);
		var adminObject = {};		
		if(req.user.github.id == '16168260'){									
		}
		else{
			var field = new String(req.user.github.id).substring(0,10);
			adminObject['github.id'] = field;
		}
		Polls
		.find({ $and: [{ "_id": pollKey}, adminObject, {'active': { $eq: true } } ]}, function (err, result) {
			console.log(req.user.github.id);
			if(result.length > 0){
				console.log('deletePoll callback' + JSON.stringify(result));
				if (err) { res.sendStatus(404); }
				var userId = new String(req.user.github.id).substring(0,10);
				// console.log(result);
				console.log(result[0]);
				var pollOwner = result[0].github.id;			
				if(userId == pollOwner || userId == '16168260'){
					Polls.findByIdAndUpdate(pollToDel, { $set: { active: false }},{lean: false}, function (err, dResult){			
						if(err) {throw err;}
						console.log(pollToDel + " found and deleted");			
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
	}//this.deletePoll

	this.removeChoice = function (req, res) {
		console.log('removeChoice callback');
	}

	this.addChoice = function (req, res) {
		var choiceString = new String(req.query.choice).substring(0,140);
		var pollToFind = new String(req.query.pid).substring(0,30);
		var origin = new String(req.ip).substring(0,140); //arbitrary cut off

		Polls
		.findById(pollToFind, {lean: false}, function (err, result){			
			if(err) {throw err;}
			//check if poll is active in the db
			if(result.active == true){
				var choicesArray = result.choiceList;
				var choiceToPush = {choice: choiceString, owner: origin, votes: []};
				choicesArray.push(choiceToPush);			
				console.log("saved: " + result.save());
				res.send(JSON.stringify(result));
			}
			else{
				res.status(403);
				res.json({poll: "not found"});
			}
		});
		console.log('addChoice callback');
	}

	this.addVote = function (req, res) {
		console.log('addVote callback' + req.ip.substring(0,100));
		//check if previously voted (ip or id)
		var pollToFind = req.query.pid.substring(0,40);
		var choiceToAdd = req.query.cid.substring(0,140);
		var origin = req.ip.substring(0,100);
		
		Polls
		.findById(pollToFind, {lean: false}, function (err, result){			
			if(err) {throw err;}
			//check if poll is active
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
					
					//respond with updated poll					
					var ObjectId = require('mongoose').Types.ObjectId;
					var pollId = pollToFind || "";
					var idCheck = ObjectId.isValid(pollId);
					
					if(idCheck){
						var pollKey = new mongoose.Types.ObjectId(pollId);
						Polls
						.find({ $and: [{ "_id": pollKey}, {'active': { $eq: true } } ]}, function (err, result) {
							if (err) { throw err; }
							if(result.length > 0){
								var singleResult = pollBuilder(result);
								res.send(JSON.stringify(singleResult));	
							}
							else{				
								console.log("poll query failed");
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

module.exports = PollsHandler;
