# Voting App built on the Clementine.js FCC Boilerplate

## Overview

Voting app using Github Authentication

### Setup GitHub Authentication

Please follow [this guide](http://www.clementinejs.com/tutorials/tutorial-passport.html#GitHubAppSetup) to register the application with GitHub and get API keys / secrets.

### Local Environment Variables

Create a file named `.env` in the root directory. This file should contain:

```
GITHUB_KEY=your-client-id-here
GITHUB_SECRET=your-client-secret-here
MONGO_URI=mongodb://localhost:27017/clementinejs
PORT=8080
APP_URL=http://localhost:8080/
```

### Starting the App

To start the app, make sure you're in the project directory and type `node server.js` into the terminal. This will start the Node server and connect to MongoDB.

You should the following messages within the terminal window:

```
Node.js listening on port 8080...
```

Next, open your browser and enter `http://localhost:8080/`. Congrats, you're up and running!
