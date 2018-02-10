'use strict';

var path = process.cwd();
var queue = require('queue')
var AlphaHandler = require(path + '/app/controllers/alphaHandler.server.js');

module.exports = function (app){

	app.route('/')
		.get(function (req, res) {			
			res.sendFile(path + '/public/main.html');
		});

	app.route('/index')
		.get(function (req, res) {
			res.sendFile(path + '/public/main.html');
		});
	
	var alphaHandler = new AlphaHandler();
	
	app.route('/stock/:ticker')
		.get(function(req, res){
			alphaHandler.single(req.params.ticker, req, res);
		});
	

};
