'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//var Appt = new Schema({	
//	facebookId: String,
//	busId: String,	
//	date: String,
//	time: String,
//	ip: String
//});

//var Day = new Schema({
//	date: String,	
//	appts: [Appt]
//});

var Bars = new Schema({
	active: Boolean,
	busName: String,
	busId: String,	
});

module.exports = mongoose.model('Bars', Bars);
