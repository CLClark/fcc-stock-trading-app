'use strict';

var path = process.cwd();
var BarsHandler = require(path + '/app/controllers/barsHandler.server2.js');

module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			console.log("is authenticated pass");
			return next();
		} else {
			console.log('is auth failed');			
			res.redirect('/login');
		}
	}
	function isAuthed(req, res, next){		
		if (req.isAuthenticated()) {
			console.log('auth pass');
			return next();
		} else {
			console.log('auth fail');
//			return next();
			res.json({authStatus:0});	
		}		
	}
	
	app.route('/main.html')
		.get(function (req, res){
			res.sendFile(path + '/public/main.html');
		});

	app.route('/')
		.get(function (req, res) {
			res.sendFile(path + '/public/main.html');
		});
	
	app.route('/index')
		.get( function (req, res){
			res.sendFile(path + '/public/main.html');
		});

	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/');
		});

	app.route('/profile')
		.get(isLoggedIn, function (req, res) {
			res.sendFile(path + '/public/profile.html');
		});

	app.route('/api/:id')
		.get(isLoggedIn, function (req, res) {
			pollsHandler.myPolls(req, res);
		});	
	/*********************************************/
	
	app.route('/auth/facebook')
		.get(passport.authenticate('facebook'));
//	{ scope: [ 'public_profile' ]}

	app.route('/auth/facebook/callback')
		.get(passport.authenticate('facebook', {
			successRedirect: '/',
	                    failureRedirect: '/login',
	                    failureFlash: true 
		}));
	
	app.route('/auth/check')
		.get(isAuthed, function (req, res){			
			res.json({authStatus:1});
		});
	/*********************************************/
	var barsHandler = new BarsHandler();
	app.route('/bars')
		.get(barsHandler.allBars)
		.post(isLoggedIn, barsHandler.addBar);	

//	app.route('/polls/votes')
//		.delete(isLoggedIn, pollsHandler.removeChoice)
//		.post(pollsHandler.addVote)
//		.get(isLoggedIn, pollsHandler.addChoice);
//
//	app.route('/polls/db')
//		.get(isLoggedIn, pollsHandler.getPolls)
//		.delete(isLoggedIn, pollsHandler.deletePoll);
//
//	app.route('/polls/view')
//		.get( function(req, res){
//			res.sendFile( path + '/public/single.html');
//		})
//		.post(pollsHandler.singlePoll);	

		
		
};
