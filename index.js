var http = require("http");
var ws = require("nodejs-websocket");
var fs = require("fs");
var url = require("url");
var room = null;
var supersecretpassword = "1234"; //Private room's password
process.env.TZ = 'America/Los_Angeles'; //Home :)

function getDateTime(returnDateTime) { //Get the time, 1 for dateTime; 0 for time.

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    if(returnDateTime == 1) {
        return month + "/" + day + "/" + year + " " + hour + ":" + min + ":" + sec;
    }else{
        return hour + ":" + min + ":" + sec;
    }
}

function setRoom(conn, newRoom){ //Set the current room the user should be in.
    if( conn.currentRoom == newRoom )
        return false; //Cannot move, already in the room.
    else{
        conn.currentRoom = newRoom;
        return true;
    }
}

function getRoom(conn){ //Gets the current room the user is in.
	room_id = url.parse(conn.path, true);
    if (typeof room_id.query.room !== "undefined") {
        room = room_id.query.room;
    }
    return room;
}

function broadcast(server, msg) { //Send a message to literally every user in any room.
    server.connections.forEach(function (conn) {
        conn.sendText(getDateTime(0) + " | " + msg);
        console.log(getDateTime(1) + " | " + "[Server] => [ALL]: " + msg);
    });
}

function sendToRoom(server, room, msg) { //Send a message to all users in a specific room.
    console.log(getDateTime(1) + " | " + "[Server] => [" + room + "]: " + msg);
    server.connections.forEach(function (conn) {
        if(conn.currentRoom == room){
            conn.sendText(getDateTime(0) + " | " + msg);
        }
    });
}

function sendToUser(conn, msg){ //Send a message to only ONE user, regardless what room they're in.
    console.log(getDateTime(1) + " | " + "[Server] => [" + conn.nickname + "]: " + msg);
    conn.sendText(getDateTime(0) + " | " + msg);
}

http.createServer(function (req, res) {
	fs.createReadStream("public.html").pipe(res); //Public Chat
}).listen(8080);

http.createServer(function (req, res) {
	fs.createReadStream("private.html").pipe(res); //Private Chat
}).listen(8079);

var server = ws.createServer(function (connection) {
    //Set-up client vars
	connection.nickname = null;
	connection.password_ask = 0;
	connection.password_auth = null;
	connection.currentRoom = getRoom(connection);
	console.log(getDateTime(1) + " | [Server] New client connected - Asking for name...");
	
	connection.on("text", function (str) {
		if (connection.nickname === null) { //New user? Make their name the first thing they say!
			connection.nickname = str;
			console.log(getDateTime(1) + " | [Info]: user '" + connection.nickname + "' has entered room '" + connection.currentRoom + "'");
			sendToRoom(server, connection.currentRoom , "user '" + connection.nickname + "' has entered the room.");
            if(connection.currentRoom == "private" && connection.password_ask === 0){
                console.log(getDateTime(1) + " | [Info]: Prompting " + connection.nickname + " for the room password...");
                sendToUser(connection, connection.nickname + ", please enter the room password or be kicked.");
                connection.password_ask = 1;
            }
		}else{
            if(connection.currentRoom == "private" && connection.password_auth === null){
                if(str == supersecretpassword){
                    console.log(getDateTime(1) + " | [Info]: " + connection.nickname + " passed the password challenge.");
                    sendToUser(connection, connection.nickname + ", that password is correct. You may stay.");
                    connection.password_auth = true;
                }else{
                    console.log(getDateTime(1) + " | [Info]: " + connection.nickname + " failed the password challenge.");
                    sendToUser(connection, connection.nickname + ", that password is incorrect. You can't stay. Bye bye!");
                    sendToRoom(server, connection.currentRoom, "user '" + connection.nickname + "' failed to enter the password.")
                    connection.password_auth = false;
                    setRoom(connection,"public")
                    sendToUser(connection, "You have been moved to public chat.");
                    sendToRoom(server, connection.currentRoom, "user '" + connection.nickname + "' was moved to this room.")
                }
            }else{
                sendToRoom(server, connection.currentRoom ,"["+connection.nickname+"] " + str);
            }
		}
	});
	
	connection.on("close", function () {
        console.log(getDateTime(1) + " | [Info]: '" + connection.nickname+"' left '" + connection.currentRoom + "'");
		sendToRoom(server, connection.currentRoom, "user '" + connection.nickname + "' left the room.");
	});
	
	connection.on("error", function () { //To catch ECONNREFUSED D:<<
        console.log(getDateTime(1) + " | [Info]: '" + connection.nickname+"' abruptly left :(");
	});
	
});
server.listen(8081);
