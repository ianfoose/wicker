# wicker
A WebSocket Server module for Node.js

# Use

## Install

To use this module, install via npm ```npm install wicker```  
or by manually including the file ```var wicker = require('./wicker.js');```


## Creating a Server

```js
var wicker = require('wicker');

var server = wicker.createServer({ port: 80 });
```

## SSL

```js
var wicker = require('wicker');

var sslOptions = { key: keyFile, cert: certFile };

var server = wicker.createServer({ port: 80, ssl: sslOptions });
```

## Valid Topics

Valid topics must be an array.

```js
var wicker = require('wicker');

var topics = ['posts','comments'];

var server = wicker.createServer({ port: 80, validTopics: topics });
```
