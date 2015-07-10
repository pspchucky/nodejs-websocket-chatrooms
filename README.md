# nodejs-websocket-chatrooms
A quick and dirty rendition of a basic IRC chatroom using https://github.com/sitegui/nodejs-websocket
# What does it do?
There are 2 chatrooms
* Public
* Private

The private chat has a password and any wrong password guesses redirects the client to the public chat room server-side.
The public chat is open for everyone and where private chatters get moved to.
# How do I use it?
Pull the entire master repository and then run the index.js
The server will listen on ports 
* 8079 (private.html)
* 8080 (public.html)
* 8081 (Websocket)
And everything is going on in all rooms is logged to the console.

# What if I don't want to use the provided html files?
Then remove the code that uses them. The websocket server will still be there and allows you to add an infinite amount of chatrooms. For example, you can connect to the server and start in 'YourRoomName' by using
```php
ws://<address>:8081/?room=YourRoomName
```
as your websocket URL.
# Known Bugs
* Private room messages can be viewed while the server waits for the client to enter private room password.
* The title of webpage doesn't update to the current chatroom the client is chatting in.
