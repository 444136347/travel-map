// src/store/index.js

import Vue from 'vue';
import Vuex from 'vuex';
import state from './state';
import mutations from './mutations';
import getters from './getters'

Vue.use(Vuex);

export default new Vuex.Store({
  state,  // 在这里定义你的状态
  getters, // 定义
  mutations, // 在这里定义修改状态的方法
  actions: {
    // 在这里定义触发 mutations 的动作
  }
});
