import Vue from 'vue'
import App from './App.vue'
import router from './router';
import store from './store';
import Global from './plugins/global'
import 'vant/lib/index.less'
import { NavBar } from 'vant'

Vue.config.productionTip = false

Vue.use(NavBar)
Vue.use(Global)

new Vue({
  router,
  store,
  render: h => h(App),
  created: function () {
    this.initGlobal()
  },
  methods:{
    initGlobal: function () {
      this.$global.init({
        vm: this
      })
    }
  }
}).$mount('#app')
