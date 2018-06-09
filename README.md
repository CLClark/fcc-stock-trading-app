# Fullstack Javascript App for Collaborating on Stocks Tracking

## Overview

Stocks Watch App using Node.js and [Deepstream.io](https://deepstreamhub.com/open-source/?io). 

Stocks Watch allows users to collaborate in real time and implements the Deepstream.io websocket server as a Node.js module.
* Users can add and remove stocks from the shared chart from the app's homepage.
* When a user adds a stock, Node.js makes an API call to Alpha Vantage, verifying the ticker symbol and accepting the stock's performance history in JSON format.
* After a user adds a stock, all clients connected to the app update their charts with the same stock in real time.

### Deployed to Heroku and PostgresSQL

https://fcc-stock-tracking-app.herokuapp.com/

![Stockswatch Screenshot](/sw_screenshot.png)

### Acknowledgement

Thanks to [ALPHA VANTAGE](www.alphavantage.co) for realtime API access to stock data.
Thanks to [Clementine.js](https://www.clementinejs.com/) FCC Boilerplate, for inspiring the first iteration of my apps.