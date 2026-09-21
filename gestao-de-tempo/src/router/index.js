import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { titulo: 'Início' },
    },
    {
      path: '/gestao-de-tempo',
      name: 'gestao-de-tempo',
      component: () => import('@/views/GestaoTempoView.vue'),
      meta: { titulo: 'Gestão de Tempo' },
    },
    {
      path: '/tarefas',
      name: 'tarefas',
      component: () => import('@/views/TarefasView.vue'),
      meta: { titulo: 'Feed de Tarefas & Quests' },
    },
    {
      path: '/missoes',
      name: 'missoes',
      component: () => import('@/views/MissoesView.vue'),
      meta: { titulo: '🎯 Missões & Fases' },
    },
  ],
})

export default router
