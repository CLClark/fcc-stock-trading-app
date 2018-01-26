'use strict';

var express = require('express');
var routes = require('./app/routes/index.js');
var passport = require('passport');
var pg = require('pg');
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);
var parse = require('pg-connection-string').parse;
var config = parse(process.env.DATABASE_URL);
config.ssl = true;

var http = require('http');

var app = express();
// require('dotenv').load();
require('./app/config/passport')(passport);

app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/common', express.static(process.cwd() + '/app/common'));

var pgPool = new pg.Pool(config);

app.use(session({
	store: new pgSession({
		pool : pgPool,                // Connection pool 
		tableName : 'session'   // Use another table-name than the default "session" one 
	}),
	secret: process.env.ZOO_COOKIE_SECRET,
	resave: false,
	cookie: { maxAge: 2 * 24 * 60 * 60 * 1000 }, // 2 days
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

routes(app, passport);
var port = process.env.PORT || 8080;

//app.all('/*', function(req, res, next) {
//	    res.header("Access-Control-Allow-Origin", "*");
//	    next();
//	});


//const fs = require('fs');
//
//const options = {
//		  key: fs.readFileSync('enc/priv.pem'),
//		  cert: fs.readFileSync('enc/pub.pem')
//};

http.createServer(app).listen(port, function () {
	console.log('Node.js listening on port ' + port + '...');
});

//https.createServer(options, app).listen((8081), function () {
//	console.log('HTTPS: Node.js listening on port ' + (8081) + '...');
//});

//app.listen(port,  function () {
//	console.log('Node.js listening on port ' + port + '...');
//});
