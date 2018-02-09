'use strict';

if(process.env.LOCAL !== true){
	// require('dotenv').load();
}
var express = require('express');
var routes = require('./app/routes/index.js');
var pg = require('pg');
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);
var parse = require('pg-connection-string').parse;
var config = parse(process.env.DATABASE_URL);
// var passport = require('passport');

config.ssl = true;

const Deepstream = require('deepstream.io')
const server = new Deepstream('./app/config/config.yml'); //
server.start();

// var deepstreamC = require('deepstream.io-client-js');
// const client = deepstreamC('ws://localhost:6020').login({username: "server"});

var http = require('http');

var app = express();
// require('./app/config/passport')(passport);

app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/common', express.static(process.cwd() + '/app/common'));

var pgPool = new pg.Pool(config);
app.use(session({
	store: new pgSession({
		pool: pgPool,                // Connection pool 
		tableName: 'session'   // Use another table-name than the default "session" one 
	}),
	secret: process.env.ZOO_COOKIE_SECRET,
	resave: false,
	cookie: { maxAge: 2 * 24 * 60 * 60 * 1000 }, // 2 days
	saveUninitialized: false
}));


// app.use(passport.initialize());
// app.use(passport.session());

routes(app);
// routes(app, passport);

var port = process.env.PORT || 8082;

http.createServer(app).listen(port, function () {
	console.log('Node.js listening on port ' + port + '...');
});