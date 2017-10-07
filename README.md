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

## Commands

Use custom commands to perform actions.

Commands are executed similarly to express routing  

Arguments passed to the route callback are ```message```, ```type``` and ```connection```

Message contains all data recieved from the client.  
Most data needed will be in ```message.data```

Type is the content type, binary or UTF-8.  

Connection is the sending connection.

```js
var wicker = require('wicker');

wicker.route('send',(message, type, connection) => {
  // do stuff
});
```

### Sending To All Topics

```js
wicker.sendToAll('hello',type);
```

### Sending To a Specfic Topic

Topic is the topic name  

ids is the topic ids that will be recieving the data

```js
var ids = message.data.id;
var topic = message.data.topic;

// message to send to subscribers
var message = 'hello';

wicker.sendToTopic(topic,ids,message,type);
```
