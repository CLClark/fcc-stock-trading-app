'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');
var PollsHandler = require(path + '/app/controllers/pollsHandler.server.js');

module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/login');
		}
	}

	function isAuthed(req, res, next){		
		if (req.isAuthenticated()) {
			return next();
		} else {
			res.json({authStatus:0});	
		}		
	}

	var clickHandler = new ClickHandler();
	var pollsHandler = new PollsHandler();

	app.route('/main.html')
		.get(function (req, res){
			res.sendFile(path + '/public/main.html');
		});

	app.route('/main_unauth.html')
		.get(function (req, res){
			res.sendFile(path + '/public/main_unauth.html')
		});

	app.route('/')
		.get(function (req, res) {
		//.get(function (req, res) {
			res.sendFile(path + '/public/main.html');
		});
	
	app.route('/index')
		.get(isLoggedIn, function (req, res){
			res.sendFile(path + '/public/index.html');
		});

	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/login');
		});

	app.route('/profile')
		.get(isLoggedIn, function (req, res) {
			res.sendFile(path + '/public/profile.html');
		});

	app.route('/api/:id')
		.get(isLoggedIn, function (req, res) {
			pollsHandler.myPolls(req, res);
//			res.json(req.user.github);
		});

	app.route('/auth/github')
		.get(passport.authenticate('github'));

	app.route('/auth/github/callback')
		.get(passport.authenticate('github', {
			successRedirect: '/profile',
			failureRedirect: '/login'
		}));

	app.route('/auth/check')
		.get(isAuthed, function (req, res){			
			res.json({authStatus:1});
		});

	app.route('/api/:id/clicks')
		.get(isLoggedIn, clickHandler.getClicks)
		.post(isLoggedIn, clickHandler.addClick)
		.delete(isLoggedIn, clickHandler.resetClicks);	

	app.route('/polls')
		.get(pollsHandler.allPolls)
		.post(isLoggedIn, pollsHandler.addPoll);

	app.route('/polls/votes')
		.delete(isLoggedIn, pollsHandler.removeChoice)
		.post(pollsHandler.addVote)
		.get(isLoggedIn, pollsHandler.addChoice);

	app.route('/polls/db')
		.get(isLoggedIn, pollsHandler.getPolls)
		.delete(isLoggedIn, pollsHandler.deletePoll);

	app.route('/polls/view')
		.get( function(req, res){
			res.sendFile( path + '/public/single.html');
		})
		.post(pollsHandler.singlePoll);
		
};
