'use strict';

const https = require('https');
const querystring = require('querystring');
require('dotenv').load();
var pg = require('pg');
var parse = require('pg-connection-string').parse;
var config = parse(process.env.DATABASE_URL);


function BarsHandler () {
	
	
	//find all active bars (for app home page)
	this.allBars = function (req, res) {
		console.log('allBars callback');
		//TODO find all bars in searched locale
		//yelp api query
		//save to session
		var zipLocation = req.query.zip;
		req.session.lastZip = zipLocation;
		console.log(req.session.lastZip);
		const queryData = querystring.stringify({			
			term: 'bars',
			'location': zipLocation.toString(),
			categories: 'bars',
			limit: 10
		});
		console.log(queryData);
		
		const options = {
			hostname: 'api.yelp.com',
			port: 443,
			path: '/v3/businesses/search?' + queryData,
			method: 'GET',
			headers: {
				'Authorization': ('Bearer ' + process.env.API_KEY),
				'user-agent': 'clclarkFCC/1.0',
				'Accept-Language': 'en-US',
				// 'Accept-Encoding': 'gzip, deflate, br',
				'Connection': 'keep-alive'				
			}
		};		
		const sreq = https.request(options, (res2) => {
			var body1 = [];
			console.log(`STATUS: ${res2.statusCode}`);
//			console.log(sreq.socket.remoteAddress);
			// console.log(`HEADERS: ${JSON.stringify(res2.headers)}`);
			// res2.setEncoding('utf8');

			res2.on('data', (d) => {
				body1.push(d);								
				// console.log(d);
			 });
			res2.on('end', () => {
				// console.log(body1);
				// console.log(JSON.parse(Buffer.concat(body1).toString()));
				try {
					var resJSON = JSON.parse(Buffer.concat(body1).toString());										
					console.log("all bars");
					barBuilder(resJSON.businesses)					
					.then( builtResults => {
						res.json(builtResults);
						storeBusinesses(builtResults);
					})
					.catch(e=>{
						console.log(e + " all bars error");});					
				} catch (e) {
					console.error(e);
				}
			});
		});		
		sreq.on('error', (e) => {			
			console.error(`problem with request: ${e.message}`);
		});
		sreq.end();
	}//allBars function
	
	function storeBusinesses(data){
//		var pool4 = new pg.Pool(config);
//		var p = Promise.resolve();		
//		for (let i = 0; i < data.length; i++) {
//			p = p.then(() => {
//				storeBusiness(data[i], pool4);				
//			});			
//		}//for loop
		
		const pool5 = new pg.Pool(config);
		let bars = [];
		
		var multiBar = data.forEach( function (eachBar) {											
			var promToP = storeBusiness(eachBar, pool5);
			bars.push(promToP);						
		});			
		
		Promise.all(bars)		
		.then(doneInserting => (pool5.end()))
		.catch(e=>{console.log(e + "store businesses error");});	
		
	}//store businesses	
	
	
	function storeBusiness(data, poolInst){		
		
		return new Promise((resolve, reject)=>{	
			
			var barsJSON = (data);
//			var pool4 = new pg.Pool(config);	
			var pool4 = poolInst;
//			console.log("store business: ")

			var i = 0;
		
			const insertText = 'INSERT INTO bars(\"busiName\", \"yelpID\") '+
			'VALUES($1, $2) '+
			'ON CONFLICT DO NOTHING RETURNING *';
						
			var busName = new String(barsJSON.title).substring(0,140) || null; //arbitrary cut off
			var yelpId = new String(barsJSON.id).substring(0,100) || null;
			
			var insertValues = [];
			insertValues.push(busName);
			insertValues.push(yelpId);	console.log(insertValues);
			
			//new postgresql connection
			pool4.connect()
			.then(client2 => {
				console.log('pg-connected4');				
				client2.query(insertText, insertValues, function (err, result){
					client2.release();
					if(err){
						console.log(err);
						reject(err);
					} else {
						resolve(result);
						console.log("inserted bars: "+ result.rowCount);						
					}
				});//client.query
			})
			.catch(err => console.error('error connecting2', err.stack));
//			.then(() => {pool4.end()});
		}); //promise
	}//store businesses
	
	/*
	appt object:
		timestamp	
		userid	
		yelpid	
		location	
		active
	*/
	function barBuilder(result, opts){
		//TODO turn this into a PROMISE, and update any dependencies
		return new Promise((resolve, reject)=>{
			console.log("barBuilder callback");
			if(!Array.isArray(result)){
				console.log(result);
				reject("input not an array");
			}
			var aggregator = [];		
			var currentBar = ""; var currentPIndex = -1;
			var totalVotes = 0;
			var vRay = [];		
			for( var i = 0; i < result.length; i++){
				var barId = result[i].id || "";			
				if(currentBar !== barId){
					currentBar = barId;
					aggregator.push({
						id: barId,
						title: result[i].name,					
						rating: result[i].rating,
						coordinates: result[i].coordinates,
						price: result[i].price,
						display_phone: result[i].display_phone	,
						image_url: result[i].image_url,
						url: result[i].url
					});
					if(opts){
						let leng = aggregator.length;
						aggregator[(leng - 1)]["appt"] = result[i].appt;
						delete aggregator[(leng - 1)]["appt"].userid;
						delete aggregator[(leng - 1)]["appt"].location;
						delete aggregator[(leng - 1)]["appt"].active;
					}				
				}//if current bar
			}//for loop
			if(opts){console.log(opts);}
			resolve(aggregator);		
		});
	}//barBuilder
	
//	app.route('/bars/db')
//	.get(isLoggedIn, barsHandler.getAppts)	
//	.post(isLoggedIn, barsHandler.addAppt)
//	.delete(isLoggedIn, barsHandler.deleteAppt);

	//search DB for bar data that user owns//'GET' to /bars/db
	this.getAppts = function (req, res) {
		console.log('handler.server.js.getAppts');		
		var pool = new pg.Pool(config);

		function queryMaker(){
			return new Promise((resolve, reject) => {
				//query for only active "true" appointments
				var text = 'SELECT * FROM appts WHERE userid = $1 AND NOT active = false';

				const values = [];
				var uid = req.user.id;
				values.push(uid);

				//check if query has any appts
				if( req.query.hasOwnProperty('appts')		&& Array.isArray(req.query.appts)){
					//yes> add each appt and text to the arrays
					console.log(Array.isArray(req.query.appts) + " : is array check");
					let cap = req.query.appts.length - 1;
					var combNots = req.query.appts.reduce( function (acc, cVal, cInd, array) {
							values.push(cVal);
							if(cInd < cap){
								return acc.concat(('$' + (2 + cInd) + ', '));
							}
							else{
								return acc.concat(('$' + (2 + cInd)));
							}	
						}, (text.concat(	' AND _id NOT IN ('	))
					);
					resolve([ combNots.concat(')'), values]);
				}				
				else{
					console.log(Array.isArray(req.query.appts) + " : is array check");	
					//no>return the text/values:
					resolve([text, values]);
				}
			});
		}

		queryMaker().then((textArray) => {
			var text = textArray[0];
			console.log(text);	
			var values = textArray[1];
			console.log(values);
			pool.connect()
			.then(client => {
				console.log('pg-connected: getAppts')
				client.query(text, values, function (err, result){
					if(err){					
						res.status(403);
				console.log(err);
				console.log("get appts error");
						res.json({barsFound: "none"});
					}
					let rc = result.rowCount;		
					client.release();
					if(rc == 0){
						res.status(200);
						res.json({barsFound: "none"});
					} else {					
						/*
						var bodies;// = [];
						var intervalT = 0;
						var multiPass = result.rows.forEach( function (pgResp) {
							let promToP;					
							setTimeout(function(){
								promToP = yelpSingle(pgResp, null);
								if(bodies){								
									bodies.push(promToP);
								} else {
									bodies = [];
									bodies.push(promToP);
								}
							}, intervalT += 100);
							console.log(intervalT);
						});								
						*/
/* 
						var invalidEntries = 0;
						function isArray(obj) {
							return obj !== undefined && typeof(obj) === 'array' && !isNaN(obj);
						}
						function filterByID(item) {
							if (isArray(item.id)) {
								return true;
							} 
							else{
								invalidEntries++;
								return false;
							}						 
						}
						var arrByID = arr.filter(filterByID);
						console.log('Filtered Array\n', arrByID); 
 */
						const promiseSerial = funcs =>
							funcs.reduce((promise, func) =>
								promise.then(result => func().then(Array.prototype.concat.bind(result))),
								Promise.resolve([])
							);
						// convert each url to a function that returns a promise
						const funcs = result.rows.filter(rowCheck => rowCheck).map(
							pgResp => () => yelpSingle(pgResp, null)							
						);

						promiseSerial(funcs)		
						.then(promies =>(barBuilder(promies, true)))
						.then(builtBars => {
							res.json(builtBars);
							console.log("builtBarsVVVV");
							// console.log(builtBars);
						})
						.catch(e=>{console.log(e + "loopy Loop");});	
											
					}
				});
			})
			.catch(err => console.error('error connecting', err.stack))
			.then(() => pool.end());
		})
		.catch(err => console.error('error getAppts', err.stack))

		function yelpSingle(appt, options){
			/*
			appt object:				
				timestamp	
				userid	
				yelpid	
				location	
				active
				_id
			*/
			 return new Promise((resolve, reject) => {
//				console.log(appt);
				var queryData = querystring.escape(appt.yelpid);
//				var queryData = (appt.yelpid);
				console.log("query data is:   " + queryData);
				
				var bodyJSON;						
				var options = {
					hostname: 'api.yelp.com',
					port: 443,
					path: ('/v3/businesses/' + queryData),
					method: 'GET',
					headers: {
						'Authorization': ('Bearer ' + process.env.API_KEY),
						'user-agent': 'clclarkFCC/1.0',
						'Accept-Language': 'en-US',
						// 'Accept-Encoding': 'gzip, deflate, br'
					},
					timeout: 4000
				};				
				const yreq = https.request(options, (resf) => {
					var body1 = [];
					console.log(`STATUS: ${res.statusCode}` + "yelp Single");
					// console.log(`HEADERS: ${JSON.stringify(resf.headers)}`);
//					resf.setEncoding('utf8');					
					if(resf.headers["content-type"] == "application/json"){
					
						resf.on('data', (d) => {
							body1.push(d);
						 });
						resf.on('end', () => {
							try {
								// console.log(body1);
// console.log("pre-parse");
								let bodyJSON = JSON.parse(Buffer.concat(body1).toString());
//								bodyJSON = concated.toJSON();								
// console.log(">>>>post-parse");
								//add original appointment data
								bodyJSON["appt"] = appt;	
								
								console.log(JSON.stringify(bodyJSON).substring(0,20));
								console.log("json body rec'd ***************");
								
								resolve(bodyJSON);
							} catch (e) {
								// console.log(bodyJSON);
								console.error(e.message);
								reject(e);
							}
							
						});
					}//if content type
					else{
						resf.on('data', (d) => {
							    process.stdout.write(d);
						});
						resf.on('end', () => {
							reject("not json");	
						});						
					}
				});
				yreq.on('timeout', (e) => {
					console.error(`request timeout: ${e.message}`); 
					yreq.abort();
					resolve({});
				});
				yreq.on('error', (e) => { console.error(`problem with request: ${e.message}`); reject(e); });
				yreq.end();	
			 });//promise		
		}//yelpSingle		
	}//getAppts
	
	this.addAppt = function (req, res) {
		var timeStamp = new String(req.query.date).substring(0,140) || null;
		var yelpId = new String(req.query.bid).substring(0,100) || null;
		var userId = new String(req.user.id).substring(0,140) || null; //arbitrary cut off		
		// create a new user
		const insertText = 'INSERT INTO appts(userid, yelpid, timestamp, location, active) '+
			'VALUES($1, $2, $3, $4, $5) '+
//			'ON CONFLICT DO UPDATE ';
			'RETURNING *';
		const insertValues = [];
		insertValues.push(userId); //id
//		if(profile.displayName){ //displayName
		insertValues.push(yelpId);
//		} else{insertValues.push('null');}
//		if(profile.gender){ //gender
		insertValues.push(timeStamp);
//		} else{insertValues.push('null');}
		do{	insertValues.push('{null}'); //ensure length
		} while(insertValues.length < 4);
		insertValues.push(true);
		
		//new postgresql connection
		var pool3 = new pg.Pool(config);
		pool3.connect()
		.then(client2 => {
console.log('pg-connected2');
			client2.query(insertText, insertValues, function (err, result){
				client2.release();
				if(err){console.log(err);
				res.sendStatus(404);
				} else{
					console.log("inserted appt: ");
					console.log(result.rows[0]);
					yelpSingle(result.rows[0], null)
					.then(promies =>(barBuilder([promies], true)))
					.then(builtBars => {
						res.json(builtBars[0]);
						console.log("builtAddAppt");
						// console.log(builtBars);
					})
					.catch(e=>{console.log(e + "add appt yelpy");});
				}
			});//client.query
		})
		.catch(err => console.error('error connecting2', err.stack))
		.then(() => pool3.end());
		console.log('addAppt callback');
	}//addAppt
	
	
	//search data for user profile + bars
	this.myBars = function (req, res) {
		console.log('myBars callback');
/*
		var idString = new String(req.user.github.id).substring(0,10);
		Bars
		.find({ $and: [{ "github.id": idString}, {'active': { $eq: true } } ]}, null, { sort: {date: -1}}, function (err, result2) {
			if (err) { throw err; }
			//add aggregate bar query data to user object
			var analyze = barBuilder(result2, true);
			var newUserObj = JSON.parse(JSON.stringify(req.user.github));
			newUserObj["totalVotes"] = analyze["totalVotes"];
			newUserObj["uniqueVoters"] = analyze["uniqueVoters"];
			res.json(newUserObj);				
		});	
*/
	};

	function yelpSingle(appt, options){
		/*
		appt object:				
			timestamp	
			userid	
			yelpid	
			location	
			active
			_id
		*/
		 return new Promise((resolve, reject) => {
//				console.log(appt);
			var queryData = querystring.escape(appt.yelpid);
//				var queryData = (appt.yelpid);
			console.log("query data is:   " + queryData);			
			var bodyJSON;						
			var options = {
				hostname: 'api.yelp.com',
				port: 443,
				path: ('/v3/businesses/' + queryData),
				method: 'GET',
				headers: {
					'Authorization': ('Bearer ' + process.env.API_KEY),
					'user-agent': 'clclarkFCC/1.0',
					'Accept-Language': 'en-US',
					// 'Accept-Encoding': 'gzip, deflate, br'
				}
			};
			
			const yreq = https.request(options, (resf) => {
				var body1 = [];
				console.log(`STATUS: ${resf.statusCode}` + "yelp Single");
				// console.log(`HEADERS: ${JSON.stringify(resf.headers)}`);
//					resf.setEncoding('utf8');					
				if(resf.headers["content-type"] == "application/json"){
				
					resf.on('data', (d) => {
						body1.push(d);
					 });
					resf.on('end', () => {
						try {
//							console.log(body1);
// console.log("pre-parse");
							let bodyJSON = JSON.parse(Buffer.concat(body1).toString());
//								bodyJSON = concated.toJSON();								
// console.log(">>>>post-parse");
							//add original appointment data
							bodyJSON["appt"] = appt;	
							
							console.log(JSON.stringify(bodyJSON).substring(0,20));
							console.log("json body rec'd ***************");
							
							resolve(bodyJSON);
						} catch (e) {
							console.log(bodyJSON);
							console.error(e.message);
							reject(e);
						}
						
					});
				}//if content type
				else{
					resf.on('data', (d) => {
						    process.stdout.write(d);
					});
					resf.on('end', () => {
						reject("not json");	
					});						
				}
			});		
			yreq.on('error', (e) => { console.error(`problem with request: ${e.message}`); reject(e); });
			yreq.end();	
		 });//promise		
	}//yelpSingle		
	
	//find a single bar in the db
	this.singleBar = function (req, res, next) {
		console.log('handler.server.js.singleBar');
/*
		var ObjectId = require('mongoose').Types.ObjectId;
		var barId = new String(req.query.pid).substring(0,40) || "";
		var idCheck = ObjectId.isValid(barId);
		
		if(idCheck){
			var barKey = new mongoose.Types.ObjectId(barId);
			Bars
			.find({ $and: [{ "_id": barKey}, {'active': { $eq: true } } ]}, function (err, result) {
				if (err) { throw err; }
				if(result.length > 0){
					var singleResult = barBuilder(result);
					res.send(JSON.stringify(singleResult));	
				}
				else{				
					console.log("bar query failed");
					res.location('/');			
					res.sendStatus(404);
				}
			});	
		}else{
			console.log("id fails");
			res.location('/');			
			res.sendStatus(404);
		}		
*/
	};
	
	this.addBar = function (req, res) { 
		console.log('handler.server.js.addBar');		
		/*
		var singleBar = new Bars();
		var queryObj = JSON.parse(req.query.q);
		var choicesObj = {};
		var choiceQArr = queryObj.choiceList;
		var stringId = new String(req.user.github.id).substring(0,10);

		console.log(queryObj);		
		for (var i = choiceQArr.length - 1; i >= 0; i--) {						
			choicesObj.owner = stringId;
			choicesObj.choice = choiceQArr[i];
			singleBar.choiceList.push(choicesObj);
		};
		
		singleBar.title = queryObj.title;
		singleBar.active = true;
		singleBar.github = req.user.github;
		singleBar.date = Date.now().toString();
		singleBar.save();		
		console.log(JSON.stringify(singleBar));
		res.sendStatus(200);
		*/
	}

	this.deleteAppt = function (req, res) {

		var apptId = new String(req.query.appt).substring(0,100) || null;
		var userId = new String(req.user.id).substring(0,140) || null; //arbitrary cut off		
		// create a new user
		const insertText = 'UPDATE  appts SET active = false '+
			"WHERE _id = \'" + apptId + "\' AND " +
			" userid = \'" + userId + "\'" +
			'RETURNING *';
		/*		
		const insertValues = [];
		insertValues.push(userId); //id
//		if(profile.displayName){ //displayName
		insertValues.push(yelpId);
//		} else{insertValues.push('null');}
//		if(profile.gender){ //gender
		insertValues.push(timeStamp);
//		} else{insertValues.push('null');}
		do{	insertValues.push('{null}'); //ensure length
		} while(insertValues.length < 4);
		insertValues.push(true);
		*/
		//new postgresql connection
		let pool3 = new pg.Pool(config);
		pool3.connect()
		.then(client2 => {
console.log('pg-connected5');
			client2.query(insertText, function (err, result){
				client2.release();
				if(err){console.log(err);
					res.status(403);
					res.json({undefined: null});
				} else{
console.log("expired appt: "); console.log(result.rows[0]["_id"]);
					res.status(200);
					res.json({appt: "expired"});
				}
			});//client.query
		})
		.catch(err => console.error('error connecting2', err.stack))
		.then(() => pool3.end());
		console.log('deleteAppt callback');
		
	}//this.deleteBar

	this.removeChoice = function (req, res) {
		console.log('removeChoice callback');
	}



	this.addVote = function (req, res) {
		console.log('addVote callback' + req.ip.substring(0,100));
		/*
		//check if previously voted (ip or id)
		var barToFind = req.query.pid.substring(0,40);
		var choiceToAdd = req.query.cid.substring(0,140);
		var origin = req.ip.substring(0,100);
		console.log(req.ip.substring(0,100)+ " : IP ORIGIN ******************");
		
		
		Bars
		.findById(barToFind, {lean: false}, function (err, result){			
			if(err) {throw err;}
			//check if bar is active
			if(result.active == true){
				var choicesArray = result.choiceList;
				var combinator = []; 
				//combine IPs to check against
				for (var i = choicesArray.length - 1; i >= 0; i--) {
					combinator = combinator.concat(choicesArray[i].votes);
				};

				//check if vote exists for user's ip address
				var flagIp = false;
				combinator.forEach(function (vObj, index, combArray){				
					if(vObj.ip == origin) {					
						flagIp = true;					
						return;
					}
				});
				//if request passes the ip test, record vote
				if(flagIp == false){
					var whereToPush = choicesArray.id(choiceToAdd);
					var whenToPush = new Date().getTime();
					//console.log(whereToPush);
					var voteToPush = {ip: origin, date: whenToPush};
					var resultPush = whereToPush.votes.push(voteToPush);
					//console.log(resultPush);
					result.save();
					console.log("found " + resultPush);
					
					//respond with updated bar					
					var ObjectId = require('mongoose').Types.ObjectId;
					var barId = barToFind || "";
					var idCheck = ObjectId.isValid(barId);
					
					if(idCheck){
						var barKey = new mongoose.Types.ObjectId(barId);
						Bars
						.find({ $and: [{ "_id": barKey}, {'active': { $eq: true } } ]}, function (err, result) {
							if (err) { throw err; }
							if(result.length > 0){
								var singleResult = barBuilder(result);
								res.send(JSON.stringify(singleResult));	
							}
							else{				
								console.log("bar query failed");
								res.location('/');			
								res.sendStatus(404);
							}
						});	
					}else{
						console.log("id fails");
						res.location('/');			
						res.sendStatus(404);
					}
				}
				else if(flagIp == true){
					res.status(403);
					res.json({voteStatus: "already-voted"});
				}
			}			
		});
		*/
	}
}

module.exports = BarsHandler;
