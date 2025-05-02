import { createRouter, createWebHistory } from 'vue-router';
import Login from './components/login.vue';
import Register from './components/register.vue';
import Personal from './components/personal.vue';
import Groupview from './components/groupview.vue';
import View from './components/view.vue';
import Group from './components/group.vue';
import Profile from './components/profile.vue';
import About from './components/about.vue';
import GC from './components/GC.vue';

//PUBLIC PAGE
const routes = [
  { path: '/', redirect: '/login' },
  { 
    path: '/login', 
    name: 'Login', 
    component: Login,
    meta: { requiresAuth: false } 
  },
  { 
    path: '/register', 
    name: 'Register', 
    component: Register,
    meta: { requiresAuth: false }
  },
  { 
    path: '/about',
    name: 'About',
    component: About,
    meta: { requiresAuth: false }
  },

  // PROTECTED ROUTES
  { path: '/personal', name: 'Personal', component: Personal, meta: { requiresAuth: true } },
  { path: '/groupview', name: 'Groupview', component: Groupview, meta: { requiresAuth: true } },
  { path: '/view', name: 'View', component: View, meta: { requiresAuth: true } },
  { path: '/about', name: 'About', component: About, meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },

 //GROUP EXPENSES
 { path: '/GC', name: 'GC', component: GC, meta: { requiresAuth: true }},
{ path: '/group/:groupId', name: 'Group', component: Group, meta: { requiresAuth: true }, props: true },
{ path: '/', redirect: to => {const token = localStorage.getItem('jsontoken');return token ? { name: 'GC' } : { name: 'Login' }}}
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('jsontoken');
  
  if (to.meta.requiresAuth && !token) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    });
    return; 
  }

  
  if (from.name === 'GC' && to.name === 'Group') {
    next();
    return;
  }
  next();
});

export default router;
