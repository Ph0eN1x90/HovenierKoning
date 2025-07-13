import MainLayout from 'layouts/MainLayout.vue';
import HousenumberOverview from 'src/pages/HousenumberOverview.vue';
import AddressOverview from 'src/pages/AddressOverview.vue';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [{ path: '/', component: AddressOverview, props: true }],
  },
  {
    path: '/address',
    component: MainLayout,
    children: [{ path: '/address/:address', name: 'address-overview', component: HousenumberOverview, props: true }],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];


export default routes;
