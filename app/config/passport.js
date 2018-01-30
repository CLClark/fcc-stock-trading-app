'use strict';
if(process.env.LOCAL !== true){
	require('dotenv').load();
}

var FacebookStrategy = require('passport-facebook').Strategy;
var configAuth = require('./auth');
var pg = require('pg');
var parse = require('pg-connection-string').parse;
var config = parse(process.env.DATABASE_URL);
config.ssl = true;

module.exports = function (passport) {
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		var pool = new pg.Pool(config);

		const text = 'SELECT * FROM users WHERE id = $1';
		const values = [];
		values.push(id);

		pool.connect()
			.then(client => {
				console.log('pg-connected: deser')
				client.query(text, values, function (err, result) {
					client.release();
					if (err) {
						return done(err, null);
					}
					if (result.rowCount == 0) {
						return done(err, null);
					} else {
						//format deserialized user
						var user = { id: result.rows[0].id, displayName: result.rows[0].displayName };
						return done(err, user);
					}
				});
			})
			.catch(err => console.error('error connecting', err.stack))
			.then(() => pool.end());
	});

	passport.use(new FacebookStrategy({
		clientID: configAuth.facebookAuth.clientID,
		clientSecret: configAuth.facebookAuth.clientSecret,
		callbackURL: configAuth.facebookAuth.callbackURL,
		//		enableProof: true
		state: true
	},
		function (token, refreshToken, profile, done) { //cb
			process.nextTick(function () {
				var pool = new pg.Pool(config);

				const text = 'SELECT * FROM users WHERE id = $1';
				const values = [];
				const userId = profile.id;
				values.push(userId);

				pool.connect()
					.then(client => {
						console.log('pg-connected: verify');
						client.query(text, values, function (err, result) {
							if (err) {
								return done(err, null);
							}
							if (result.rowCount == 0) {
								// create a new user
								const insertText = 'INSERT INTO users(id, \"displayName\", gender, locations) VALUES($1, $2, $3, $4) RETURNING *';
								const insertValues = [];
								insertValues.push(userId); //id
								if (profile.displayName) { //displayName
									insertValues.push(profile.displayName);
								} else { insertValues.push('null'); }
								if (profile.gender) { //gender
									insertValues.push(profile.gender);
								} else { insertValues.push('null'); }
								do {
									insertValues.push('{null}'); //ensure length
								} while (insertValues.length < 4);

								//new postgresql connection
								var pool2 = new pg.Pool(config);
								pool2.connect()
									.then(client2 => {
										console.log('pg-connected2');
										client2.query(insertText, insertValues, function (err, result) {
											client2.release();
											if (err) {
												return done(err, null);
											} else {
												console.log("inserted 1 user: " + result.rows[0].id);
												//format user
												var user = { id: result.rows[0].id, displayName: result.rows[0].displayName };

												return done(err, user);
											}
										});//client.query
									})
									.catch(err => console.error('error connecting2', err.stack))
									.then(() => pool2.end());
							}
							//found existing user in db
							else if (result.rowCount == 1) {
								console.log("found user in db: " + result.rows[0].id);
								//format user
								var user = { id: result.rows[0].id, displayName: result.rows[0].displayName };
								return done(err, user);
							}
						});
					})
					.catch(err => console.error('error connecting', err.stack))
					.then(() => pool.end());
			}); //nextTick (async)
		})); //use callback//passport.use
};
