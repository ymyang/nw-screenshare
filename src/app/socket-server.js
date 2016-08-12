/**
 * Created by yang on 2016/8/8.
 */
'use strict'

const TAG = '[socket-server]-';
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const clients = {};

io.on('connection', (socket) => {
    //
    const clientId = socket.handshake.query.ci;
    console.log(TAG, 'new connection, clientId:', clientId);

    clients[clientId] = socket;

    _emit({
        type: 'join',
        clientId: clientId
    });

    socket.on('message', (msg) => {
        console.log(TAG, 'message:', JSON.stringify(msg));

        _emit(msg);
    });

    socket.on('disconnect', () => {
        console.log(TAG, 'disconnect, clientId:', clientId);

        _emit({
            type: 'leave',
            clientId: clientId
        });

        const client = clients[clientId];
        if (client) {
            clients[clientId] = null;
            delete clients[clientId];
        }
    });
});

const port = 3001;
server.listen(port, () => {
    console.log(TAG, 'socket app listening on port', port);
});


function _emit(msg) {
    if (msg.toClientId) {
        let client = clients[msg.toClientId];
        client && client.emit('message', msg);
        return;
    }

    for (let ci in clients) {
        let client = clients[ci];
        if (client && msg.clientId != ci) {
            client.emit('message', msg);
        }
    }
}