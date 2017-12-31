'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Vote = new Schema({
	ip: String,
	date: String
});

var Choices = new Schema({
	choice: String,
	owner: String,
	votes: [Vote]	
});

var Polls = new Schema({
	github: {
		id: String,
		displayName: String,
		username: String,
	},
   choiceList: [Choices],
   active: Boolean,
   title: String,
   date: String
});

module.exports = mongoose.model('Polls', Polls);
