'use strict';

var Polls = require('../models/polls.js');
var Users = require('../models/users.js');
var mongoose = require('../models/users.js');

function PollsHandler () {

	//search data for user profile + polls
	this.myPolls = function (req, res) {
		Users
			.findOne({ 'github.id': req.user.github.id }, { '_id': false })
			.exec(function (err, result) {
				if (err) { throw err; }		
				res.json(result.pollsOwned);
			});
	};

	//search DB for poll data that user owns
	//'GET' to /polls/db
	this.getPolls = function (req, res) {
		console.log('handler.server.js.getPolls');
		Polls
		.find({ $and: [{ "github.id": req.user.github.id}, {'active': { $eq: true } } ]}, function (err, result) {
			if (err) { throw err; }
			var toSend = pollBuilder(result);
			console.log('handler.server.js.getPolls ' + result.length);				
			res.send(JSON.stringify(toSend));				
		});
	}

	this.singlePoll = function (req, res) {
		var mongoose = require('mongoose');
		console.log('handler.server.js.singlePoll');
		var pollKey = mongoose.Types.ObjectId(req.query.pid);		
		Polls
		.find({ $and: [{ "_id": pollKey}, {'active': { $eq: true } } ]}, function (err, result) {
			if (err) { throw err; }
			var singleResult = pollBuilder(result);
			res.send(JSON.stringify(singleResult));
		});
	};

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
				console.log(JSON.stringify(cList));
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

	function pollBuilder(result){
		var aggregator = [];		
		var currentPoll = ""; var currentPIndex = -1;
		for( var i = 0; i < result.length; i++){
			var chartsForm = [
				['Choice', 'Votes', 'cid']
			];
			var pollId = result[i]._id || "";
			// iterThrough.push(pollTitle);
			var cList = result[i].choiceList || [];
			console.log(JSON.stringify(cList));
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
		}
		return aggregator;
	}
	
	this.addPoll = function (req, res) { 
		console.log('handler.server.js.addPoll');
		console.log(req.query.q);
		var singlePoll = new Polls();
		var queryObj = JSON.parse(req.query.q);
		var choicesObj = {};
		var choiceQArr = queryObj.choiceList;

		console.log(queryObj);		
		for (var i = choiceQArr.length - 1; i >= 0; i--) {						
			choicesObj.owner = req.user.github.id;
			choicesObj.choice = choiceQArr[i];
			singlePoll.choiceList.push(choicesObj);
		};
		
		singlePoll.title = queryObj.title;
		singlePoll.active = true;
		singlePoll.github = req.user.github;
		singlePoll.save();		
		console.log(JSON.stringify(singlePoll));
	}

	this.deletePoll = function (req, res) {
		console.log('deletePoll callback');		
		var pollToDel = req.query.pid;
		Polls.findByIdAndUpdate(pollToDel, { $set: { active: false }},{lean: false}, function (err, result){			
			if(err) {throw err;}
			console.log(req.query.pid);
			// if(req.user.github.id == result.owner){
				//result.active = false;
				//result.save;
			console.log(result);
				//res.json(result);										
			// }
		});		
	}

	this.removeChoice = function (req, res) {
		console.log('removeChoice callback');
	}

	this.addChoice = function (req, res) {
		var choiceString = req.query.choice;
		var pollToFind = req.query.pid;
		var origin = req.ip;

		Polls
		.findById(pollToFind, {lean: false}, function (err, result){			
			if(err) {throw err;}

			var choicesArray = result.choiceList;
			var choiceToPush = {choice: choiceString, owner: origin, votes: []};
			choicesArray.push(choiceToPush);
			
			console.log("saved: " + result.save());

		});


		console.log('addChoice callback');
	}

	this.addVote = function (req, res) {
		console.log('addVote callback' + req.ip);
		//check if previously voted (ip or id)
		var pollToFind = req.query.pid;
		var choiceToAdd = req.query.cid;
		var origin = req.ip;

		
		Polls
		.findById(pollToFind, {lean: false}, function (err, result){			
			if(err) {throw err;}
			var choicesArray = result.choiceList;
			var combinator = []; //combine IPs to check against
			for (var i = choicesArray.length - 1; i >= 0; i--) {
				combinator = combinator.concat(choicesArray[i].votes);
			};

			var flagIp = false;
			combinator.forEach(function (vObj, index, combArray){				
				if(vObj.ip == origin) {					
					flagIp = true;					
					return;
				}
			});

			if(flagIp == false){
				var whereToPush = choicesArray.id(choiceToAdd);
				var whenToPush = new Date().getTime();
				//console.log(whereToPush);
				var voteToPush = {ip: origin, date: whenToPush};
				var resultPush = whereToPush.votes.push(voteToPush);
				//console.log(resultPush);
				result.save();
				console.log("found " + resultPush);
			}
			else if(flagIp == true){
				res.json({voteStatus: "already-voted"});
			}
		});
	}




	/*
	this.addVote = function (req, res) {
		Users
			.findOneAndUpdate({ 'github.id': req.user.github.id }, { $inc: { 'nbrClicks.clicks': 1 } })
			.exec(function (err, result) {
					if (err) { throw err; }

					res.json(result.nbrClicks);
				}
			);
	};

	this.resetClicks = function (req, res) {
		Users
			.findOneAndUpdate({ 'github.id': req.user.github.id }, { 'nbrClicks.clicks': 0 })
			.exec(function (err, result) {
					if (err) { throw err; }

					res.json(result.nbrClicks);
				}
			);
	};
	*/
}

module.exports = PollsHandler;
