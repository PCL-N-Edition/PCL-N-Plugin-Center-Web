import { createRouter, createWebHistory } from 'vue-router';
import CloudShell from '@/views/cloud/CloudShell.vue';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: CloudShell, children: [
      { path: '', component: () => import('@/views/cloud/Home.vue') },
      { path: 'store', component: () => import('@/views/cloud/Store.vue') },
      { path: 'store/:id', component: () => import('@/views/cloud/Store.vue') },
      { path: 'download', component: () => import('@/views/site/download.vue') },
      { path: 'account', component: () => import('@/views/cloud/Account.vue') },
      { path: 'developer', component: () => import('@/views/cloud/Placeholder.vue'), props: { title: '开发者', eyebrow: 'DEVELOPER', description: '开发者工作空间正在准备中。发布、组织与资源管理将在完成账户接入后开放。' } },
      { path: 'website-management', component: () => import('@/views/cloud/Placeholder.vue'), props: { title: '网站管理申请', eyebrow: 'WEBSITE MANAGEMENT', description: '网站管理申请入口正在准备中。请先完成账户登录，后续申请流程将在此开放。' } },
      { path: 'docs', component: () => import('@/views/cloud/Placeholder.vue'), props: { title: '文档', eyebrow: 'DOCUMENTATION', description: '' } },
      { path: 'console', redirect: '/account' },
      { path: 'operations', redirect: '/account' },
      { path: 'operations/telemetry', redirect: '/account' },
      { path: 'about', redirect: '/' }
    ] },
    { path: '/launcher', redirect: '/' },
    { path: '/download/thanks', component: () => import('@/views/site/download-thanks.vue') },
    { path: '/download/legacy', redirect: '/download?product=legacy' },
    { path: '/changelog', component: () => import('@/views/site/changelog.vue') },
    { path: '/market', redirect: '/store' },
    { path: '/market/plugins/:id', redirect: to => `/store/${encodeURIComponent(String(to.params.id))}` },
    { path: '/admin/telemetry', redirect: '/account' },
    { path: '/home', redirect: '/' },
    { path: '/login', redirect: '/account' },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/cloud/NotFound.vue') }
  ]
});
router.afterEach(to => { document.title = `${to.path === '/' ? 'NexaCreftLauncher' : to.path.startsWith('/account') ? '账户' : to.path.startsWith('/docs') ? '文档' : 'Nexa Cloud'} · Nexa Cloud`; });
export default router;
