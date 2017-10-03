// modules
var WebSocketServer = require('websocket').server;
var http = require('http');

// server object
var serverObj = {};

//connections array
var connections = [];
var validTopics = []; // optional

module.exports.createSocketServer = function(options) {
    var port = 80;

    if(options) {
        if(options.validTopics) {
            if(options.validTopics instanceof Array) {
                validTopics = options.validTopics;
            } else {
                throw new Error('Invalid Format, invalid topics must be array');
            }
        }

        if(options.port) {
            if(!isNaN(port)) {
                port = options.port;
            }
        }

        if(options.ssl) { // https
            var ssl = options.ssl;

            var sslOptions = {};

            if(ssl.ca) { sslOptions.ca = ssl.ca; }

            if(ssl.cert) { sslOptions.cert = ssl.cert; }

            if(ssl.key) { sslOptions.key = ssl.key; }
            // check for cert/key

            if(sslOptions.key && sslOptions.cert) {
                var express = require('express');
                var app = express();

                serverObj.server = https.createServer(options, app, function(request, response) {
                    showStartMessage(request, response);
                });
            } else {
                throw new Error('No SSL Credentials Provided');
            }
        } else { // http
            serverObj.server = http.createServer(function(request, response) {
                showStartMessage(request, response);
            });
        }
    } 

    serverObj.server = http.createServer(function(request, response) {
        console.log((new Date()) + ' Received request for ' + request.url);
        response.writeHead(404);
        response.end();
    });
    serverObj.server.listen(port, function() {
        console.log((new Date()) + ' Server is listening on port '+port);
    });

    serverObj.wsServer = new WebSocketServer({
        httpServer: serverObj.server,

        // check socket origin
        autoAcceptConnections: false
    });

    serverObj.wsServer.on('request', function(request) {
        if (!originIsAllowed(request.origin)) {
          // Make sure we only accept requests from an allowed origin 
          request.reject();
          console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
          return;
        }
        var connection = request.accept('test', request.origin); 

        //store the new connection in your array of connections
        connection.subscriptions = [];
        connections.push(connection);

        console.log((new Date()) + ' Connection accepted.');
        
        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                parseBody(message.utf8Data, connections[connections.findIndex(x => x.remoteAddress === connection.remoteAddress)],'utf8');
            } else if (message.type === 'binary') { // todo
                console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
                parseBody(toUTF8(message.binaryData.toString()), this.connections[this.connections.findIndex(x => x.remoteAddress === connection.remoteAddress)],'binary');
            }
        });

        connection.on('close', function(reasonCode, description) {
            connections.splice(connections[connections.findIndex(x => x.remoteAddress === connection.remoteAddress)], 1);
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        });
    });

    return serverObj;
};

// ====== helper functions ======

function showStartMessage(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
}

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed. 
  return true;
}

// sends to all connected sockets
function sendToAll(message, type) {
    for(var i=0;i<connections.length;i++) {
        sendData(message, type, connections[i]);
    }
}

// sends data to all topics and subscribing ids
function sendToTopic(topic,ids,message,type) {
    for(var i=0;i<connections.length;i++) {
        if(connections[i].subscriptions.findIndex(x => x.topic === topic) >= 0) {
            var con = connections[i].subscriptions[connections[i].subscriptions.findIndex(x => x.topic === topic)];

            if(ids) {
                if(con.ids) {
                    ids = getIDArray(ids);

                    for(var c=0;c<ids.length;c++) {
                        for(var tID=0;tID<con.ids.length;tID++) {
                            if(con.ids[tID] === ids[c]) {
                                sendData(message, type, connections[i]);
                            }
                        }
                    }
                }
            } else { // send to topic
               sendData(message, type, connections[i]);
            }
        }
    } 
}

// sends data to connection as binary or utf8
function sendData(message, type, connection) {
    if(type == 'binary') {
        let buf = new Buffer(message);
        connection.sendBytes(buf);
    } else {
        connection.sendUTF(message);
    }
}

// checks if data os json
function isJSON(data) {
    try {
        JSON.parse(data);
        return true;
    } catch(e) {
        return false;
    }
}

// gets id array or makes singular id into an array
function getIDArray(data) {
    if(!(data instanceof Array)) {
        data = [data];  
    } 
    return data;
}

// manages custom commands 'routes'
function routes(message, connection, type) {
    var command = message.command;

    if(command == "send") {
        if(message.data) {
            var data = message.data;

            if(data.msg && data.topic) {
                sendToTopic(data.topic,data.id,JSON.stringify({msg: data.msg}),type);
            }
        } else {
            console.log('Received NO Data: ' + message);  
        }
    } 
}

// parses message body
function parseBody(message, connection, type) {
    if(message) {
        if(isJSON(message)) {
            message = JSON.parse(message);

            if(message.command) {
                var command = message.command;

                if(command == 'subscribe' || command == 'unsubscribe') {
                    if(message.data) {
                        var data = message.data;

                        var idIndex = connection.subscriptions.findIndex(x => x.topic === data.topic);

                        if(data.topic) {
                            console.log('data.topic');
                            if(command == "subscribe") {
                                if(validTopics.length > 0) {
                                    for(var i=0;i<validTopics.length;i++) {
                                        if(data.topic == validTopics[i]) {
                                            console.log('ii');
                                            if(idIndex < 0) {
                                                console.log('uu');
                                                var t = {topic:data.topic,ids:[]};
                                                connection.subscriptions.push(t);
                                                break;
                                            } else {
                                                break;
                                            }
                                        } else {
                                            if(i == validTopics.length - 1) {
                                                sendData("Invalid Topic",type, connection);
                                                return;
                                            }
                                        }
                                    }
                                } else {
                                    if(idIndex < 0) {
                                       var t = {topic:data.topic,ids:[]};
                                        connection.subscriptions.push(t);
                                    }
                                }
                            } else {
                                if(!data.id) {
                                    if(idIndex >= 0) {
                                        connection.subscriptions.splice(idIndex,1);
                                    }
                                }
                            }
                        }

                        if(data.id) {
                            data.id = getIDArray(data.id);
                            idIndex = connection.subscriptions.findIndex(x => x.topic === data.topic);

                            for(var i=0;i<data.id.length;i++) {                               
                                if(command == 'subscribe') {
                                    if(connection.subscriptions[idIndex].ids.indexOf(data.id[i]) < 0) {
                                        connection.subscriptions[idIndex].ids.push(data.id[i]);
                                    } 
                                } else {
                                    if(connection.subscriptions[idIndex].ids.indexOf(data.id[i]) >= 0) {
                                        connection.subscriptions[idIndex].ids.splice(connection.subscriptions[idIndex].ids.indexOf(data.id[i]),1);
                                    }
                                }
                            }
                        }

                        connections[connections.findIndex(x => x.remoteAddress === connection.remoteAddress)] = connection;
                    } else {
                        console.log('Received NO Data: ' + message);  
                    }
                } else {
                    routes(message, connection, type);
                } 
            } else { // abort
                sendData("NO Command Recieved",type, connection);
            }       
        } else { // default
            console.log('Received Message: ' + message);
        }
    } 
}