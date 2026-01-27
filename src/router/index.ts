import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/time-management/intake',
      name: 'time-management-intake',
      component: () => import('../views/time-management/StudentIntakeView.vue')
    },
    {
      path: '/time-management/schedule',
      name: 'time-management-schedule',
      component: () => import('../views/time-management/ScheduleView.vue')
    },
    {
      path: '/time-management/simulation',
      name: 'time-management-simulation',
      component: () => import('../views/time-management/DaySimulationView.vue')
    },
    {
      path: '/time-management/exam',
      name: 'time-management-exam',
      component: () => import('../views/time-management/ExamResultView.vue')
    },
    {
      path: '/time-management/report',
      name: 'time-management-report',
      component: () => import('../views/time-management/ReportView.vue')
    },
    // Legacy redirects for backward compatibility
    {
      path: '/intake',
      redirect: '/time-management/intake'
    },
    {
      path: '/schedule',
      redirect: '/time-management/schedule'
    },
    {
      path: '/simulation',
      redirect: '/time-management/simulation'
    },
    {
      path: '/exam',
      redirect: '/time-management/exam'
    },
    {
      path: '/report',
      redirect: '/time-management/report'
    }
  ]
})

export default router
