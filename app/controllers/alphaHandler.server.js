'use strict';
if (process.env.LOCAL !== false) {
	require('dotenv').load();
}
var queue = require('queue')

const https = require('https');
const querystring = require('querystring');
var pg = require('pg');
var parse = require('pg-connection-string').parse;
var config = parse(process.env.DATABASE_URL);
var aKey = process.env.ALPHA_KEY;

// const reqsToProcess = [];

function AlphaHandler() {

	this.single = function (symbol, req, res) {
		// reqsToProcess.push(objToResolve);

		//yelp api query
		if (symbol == null || symbol == "undefined") { symbol = "MSFT" }
		const queryData = querystring.stringify({
			"function": "TIME_SERIES_DAILY",
			"symbol": symbol,
			"apikey": aKey
		});
		var builtPath = ("/query?" + queryData);
		// console.log(builtPath);
		var option = {
			host: 'www.alphavantage.co',			
			port: 443,
			path: ("/query?" + queryData),
			method: 'GET',
			headers: {
				'user-agent': 'clclarkFCCStocks/1.0',
				'Accept-Language': 'en-US'			
				// 'Connection': 'keep-alive'
			},
			agent: false,
			timeout: 10000
		};

		// options.agent = new https.Agent(options);
		
		const sreq = https.request(option, (res2) => {
			var body1 = [];
			console.log(`STATUS: ${res2.statusCode}`);
			// console.log(`HEADERS: ${JSON.stringify(res2.headers)}`);
			res2.on('data', (d) => {
				body1.push(d);
				// console.log(d);
			});
			res2.on('end', () => {
				// console.log(body1);
				// console.log(JSON.parse(Buffer.concat(body1).toString()));
				try {
					var resJSON = JSON.parse(Buffer.concat(body1).toString());
					res.json(resJSON);
				} catch (e) { console.error(e); }
			});
		});//req declaration

		sreq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
			// console.log(sreq);
			res.json(JSON.stringify(
				Promise.reject({})
			));
		});

		sreq.on("timeout", (e) => {
			console.error(`request timeout: ${e.message}`);
			sreq.abort();
			//resolve empty object
			res.json(JSON.stringify(
				Promise.reject({})
			));
		});

		sreq.end();
	}//single

}//AlphaHandler

module.exports = AlphaHandler;
