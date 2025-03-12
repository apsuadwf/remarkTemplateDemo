import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/about',
        name: 'About',
        // 路由懒加载
        component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
    },
    {
        path: '/remark',
        name: 'Remark',
        component: () => import('../views/Remark.vue')
    }
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

export default router 