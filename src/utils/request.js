import Vue from 'vue'
import axios from 'axios'
import store from '@/store'
import Router from '@/router'
import { Toast } from 'vant'

Vue.use(Toast);

// 创建axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_URL, // api的base_url
  timeout: 30000 // 请求超时时间
})

// request拦截器
service.interceptors.request.use(config => {
  if (localStorage.getItem('wap-token')) {
    config.headers['Authorization'] = `Bearer ${localStorage.getItem('wap-token')}`
    config.headers.common['X-Requested-With'] = 'XMLHttpRequest'
  }
  if (Object.prototype.hasOwnProperty.call(config,'base_url')) {
    config.baseURL = config.base_url
  }
  return config
}, error => {
  // Do something with request error
  Promise.reject(error)
})

// respone拦截器
service.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (!error.response) {
      Toast.fail('网络异常');
    }
    if (error.response.status === 401) {
      let currentPath = Router.history.current.path
      if (currentPath !== '/' && error.response.config.url !== 'api/wap/me') {
        store.commit('logout', {
          backUrl: currentPath
        })
      }
    }
    if (error.response.status === 503) {
      Toast.fail('当前参与人数较多，请稍后重试。');
    }
    if (error.response.status === 429) {
      Toast.fail('操作太频繁，请稍后重试。');
    }
    if (error.response.status === 404) {
      Toast.fail('网络异常，请稍后重试。');
    }
    console.log(error)
    return Promise.reject(error)
  }
)

export default service
