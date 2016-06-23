/**
 * Created by mosluce on 2016/6/23.
 */
const express = require('express'),
    app = express(),
    path = require('path'),
    fs = require('fs'),
    http = require('http').createServer(app),
    io = require('socket.io')(http),
    redis = require('socket.io-redis'),
    uuid = require('uuid');

var bcs = {};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

http.listen(process.env.PORT || 3000, () => {
    console.log('http is listening...')
});

io.on('connection', (socket) => {

    socket.on('start broadcast', (data) => {
        var bc = bcs[data.channel];

        socket.channel = data.channel;

        if (bc) {
            socket.emit('broadcast fail', {});
        } else {
            const room = new Buffer(uuid.v4()).toString('base64');
            bcs[data.channel] = {
                bc: socket.id,
                room: room
            };
        }
    });

    socket.on('start watch', (data) => {

        var bc = bcs[data.channel];

        socket.channel = data.channel;
        socket.isWatcher = true;

        if (bc) {
            socket.join(bc.room);
            socket.to(bc.bc).emit('watch', {watcher: socket.id});
        } else {
            socket.emit('watch fail', {});
        }
    });

    socket.on('offer', function (data) {
        socket.to(data.watcher).emit('offer', {
            channel: socket.channel,
            sdp: data.sdp
        });
    });

    socket.on('answer', function (data) {
        console.log(data);

        var bc = bcs[socket.channel];

        socket.to(bc.bc).emit('answer', {
            sdp: data.sdp,
            watcher: socket.id
        });
    });

    socket.on('ice', function (data) {
        socket.to(data.watcher).emit('ice', data);
    });

    socket.on('disconnect', () => {
        if(socket.isWatcher) return;

        var bc = bcs[socket.channel];

        if (bc) {
            socket.to(bc.room).emit('stop broadcast', {});
            delete bcs[socket.channel];
        }
    });
});

