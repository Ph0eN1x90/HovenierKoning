import MainLayout from 'layouts/MainLayout.vue';
import HuisnummerOverzicht from 'src/pages/HuisnummerOverzicht.vue';
import AdressenOverzicht from 'src/pages/AdressenOverzicht.vue';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [{ path: '/', component: AdressenOverzicht, props: true }],
  },
  {
    path: '/adres',
    component: MainLayout,
    children: [{ path: '/adres/:adres', name: 'adres-overzicht', component: HuisnummerOverzicht, props: true }],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];


export default routes;
