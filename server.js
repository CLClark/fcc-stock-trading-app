'use strict';

var dsConfig;
// if(process.env.LOCAL == false){
	dsConfig = "./app/config/config.yml";
// } else {
	// require('dotenv').load();
	// dsConfig = "./app/config/config-local.yml";	
// }

var express = require('express');
var routes = require('./app/routes/index.js');
var pg = require('pg');
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);
var parse = require('pg-connection-string').parse;
// var passport = require('passport');

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

var port = process.env.PORT || 8082;

const server = http.createServer(app);


const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {
	console.log("connected");
//   const location = url.parse(req.url, true);
//   // You might use location.query.access_token to authenticate or share sessions
//   // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
//   ws.on('message', function incoming(message) {
//     console.log('received: %s', message);
//   });
//   ws.send('something');
});

const Deepstream = require('deepstream.io')
const ds = new Deepstream(dsConfig);

// var deepstreamC = require('deepstream.io-client-js');
// const client = deepstreamC('ws://localhost:6020').login({username: "server"});

ds.start();

server.listen(port, function () {
	console.log('Node.js listening on port ' + port + '...');
});
