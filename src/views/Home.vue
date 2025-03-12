<template>
    <div class="home">
        <img alt="Vue logo" src="../assets/logo.png">
        <h1>首页</h1>
        <p>这是网站的首页</p>
        <router-link to="/about">前往关于页面</router-link>
    </div>
</template>

<script>
export default {
    name: 'MyHome'
}
</script>

<style scoped>
.home {
    text-align: center;
    margin-top: 20px;
}
</style> 