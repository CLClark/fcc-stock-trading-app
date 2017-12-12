'use strict';

module.exports = {
	'githubAuth': {
		'clientID': process.env.GITHUB_KEY,
		'clientSecret': process.env.GITHUB_SECRET,
		'callbackURL': 'http://127.0.0.1:8080/' + 'auth/github/callback'
	}
};
