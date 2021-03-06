// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import { Toast } from 'mint-ui';
import 'mint-ui/lib/style.css'
import Axios from 'axios'
import Qs from 'qs'

Vue.prototype.$qs = Qs
const BASE_URL = 'http://192.168.117.142'
Axios.defaults.baseURL = BASE_URL
Axios.defaults.withCredentials = true
Vue.prototype.$axios = Axios

import Vuex from 'vuex'
Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    is_login: false,
    online_users: [
    ],
    myself: {
      info: {
      },
    },
    chat_list: [
    ]
  },
  mutations: {
    add_online_user(state, user) {
      state.online_users.unshift(user)
    },
    add_chat_msg(state, chat_msg) {
      state.chat_list.push(chat_msg)
    },
    set_myself_info(state, myself_info) {
      state.myself.info = myself_info
    },
    set_is_login(state, is_login) {
      state.is_login = is_login
    }
  }
})

var ws = 'ws://192.168.117.142:8989'
var socket = new WebSocket(ws)
socket.onopen = function (event) {
  console.log('连接成功')
  // 获取缓存昵称
  var my_nickname = localStorage.getItem("my_nickname");
  var mt_rand = localStorage.getItem("mt_rand");
  if (my_nickname != null) {
    if (socket.readyState == 1) {
      var login_data = {
        action: "login",
        nickname: my_nickname,
        avatar_id: mt_rand
      };
      console.log("登录发送的数据：", login_data);
      socket.send(JSON.stringify(login_data));
    } else {
      alert("网络连接失败，请刷新");
      return false;
    }
  }
}
import Tools from './Tools'

socket.onmessage = function (event) {
  console.log('获取到信息')
  var getMsg = JSON.parse(event.data)
  console.log(getMsg)
  if (getMsg.action == 'login' && store.state.is_login == false) {
    // 登录的消息
    var online_users = getMsg.online_users;
    var user = {};
    online_users.forEach(user => {
      user = JSON.parse(user);
      store.commit("add_online_user", user);
    });
    store.commit("set_is_login", true);
    store.commit("set_myself_info", getMsg.myself);
  } else if (store.state.is_login == true) {
    if (getMsg.action == 'logout_other') {
      // 其他人下线 查找索引 刪除
      var index = store.state.online_users.findIndex(user => {
        if (user.user_id == getMsg.user_id) {
          return true;
        }
      });
      Toast('网友:' + store.state.online_users[index].nickname + ' 下线');
      store.state.online_users.splice(index, 1);
    } else if (getMsg.action == 'user_online') {
      // 有人上线
      store.commit("add_online_user", getMsg.user_info);
      Toast('新网友:' + getMsg.user_info.nickname + ' 上线');
    } else if (getMsg.action = 'chat') {
      // 收到消息
      if (getMsg.message.message.indexOf('[img]:.') === 0) {
        getMsg.message.type = 'img'
        var img_url = BASE_URL + getMsg.message.message.substring(7)
        getMsg.message.message = img_url
      } else {
        getMsg.message.type = 'str'
        // 解析表情
        getMsg.message.message = Tools.convert(getMsg.message.message)
      }
      store.commit("add_chat_msg", getMsg.message);
    }
  }
  // todo 重连
}
socket.onclose = function (event) {
  console.log('socket.onclose 连接关闭,退出登录')
  store.commit("set_is_login", false);
}

socket.onerror = function (event, error) {
  console.log(error)
}
Vue.prototype.$socket = socket


import MuseUI from 'muse-ui'
import 'muse-ui/dist/muse-ui.css'
Vue.use(MuseUI)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  // router,
  store,
  components: { App },
  template: '<App/>'
})
