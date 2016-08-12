/**
 * Created by yang on 2016/8/8.
 */
var TAG = '[socket-server]-';
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const clients = [];

io.on('connection', (socket) => {
    //
    console.log(TAG, 'new connection');

    clients.push(socket);

    socket.on('message', (msg) => {
        console.log(TAG, 'message:', JSON.stringify(msg));

        clients.forEach((client) => {
            if (client != socket) {
                client.emit('message', msg);
            }
        });
    });
});

const port = 3001;
server.listen(port, () => {
    console.log(TAG, 'socket app listening on port', port);
});
