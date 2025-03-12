<template>
    <div id="app">
        <div class="nav">
            <router-link to="/">首页</router-link>
            |
            <router-link to="/about">关于</router-link>
            |
            <router-link to="/remark">备注</router-link>
        </div>
        <router-view/>
    </div>
</template>

<script>
export default {
    name: 'App'
}
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
}

.nav {
    padding: 30px;
    text-align: center;
    border-bottom: 1px solid #e8e8e8;
    background-color: #f5f5f5;
    margin-bottom: 20px;
}

.nav a {
    font-weight: bold;
    color: #2c3e50;
    text-decoration: none;
    margin: 0 10px;
}

.nav a.router-link-exact-active {
    color: #42b983;
}
</style>
