var http = require('http')
var ecstatic = require('ecstatic');
var fs = require('fs');
var Engine = require('engine.io-stream');

var httpServer = http.createServer(ecstatic({
	root: __dirname
})).listen(8080);

console.log("listening on port 8080");

var browserify = require('browserify')();
browserify.add('./client.js')
browserify.bundle().pipe(fs.createWriteStream(__dirname+'/bundle.js'));

var clients = [];
var userTable = {};
function broadcast (data) {
	for(var i=0; i < clients.length; i++) {
		clients[i].socket.write(data);
	}
}

var vidEngine = Engine(function (socket) {

	socket.once("data", function (data) {
		console.log("connection made!", data);
		clients.push({
			id: data,
			socket: socket
		});
	})

	socket.on('data', function (data) {
		broadcast(data);
	})

});

var roomEngine = Engine(function (socket) {
	console.log("socket user");
	socket.on('data', function (data) {
		var d = JSON.parse(data);
		if (!(d.id in userTable)) {
			userTable[d.id] = {
				username: d.username,
				createdAt: new Date()
			};
		}

		console.log(JSON.stringify(userTable));
		socket.write(JSON.stringify(userTable));

	})
});

vidEngine.attach(httpServer, "/video");
roomEngine.attach(httpServer, "/room");

