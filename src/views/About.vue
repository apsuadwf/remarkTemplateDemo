<template>
  <div class="about">
    <h1>关于我们</h1>
    <p>这是关于我们的页面</p>
    <router-link to="/">返回首页</router-link>
  </div>
</template>

<script>
export default {
  name: 'MyAbout'
}
</script>

<style scoped>
.about {
  text-align: center;
  margin-top: 20px;
}
</style>