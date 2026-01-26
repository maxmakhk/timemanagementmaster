import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StudentIntakeView from '../views/StudentIntakeView.vue'
import ScheduleView from '../views/ScheduleView.vue'
import DaySimulationView from '../views/DaySimulationView.vue'
import ReportView from '../views/ReportView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/intake', name: 'intake', component: StudentIntakeView },
  { path: '/schedule', name: 'schedule', component: ScheduleView },
  { path: '/day', name: 'day', component: DaySimulationView },
  { path: '/report', name: 'report', component: ReportView },
  { path: '/settings', name: 'settings', component: SettingsView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
