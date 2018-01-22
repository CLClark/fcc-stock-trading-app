'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Appt = new Schema({
	fbid: String,
	busId: String,
	displayName: String,	
	time: String,
	date: String
});

module.exports = mongoose.model('Appt', Appt);

