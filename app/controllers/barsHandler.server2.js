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
				'Authorization': ('Bearer ' + process.env.API_KEY)
			}
		};		
		const sreq = https.request(options, (res2) => {
			let body1 = [];
			console.log(`STATUS: ${res.statusCode}`);
//			console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
//			res2.setEncoding('utf8');
			res2.on('data', (d) => {				
				body1.push(d);
			 });
			res2.on('end', () => {
				try {
					var bodyJSON = JSON.parse(Buffer.concat(body1).toString());
					//TODO promise
					
//			console.log(bodyJSON.businesses);
					console.log("all bars");
					barBuilder(bodyJSON.businesses)					
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
/*		
		config.ssl = true;
		var pool = new pg.Pool(config);
		pool.connect()
		.then(client => {
			console.log('connected')
			client.query('SELECT * FROM test_table', function (err, result){
				if (err){
					console.error(err);
					response.send("Error " + err);					
				}
				else {
					response.render('pages/db', {results: result.rows} );					
				}			
			});
		})
		.catch(err => console.error('error connecting', err.stack))
		.then(() => pool.end());
*/
	}//allBars function
	
	function storeBusinesses(data){
//		var barsJSON = JSON.parse(data);
		var barsJSON = (data);
		console.log("store bus: fn ")		
		console.log(barsJSON.length);
		
		var insertValues = [];
		
		var bNameArr = [];
		var yIdArr = [];
		
		const insertText = 'INSERT INTO bars(\"busiName\", \"yelpID\") '+
		'VALUES($1, $2) '+
//		'ON CONFLICT DO UPDATE ';
		'ON CONFLICT DO NOTHING RETURNING *';
		
		for(var i = 0; i < barsJSON.length; i++){
//			console.log("store bus: " + i);
			var busName = new String(barsJSON[i].title).substring(0,140) || null; //arbitrary cut off
			var yelpId = new String(barsJSON[i].id).substring(0,100) || null;
						
//			bNameArr.push(busName); //name
//			yIdArr.push(yelpId);		//id
		}//for loop
		
		insertValues.push(busName);
		insertValues.push(yelpId);
		//new postgresql connection
		var pool4 = new pg.Pool(config);
		pool4.connect()
		.then(client2 => {
			console.log('pg-connected4');
			client2.query(insertText, insertValues, function (err, result){
//				client2.release();
				if(err){ console.log(err);
				} else {
					console.log("inserted bars: "+ result.rowCount); 
					console.log(result);
				}
			});//client.query
		})
		.catch(err => console.error('error connecting2', err.stack))
		.then(() => {pool4.end();});		
		
	}//store businesses
	
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
				}
			}
			if(opts){	}
			resolve(aggregator);		
		});
	}//barBuilder
	
//	app.route('/bars/db')
//	.get(isLoggedIn, barsHandler.getAppts)
	
//	.post(isLoggedIn, barsHandler.addAppt)
//	.delete(isLoggedIn, barsHandler.deleteAppt);

	//search DB for bar data that user owns
	//'GET' to /bars/db
	this.getAppts = function (req, res) {
		console.log('handler.server.js.getAppts');		
		var pool = new pg.Pool(config);		
		const text = 'SELECT * FROM appts WHERE userid = $1';
		const values = [];
		const uid = req.user.id;
		values.push(uid);
console.log(uid);				
		pool.connect()
		.then(client => {
console.log('pg-connected: getAppts')
			client.query(text,values, function (err, result){
				var rc = result.rowCount;		
				client.release();
				if(err){					
					res.status(403);
					console.log(err);
					console.log("get appts error");
					res.json({barsFound: "none"});
				}
				if(rc == 0){
					res.status(200);
					res.json({barsFound: "none"});
				} else {
					//query yelp for the businesses
					//TODO for each appt, get the business info from yelp								
//					for(var r  = rc -1; r >= 0; r-- ){
//						yelpSingle(result[r]);
//						console.log(result[r]);
//					}					
//					//send the businesses
//					res.status(200);
//					console.log(result.rows);
					
//					var bodies;
					
//					const multiPass = result.rows.map(x => yelpSingle(x));
					var multiPass = result.rows.forEach( function (pgResp) {
						yelpSingle(pgResp);
//		console.log(pgResp);
					});
					
					Promise.all(multiPass).then(pResults => {
		console.log("multipass");
						barBuilder(pResults);
					})
					.then(builtResults => {
						res.json(builtResults);
					})
					.catch(e=>{console.log(e + "getappts");});					
				
				}
			});
		})
		.catch(err => console.error('error connecting', err.stack))
		.then(() => pool.end());
		

		function yelpSingle(bizId, options){
			 return new Promise((resolve, reject) => {
				var bodyJSON;
				const queryData = bizId;
		console.log("query data is:   ");				
				var options = {
					hostname: 'api.yelp.com',
					port: 443,
					path: '/v3/businesses/' + queryData,
					method: 'GET',
					headers: {
						'Authorization': ('Bearer ' + process.env.API_KEY)
					}
				};		
				const sreq = https.request(options, (resf) => {
					let body1 = [];
		console.log(`STATUS: ${res.statusCode}`);
	//				console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
	//				res2.setEncoding('utf8');
					resf.on('data', (d) => {				
						body1.push(d);
					 });
					resf.on('end', () => {
						try {
							bodyJSON = JSON.parse(Buffer.concat(body1).toString());
							resolve(bodyJSON);
	//		console.log(bodyJSON);							
						} catch (e) {
							console.error(e.message);
							reject(e);
						}
					});
				});		
				sreq.on('error', (e) => { console.error(`problem with request: ${e.message}`); reject(e); });
				sreq.end();				
			 });//promise		
		}//yelpSingle		
/*
		var idString = new String(req.user.github.id).substring(0,10);
		Bars
		.find({ $and: [{ "github.id": idString}, {'active': { $eq: true } } ]}, null, { sort: {date: -1}}, function (err, result) {
			if (err) { throw err; }
			var toSend = barBuilder(result);
			console.log('handler.server.js.getBars ' + result.length);				
			res.send(JSON.stringify(toSend));				
		});
*/
	}//getAppts
	
	this.addAppt = function (req, res) {
		var timeStamp = new String(req.query.date).substring(0,140) || null;
		var yelpId = new String(req.query.bid).substring(0,100) || null;
		var userId = new String(req.user.id).substring(0,140) || null; //arbitrary cut off
		
		// create a new user
		const insertText = 'INSERT INTO appts(userid, yelpid, timestamp, location) '+
			'VALUES($1, $2, $3, $4) '+
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
		
		//new postgresql connection
		var pool3 = new pg.Pool(config);
		pool3.connect()
		.then(client2 => {
console.log('pg-connected2');
			client2.query(insertText, insertValues, function (err, result){
				client2.release();
				if(err){
					console.log(err);
//					return done(err, null);
				} else{
console.log("inserted appt: " + result.rows[0]);
					//format user
//					var user = {	id: result.rows[0].id 	};					
//					return done(err, user);
				}
			});//client.query
		})
		.catch(err => console.error('error connecting2', err.stack))
		.then(() => pool3.end());

		/*Bars
		.findById(barToFind, {lean: false}, function (err, result){			
			if(err) {throw err;}
			//check if bar is active in the db
			if(result.active == true){
				var choicesArray = result.choiceList;
				var choiceToPush = {choice: choiceString, owner: origin, votes: []};
				choicesArray.push(choiceToPush);			
				console.log("saved: " + result.save());
				res.send(JSON.stringify(result));
			}
			else{
				res.status(403);
				res.json({bar: "not found"});
			}
		});*/
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

	this.deleteBar = function (req, res) {
		console.log("deleteBar callback");
		/*// var mongoose = require('mongoose');				
		var barToDel = new String(req.query.pid).substring(0,40);
		var barKey = mongoose.Types.ObjectId(barToDel);
		var adminObject = {};		
		if(req.user.github.id == '16168260'){									
		}
		else{
			var field = new String(req.user.github.id).substring(0,10);
			adminObject['github.id'] = field;
		}
		Bars
		.find({ $and: [{ "_id": barKey}, adminObject, {'active': { $eq: true } } ]}, function (err, result) {
			console.log(req.user.github.id);
			if(result.length > 0){
				console.log('deleteBar callback' + JSON.stringify(result));
				if (err) { res.sendStatus(404); }
				var userId = new String(req.user.github.id).substring(0,10);
				// console.log(result);
				console.log(result[0]);
				var barOwner = result[0].github.id;			
				if(userId == barOwner || userId == '16168260'){
					Bars.findByIdAndUpdate(barToDel, { $set: { active: false }},{lean: false}, function (err, dResult){			
						if(err) {throw err;}
						console.log(barToDel + " found and deleted");			
						res.sendStatus(200);			
					});		
				}			
				else{
					res.sendStatus(403);
				}						
			}
			else{
				res.sendStatus(403);
			}			
		});	*/
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
