'use strict';

module.exports = {
	'facebookAuth': {
		'clientID': process.env.FACEBOOK_KEY,
		'clientSecret': process.env.FACEBOOK_SECRET,
		'callbackURL': process.env.APP_URL + 'auth/facebook/callback'
	}
};
