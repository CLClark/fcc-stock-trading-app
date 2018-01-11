'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
	facebook: {
		id: String,
		username: String,
		displayName: String,
		profileUrl: String
	},

	barAppts: [ 
		{apptId: String} //index from appointments		
	]
});

module.exports = mongoose.model('User', User);

