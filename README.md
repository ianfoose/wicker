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

### Specifying the Protocol

You can specify another protocol other than the default 'echo-protocol'  

Specify it in the 'protocol' option.

```js
var server = wicker.createServer({ port: 80, protocol: 'test-protocol' });
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

Reserved routes are ```subscribe``` and ```unsubscribe```

Routes are not case sensative  

Arguments passed to the route callback are ```message``` and ```connection```

Message contains all data recieved from the client.  
Most data needed will be in ```message.data```

Connection is the sending connection.

```js
var wicker = require('wicker');

wicker.route('send',(message, connection) => {
  // do stuff
});
```

### Sending To All Topics

```js
wicker.sendToAll('hello');
```

### Sending To a Specfic Topic

Topic is the topic name  

ids is the topic ids that will be recieving the data and is optional, only use the parameter when you wish to target only a subsset of the topic.

```js
var ids = message.data.id;
var topic = message.data.topic;

// message to send to subscribers
var message = 'hello';

wicker.sendToTopic(topic,message,ids);
```

## Client Commands

All data needs to be sent as json or else it will not be parsed by the server.  

### Data Payload

All payloads must contain a 'command' key to be executed.

All topic data such as topic name and associated IDs must be in the 'data' key of the payload.  

Any other data you wish to send can be placed in the payload however you like.  

### Subscribe To a Topic

```json
{
     "command":"subscribe",
     "data":
         {
             "topic":"topicname"
         }
}
```

### Unsubscribe To a Topic

```json
{
     "command":"unsubscribe",
     "data":
         {
             "topic":"topicname"
         }
}
```

### Subscrbing To Topics By ID

You can pass an array of item IDs that belong to a topic to a topic.

IDs can be used for subscribing, unsubscribing,or for routes.

```json
{
     "command":"route",
     "data":
         {
             "topic":"topicname",
             "id":[12,789]
         }
}
```

### Routes

Replace "any-data-key" with the key for your data.  

Customize data payload as you like.

```json
{
     "command":"route",
     "data":
         {
             "topic":"topicname",
             "any-data-key":"data"
         }
}
```
