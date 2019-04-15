<template>
  <div id="app">
    <Navbar />
    <button @click="isVisible = !isVisible" type="button">toggle</button>
    <HelloWorld msg="Welcome to Your Vue.js App" v-if="isVisible"/>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import Navbar from './components/Navbar.vue'

export default {
  name: 'app',
  components: {
    HelloWorld,
    Navbar
  },
  data: () => ({
    isVisible: true
  })
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
