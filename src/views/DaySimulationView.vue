<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const currentDay = ref(1)
const totalDays = 10

// 示例行程和日誌
const todaySchedule = [
  { time: '08:00', activity: 'Coding Class', effect: { coding: 5 } },
  { time: '10:00', activity: 'Math Study', effect: { math: 5 } },
  { time: '12:00', activity: 'Lunch', effect: { energy: 5 } },
  { time: '14:00', activity: 'Fitness', effect: { fitness: 5 } },
]

// 示例日誌
const logs = ref([
  'Day 1 開始',
  '08:00 - Alice 參加 Coding Class，獲得 +5 Coding 經驗',
  '10:00 - Alice 進行 Math Study，獲得 +5 Math 經驗',
  '12:00 - Alice 吃午餐，精力恢復 +5',
  '14:00 - Alice 進行 Fitness 訓練，獲得 +5 Fitness 經驗',
  '心情值：95/100',
  '能量值：80/100',
])

// 下一天
const nextDay = () => {
  if (currentDay.value < totalDays) {
    currentDay.value++
    // TODO: 更新行程和日誌
  } else {
    // 完成所有 10 天，進入報告頁面
    router.push('/report')
  }
}

// 結束模擬
const endSimulation = () => {
  router.push('/report')
}

// 返回
const goBack = () => {
  router.push('/schedule')
}
</script>

<template>
  <div class="day-simulation-view">
    <header class="simulation-header">
      <h1>{{ $t('day.title') }} - {{ $t('day.day') }} {{ currentDay }} {{ $t('day.of') }} {{ totalDays }} {{ $t('day.of').split('/')[1] ? '' : '' }}</h1>
      <div class="progress-bar">
        <div class="progress" :style="{ width: (currentDay / totalDays) * 100 + '%' }"></div>
      </div>
    </header>

    <div class="simulation-container">
      <!-- 上半部分：今日行程 -->
      <div class="schedule-section">
        <h2>{{ $t('day.todaySchedule') }}</h2>
        <div class="schedule-table">
          <div v-for="(item, index) in todaySchedule" :key="index" class="schedule-row">
            <div class="time">{{ item.time }}</div>
            <div class="activity">{{ item.activity }}</div>
            <div class="effect">
              <span v-for="(value, key) in item.effect" :key="key">
                {{ key }}: +{{ value }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 下半部分：日誌 -->
      <div class="log-section">
        <h2>{{ $t('day.eventLog') }}</h2>
        <div class="log-container">
          <div v-for="(log, index) in logs" :key="index" class="log-entry">
            {{ log }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按鈕 -->
    <div class="action-buttons">
      <button @click="goBack" class="btn btn-secondary">
        {{ $t('day.goBack') }}
      </button>
      <button @click="nextDay" class="btn btn-primary">
        {{ currentDay === totalDays ? $t('day.viewReport') : $t('day.nextDay') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.day-simulation-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.simulation-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.simulation-header h1 {
  margin: 0 0 1rem 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: white;
  transition: width 0.3s ease;
}

.simulation-container {
  display: flex;
  flex: 1;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

/* 行程部分 */
.schedule-section {
  flex: 1;
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.schedule-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.schedule-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.schedule-row {
  display: grid;
  grid-template-columns: 80px 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 0.5rem;
  border-left: 4px solid #667eea;
}

.time {
  font-weight: 600;
  color: #667eea;
}

.activity {
  font-weight: 500;
}

.effect {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.effect span {
  background: #e8f4f8;
  padding: 0.2rem 0.5rem;
  border-radius: 0.3rem;
}

/* 日誌部分 */
.log-section {
  flex: 1;
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.log-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.log-container {
  flex: 1;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-y: auto;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
}

.log-entry {
  padding: 0.5rem 0;
  line-height: 1.5;
  color: #333;
  border-bottom: 1px solid #eee;
}

.log-entry:last-child {
  border-bottom: none;
}

/* 底部按鈕 */
.action-buttons {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid #ddd;
  justify-content: center;
}

.btn {
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}
</style>
