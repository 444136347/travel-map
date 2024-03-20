import router from '../router'

export default {
  install: function (Vue) {
    Vue.prototype.$global = {
      vm: null,
      init: function (payload) {
        this.vm = payload.vm
      },
      redirectTo: function (payload) {
        if (payload.url.indexOf('http') >= 0) {
          window.location.href = payload.url
        } else {
          router.push(payload.url)
        }
      },
      // localStorage数据存储设置有效期
      // key:key值
      // value:需要存储的数据
      // expires:过期时间，毫秒单位
      localStorageSetItem: function (key, value, expires) {
        let obj = {
          value: value,
          expires: expires, // 有效时间
          startTime: new Date().getTime()// 记录存储数据的时间，转换为毫秒值存下来
        }
        // 判断是否设置了有效时间
        if (Object.prototype.hasOwnProperty.call(obj,'expires') && obj.expires) {
          // 如果设置了时间，把obj转换数据类型转换为字符串对象存起来
          localStorage.setItem(key, JSON.stringify(obj))
        } else {
          // 如果没有设置有效时间，直接把value值存进去
          localStorage.setItem(key, JSON.stringify(obj.value))
        }
      },
      // localStorage数据获取存储数据
      // key:key值
      // value:需要存储的数据
      // expires:过期时间，毫秒单位
      localStorageGetItem: function (key) {
        // 先定义一个变量临时存放提取的值
        let temp = JSON.parse(localStorage.getItem(key))
        // 判断有没有设置expires属性
        // 如果有，就需要判断是否到期了
        if (temp && Object.prototype.hasOwnProperty.call(temp, 'expires') && temp.expires) {
          let data = new Date().getTime()
          if (data - temp.startTime > temp.expires) {
            // 此时说明数据已过期,清除掉
            localStorage.getItem(key)
            return null
          } else {
            // 如果没有过期就输出
            return temp.value
          }
        } else {
          // 如果没有设置，直接输出
          return temp
        }
      }
    }
  }
}
