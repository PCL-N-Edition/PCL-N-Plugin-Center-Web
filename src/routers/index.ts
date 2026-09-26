import { createRouter, createWebHistory } from 'vue-router';
import CloudShell from '@/views/cloud/CloudShell.vue';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: CloudShell, children: [
      { path: '', redirect: '/store' },
      { path: 'store', component: () => import('@/views/cloud/Store.vue') },
      { path: 'store/:id', component: () => import('@/views/cloud/Store.vue') },
      { path: 'console', component: () => import('@/views/cloud/Workspace.vue') },
      { path: 'operations', component: () => import('@/views/cloud/Workspace.vue') },
      { path: 'operations/telemetry', component: () => import('@/views/cloud/Workspace.vue') },
      { path: 'about', component: () => import('@/views/cloud/About.vue') }
    ] },
    { path: '/launcher', component: () => import('@/views/site/index.vue') },
    { path: '/download', component: () => import('@/views/site/download.vue') },
    { path: '/download/thanks', component: () => import('@/views/site/download-thanks.vue') },
    { path: '/download/legacy', redirect: '/download?product=legacy' },
    { path: '/changelog', component: () => import('@/views/site/changelog.vue') },
    { path: '/market', redirect: '/store' },
    { path: '/market/plugins/:id', redirect: to => `/store/${encodeURIComponent(String(to.params.id))}` },
    { path: '/admin/telemetry', redirect: '/operations/telemetry' },
    { path: '/home', redirect: '/console' },
    { path: '/account', redirect: '/console' },
    { path: '/login', redirect: '/console' },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/cloud/NotFound.vue') }
  ]
});
router.afterEach(to => { document.title = `${to.path.startsWith('/operations') ? 'Operations' : to.path.startsWith('/console') ? 'Console' : 'NexaStore'} · Nexa Cloud`; });
export default router;
