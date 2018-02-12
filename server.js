'use strict';

var express = require('express');
var routes = require('./app/routes/index.js');
var pg = require('pg');
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);
var parse = require('pg-connection-string').parse;
const fs = require('fs');
// var passport = require('passport');

var dsConfig = "./app/config/config.yml";
// var port = process.env.PORT || 8082;
// require('dotenv').load();
// dsConfig = "./app/config/config-local.yml";	

// if(process.env.LOCAL == false){	
	// dsConfig = "./app/config/config.yml";
// } 


//postgresql config
var config = parse(process.env.DATABASE_URL);
config.ssl = true;

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

const server = http.createServer(app);

// var WebSocketServer = require('uws').Server;
// var wss = new WebSocketServer({ server });

// function onMessage(message) {
//     console.log('received: ' + message);
// }
// wss.on('connection', function(ws) {
//     ws.on('message', onMessage);
//     ws.send('something');
// });

const Deepstream = require('deepstream.io')
const ds = new Deepstream(dsConfig);
// var deepstreamC = require('deepstream.io-client-js');
// const client = deepstreamC('ws://localhost:6020').login({username: "server"});
ds.on("started", () => {
	console.log("*********STARTED ");
});
// ds.start();

let port = '/tmp/nginx.socket';
// let port = 8081;
server.listen(port, function () {
	console.log('Node.js listening on port ' + port + '...');
	fs.closeSync(fs.openSync('/tmp/app-initialized', 'w'));	
});



