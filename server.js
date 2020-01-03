const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let onlineUser = [];    // 在线用户
let userInfo = [];      // 在线用户信息（姓名+头像）

/** 中间件 **/
// 默认www为静态文件夹
app.use('/', express.static(__dirname + '/www'));

/**
 * 每个连接的用户都有专有的socket
 * io.emit(foo) 触发所有用户的foo事件
 * socket.emit(foo) 只触发当前用户的foo事件
 * socket.broadcast.emit(foo) 触发除当前用户之外的其他用户的foo事件
 */
io.on('connection', socket => {
    // 渲染在线用户
    io.emit('displayUser', userInfo);

    // 登录、检测用户名
    socket.on('login', user => {
        if (onlineUser.some(item => item.name === user.name)){
            socket.emit('loginFailure');
        }else{
            onlineUser.push(user.name);
            userInfo.push(user);

            socket.emit('loginSuccess');
            socket.nickname = user.name;
            io.emit('system', {
                name: user.name,
                msg: '进入了聊天室',
            });
            io.emit('displayUser', userInfo);
            console.log(`**** ${onlineUser.length}个用户已连接 ****`);
        }
    });

    // 发送窗口抖动
    socket.on('shake', () => {
        socket.emit('shake', { name: '您' });
        socket.broadcast.emit('shake', { name: socket.nickname });
    });

    // 发送消息
    socket.on('sendMsg', data => {
        const img  = userInfo.filter(user => user.name === socket.nickname);
        const msg = {
            name: socket.nickname,
            msg: data.msg,
            color: data.color || '#000000',
            img: img.length > 0 ? img[0].img : '',
        };
        socket.broadcast.emit('receiveMsg', {
            ...msg,
            side: 'left',
        });
        socket.emit('receiveMsg', {
            ...msg,
            side: 'right',
        });
    });

    // 断开连接
    socket.on('disconnect', () => {
        const userIndex = onlineUser.indexOf(socket.nickname);

        if (userIndex > -1){
            // 删除用户信息
            onlineUser.splice(userIndex, 1);
            userInfo.splice(userIndex, 1);

            io.emit('system', {
                name: socket.nickname,
                msg: '离开了聊天室',
            });
            io.emit('displayUser', userInfo);
            console.log(`**** ${socket.nickname}断开了连接 ****`);
            socket.emit('disconnect');
        }
    });
});

http.listen(8888, () => {
    console.log('listening on localhost:8888');
});
