$(function(){
    // io-client 连接成功后触发服务器端的connection事件
    const socket = io();

    // 登录
    const loginName = $('.login > input[type=text]');
    const loginBtn = $('.login > button');
    const login = () => {
        const avatarRandom = Math.ceil(Math.random() * 3); // 随机分配头像
        if (loginName.val().trim() === '') return false;
        // 触发登录事件
        socket.emit('login', {
            name: loginName.val(),
            img: `img/user${avatarRandom}.jpg`,
        });
    };
    loginName.keyup(e => {
        if (e.which === 13) login();
    });
    loginBtn.click(login);
    socket.on('loginSuccess', () => {
        $('.login').fadeOut();
    });
    socket.on('loginFailure', () => {
        alert('用户名已存在，请重新输入');
        loginName.val('');
    });

    // 显示在线用户
    const displayUser = onlineUser => {
        const onlineUserElem = $('.online-user');
        const onlineNoneElem = $('.online-none');
        let html = '';

        onlineUserElem.text('');
        onlineUser.length === 0 ? onlineNoneElem.fadeIn() : onlineNoneElem.fadeOut();
        $('.online-num > span').text(onlineUser.length);
        onlineUser.forEach(user => {
            html += `<li>
                <img src="${user.img}" alt="" />
                <span>${user.name}</span>
            </li>`;
        });
        onlineUserElem.append(html);
    };
    socket.on('displayUser', userInfo => displayUser(userInfo));

    // 系统提示消息事件
    socket.on('system', data => renderMessage('system', data));

    // 发送消息
    const textareaElem = $('.massage-send textarea');
    const sendMsg = () => {
        if (textareaElem.val() === ''){
            alert('请输入内容');
            return false;
        }
        socket.emit('sendMsg', {
            msg: textareaElem.val(),
            color: $('#color').val(),
        });
        textareaElem.val('');
    };
    $('#send').click(sendMsg);
    textareaElem.keyup(e => {
        if (e.which === 13) sendMsg();
    });
    // 接收消息
    socket.on('receiveMsg', data => renderMessage('message', data));

    // 发送表情
    $('.icon-emoji').click(() => {
        $('.emoji-box').fadeToggle();
    });
    textareaElem.focus(() => {
        $('.emoji-box').fadeOut();
    });
    $('body').on('click', '.emoji-box li', e => {
        textareaElem.val(`[emoji ${(e || window.event).currentTarget.id}]`);
        $('.emoji-box').fadeOut();
    });

    // 发送窗口抖动
    $('.icon-shake').click(() => {
        socket.emit('shake');
    });
    // 监听抖动事件
    socket.on('shake', data => {
        $('.main').addClass('shaking');
        setTimeout(() => {
            $('.main').removeClass('shaking');
        }, 500);
        renderMessage('system', {...data, msg: '发送了一个窗口抖动'});
    });

    // 发送图片
    $('#img').change(e => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(e.target.files[0]);
        fileReader.onerror = () => {
            console.log('读取文件失败，请重试！');
        };
        fileReader.onload = () => {
            socket.emit('sendMsg', {
                msg: `<img class="send-img" src="${fileReader.result}" alt="" />`,
            });
        };
    });

    // 退出连接
    $('#logout').click(() => socket.disconnect());
    socket.on('disconnect', () => location.reload());

    // 渲染emoji表情
    const renderEmoji = () => {
        let html = '';
        for (let i = 1; i <= 141; i++){
            html += `<li id="${i}">
                <img class="emoji-img" src="img/emoji/emoji (${i}).png" alt="" />
            </li>`;
        }
        $('.emoji-box .box-content').append(html);
    };
    renderEmoji();

    // 渲染消息列表内容
    const renderMessage = (type, data) => {
        const messageListElem = $('.massage-list');
        let html = '';

        switch (type){
            // 系统消息
            case 'system':
                html += `
                    <li class="system">
                        <span>${new Date().toTimeString().substr(0, 8)}</span><br />
                        <span>${data.name}${data.msg}</span>
                    </li>
                `;
                break;
            // 用户消息
            case 'message':
                // 消息中表情渲染
                const msg = data.msg.replace(/\[emoji (\d*)\]/g, '<img class="emoji-img" src="img/emoji/emoji ($1).png" alt="" />');
                html += `
                    <li class="${data.side}">
                        <img src="${data.img}" alt="" />
                        <div>
                            <p>${data.name}</p>
                            <p style="color: ${data.color};">${msg}</p>
                        </div>
                    </li>
                `;
                break;
        }
        messageListElem.append(html);
        messageListElem.scrollTop(messageListElem[0].scrollHeight); // 滚动条置底
    };
});
