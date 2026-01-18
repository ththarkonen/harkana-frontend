import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('@/Landing.vue');
const Terms = () => import('@/Terms.vue');
const Pricing = () => import('@/Pricing.vue');

const routes = [
	{ path: '/', name: 'Home', component: Home},
	{ path: '/terms', name: 'Terms', component: Terms},
	{ path: '/pricing', name: 'Pricing', component: Pricing},
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
	scrollBehavior(to, from, savedPosition) {
		if( to.hash ){
			return {
				el: to.hash,
				behavior: "smooth",
			};
		} else if (savedPosition) {
			return savedPosition;
		} else {
			return { top: 0 };
		}
	},
});

export default router;