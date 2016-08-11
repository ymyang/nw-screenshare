/**
 * Created by yang on 2016/8/8.
 */
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    //
    console.log('new connection');

    //io.emit('message', { data: 'hello123'});
    //socket.emit('message', { data: 'hello'});

    socket.on('message', (msg) => {
        console.log('message:', JSON.stringify(msg));
        io.emit('message', msg);
    });
});

const port = 3001;
server.listen(port, () => {
    console.log('socket app listening on port', port);
});
