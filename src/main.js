import Vue from 'vue'
import App from './App.vue'
import store from './store'
import { graphQlClient } from './plugins/apollo'
import { createQuery } from './plugins/helpers'
import ElementUi from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import locale from 'element-ui/lib/locale/lang/en'

Vue.config.productionTip = false
Vue.use(ElementUi, { locale })
Vue.prototype.$createQuery = createQuery

new Vue({
  store,
  graphql: graphQlClient,
  render: h => h(App)
}).$mount('#app')
