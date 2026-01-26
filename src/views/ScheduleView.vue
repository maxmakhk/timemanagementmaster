<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NPCQuests } from '../data/quests'

const router = useRouter()
const { t } = useI18n()

// 示例：已選擇的 NPC（實際應從 store 傳入）
// 第一局只有 Alice（難度 Easy）
const selectedNPCs = ref([
  NPCQuests[0], // Alice - 第一個 NPC
  // NPCQuests[1]  // Bob - 示例第二個（移除：第一局不可用）
])

// 當前正在編輯的 NPC
const currentNPCId = ref(selectedNPCs.value[0].id)

// 時間段定義
const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
const days = Array.from({ length: 5 }, (_, i) => `Day ${i + 1}`) // 改為 5 天

// 可用行程卡
const availableCards = [
  { id: 1, name: t('schedule.codingClass'), effect: { coding: 5 }, color: '#3498db' },
  { id: 2, name: t('schedule.mathStudy'), effect: { math: 5 }, color: '#e74c3c' },
  { id: 3, name: t('schedule.fitnessTraining'), effect: { fitness: 5 }, color: '#2ecc71' },
  { id: 4, name: t('schedule.rest'), effect: { mood: 10 }, color: '#f39c12' },
  { id: 5, name: t('schedule.lunch'), effect: { energy: 5 }, color: '#95a5a6' },
]

// 為每個 NPC 維護獨立的時間表和當前能力值
const npcSchedules = reactive({})
const npcCurrentAbilities = reactive({})

// 初始化每個 NPC 的時間表和當前能力值
selectedNPCs.value.forEach(npc => {
  npcSchedules[npc.id] = Array.from({ length: 5 }, () => Array(6).fill(null))
  // 初始化當前能力值為 initial 的值
  npcCurrentAbilities[npc.id] = {
    coding: npc.initial.coding,
    math: npc.initial.math,
    fitness: npc.initial.fitness
  }
})

// 計算當前 NPC 的時間表
const currentSchedule = computed(() => {
  return npcSchedules[currentNPCId.value] || Array.from({ length: 5 }, () => Array(6).fill(null))
})

// 當前正在編輯的 NPC 對象
const currentNPC = computed(() => {
  return selectedNPCs.value.find(npc => npc.id === currentNPCId.value)
})

// 被拖動的卡片
const draggedCard = ref(null)

// 拖動開始
const startDrag = (card) => {
  draggedCard.value = card
}

// 選擇 NPC（切換時間表）
const selectNPC = (npc) => {
  currentNPCId.value = npc.id
}

// 拖放到時間表格子
const dropOnSlot = (dayIndex, slotIndex) => {
  if (draggedCard.value) {
    // 複製卡片到時間表
    const cardCopy = { ...draggedCard.value, instanceId: Date.now() }
    currentSchedule.value[dayIndex][slotIndex] = cardCopy
    draggedCard.value = null
  }
}

// 移除時間表中的卡片
const removeCard = (dayIndex, slotIndex) => {
  currentSchedule.value[dayIndex][slotIndex] = null
}

// 允許 drop
const allowDrop = (e) => {
  e.preventDefault()
}

// 開始模擬
const startSimulation = () => {
  // 驗證至少有一個 NPC 被選擇
  if (selectedNPCs.value.length === 0) {
    alert('請先選擇至少一個 NPC')
    return
  }

  // 將數據保存到 sessionStorage 以便 DaySimulationView 使用
  const simulationData = {
    selectedNPCs: selectedNPCs.value.map(npc => ({
      id: npc.id,
      name: npc.name,
      image: npc.image,
      goals: npc.goals,
      initial: npc.initial,
    })),
    npcSchedules: npcSchedules,
    npcCurrentAbilities: npcCurrentAbilities,
  }
  
  sessionStorage.setItem('simulationData', JSON.stringify(simulationData))
  router.push('/day')
}

// 返回
const goBack = () => {
  router.push('/intake')
}
</script>

<template>
  <div class="schedule-view">
    <header class="schedule-header">
      <h1>{{ $t('schedule.title') }}</h1>
      <p>{{ $t('schedule.subtitle') }}</p>
    </header>

    <div class="schedule-container">
      <!-- 左側面板：NPC 任務卡 + 可用行程 -->
      <div class="left-panels">
        <!-- NPC 任務卡顯示 -->
        <div class="npc-panel">
          <h2>📋 {{ $t('schedule.npcMissions') }}</h2>
          <div class="npc-cards-list">
            <div
              v-for="npc in selectedNPCs"
              :key="npc.id"
              class="npc-mission-card"
              :class="{ active: currentNPCId === npc.id }"
              @click="selectNPC(npc)"
            >
              <div class="npc-header">
                <span class="npc-image">{{ npc.image }}</span>
                <div class="npc-title">
                  <h3>{{ npc.name }}</h3>
                  <span class="difficulty" :class="'difficulty-' + npc.difficulty.toLowerCase()">
                    {{ npc.difficulty }}
                  </span>
                </div>
              </div>
              <p class="npc-description">{{ npc.description }}</p>
              <div class="npc-goals">
                <div class="goal-row">
                  <span class="goal-name">{{ $t('schedule.coding') }}</span>
                  <div class="goal-progress">
                    <span class="current-bar">
                      <span class="current-fill" :style="{ width: (npcCurrentAbilities[npc.id].coding / npc.goals.coding * 100) + '%' }"></span>
                    </span>
                    <span class="goal-values">{{ npcCurrentAbilities[npc.id].coding }} / {{ npc.goals.coding }}</span>
                  </div>
                </div>
                <div class="goal-row">
                  <span class="goal-name">{{ $t('schedule.math') }}</span>
                  <div class="goal-progress">
                    <span class="current-bar">
                      <span class="current-fill" :style="{ width: (npcCurrentAbilities[npc.id].math / npc.goals.math * 100) + '%' }"></span>
                    </span>
                    <span class="goal-values">{{ npcCurrentAbilities[npc.id].math }} / {{ npc.goals.math }}</span>
                  </div>
                </div>
                <div class="goal-row">
                  <span class="goal-name">{{ $t('schedule.fitness') }}</span>
                  <div class="goal-progress">
                    <span class="current-bar">
                      <span class="current-fill" :style="{ width: (npcCurrentAbilities[npc.id].fitness / npc.goals.fitness * 100) + '%' }"></span>
                    </span>
                    <span class="goal-values">{{ npcCurrentAbilities[npc.id].fitness }} / {{ npc.goals.fitness }}</span>
                  </div>
                </div>
              </div>
              <div class="npc-reward">
                💰 +{{ npc.rewards.masterReputation }} {{ $t('schedule.reputation') }}
              </div>
            </div>
          </div>
        </div>

        <!-- 可用行程卡 -->
        <div class="cards-panel">
          <h2>{{ $t('schedule.availableActivities') }}</h2>
          <div class="cards-list">
            <div
              v-for="card in availableCards"
              :key="card.id"
              class="card"
              :style="{ backgroundColor: card.color }"
              draggable="true"
              @dragstart="startDrag(card)"
            >
              <div class="card-name">{{ card.name }}</div>
              <div class="card-effect">
                <span v-for="(value, key) in card.effect" :key="key">
                  {{ key }}: +{{ value }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側：時間表 -->
      <div class="timetable-panel">
        <div class="timetable-header-info">
          <h2>{{ $t('schedule.fiveDaySchedule') }} - {{ currentNPC?.name }}</h2>
          <p class="timetable-subtitle">{{ currentNPC?.description }}</p>
        </div>
        <div class="timetable">
          <!-- 表頭 -->
          <div class="timetable-header">
            <div class="time-col"></div>
            <div v-for="day in days" :key="day" class="day-col">
              {{ day }}
            </div>
          </div>

          <!-- 時間行 -->
          <div v-for="(slot, slotIndex) in timeSlots" :key="slotIndex" class="timetable-row">
            <div class="time-label">{{ slot }}</div>
            <div
              v-for="(day, dayIndex) in days"
              :key="`${dayIndex}-${slotIndex}`"
              class="schedule-cell"
              @drop="dropOnSlot(dayIndex, slotIndex)"
              @dragover="allowDrop"
            >
              <div
                v-if="currentSchedule[dayIndex][slotIndex]"
                class="scheduled-card"
                :style="{ backgroundColor: currentSchedule[dayIndex][slotIndex].color }"
                @click="removeCard(dayIndex, slotIndex)"
                title="點擊移除"
              >
                {{ currentSchedule[dayIndex][slotIndex].name }}
              </div>
              <div v-else class="empty-slot">＋</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作按鈕 -->
    <div class="action-buttons">
      <button @click="goBack" class="btn btn-secondary">
        {{ $t('schedule.goBack') }}
      </button>
      <button @click="startSimulation" class="btn btn-primary">
        {{ $t('schedule.startSimulation') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.schedule-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.schedule-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.schedule-header h1 {
  margin: 0 0 0.5rem 0;
}

.schedule-header p {
  margin: 0;
  opacity: 0.9;
}

.schedule-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1rem;
  padding: 1rem;
}

.left-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  flex: 0 0 auto;
  height: 100%;
  overflow: hidden;
}

/* 左側：NPC 面板 */
.npc-panel {
  background: white;
  border-radius: 0.8rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.npc-panel h2 {
  margin: 0 0 0.8rem 0;
  font-size: 0.95rem;
  color: #667eea;
}

.npc-cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  flex: 1;
  overflow-y: auto;
}

.npc-mission-card {
  border: 2px solid #e8e8f0;
  border-radius: 0.6rem;
  padding: 0.8rem;
  background: #f9f9ff;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 0;
}

.npc-mission-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.npc-mission-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #e8e8ff 0%, #f0f0ff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.npc-header {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
  align-items: flex-start;
}

.npc-image {
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 35px;
  min-height: 35px;
}

.npc-title h3 {
  margin: 0 0 0.2rem 0;
  font-size: 0.9rem;
}

.difficulty {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  border-radius: 0.2rem;
  font-size: 0.65rem;
  font-weight: 600;
}

.difficulty-easy {
  background: #d4edda;
  color: #155724;
}

.difficulty-normal {
  background: #fff3cd;
  color: #856404;
}

.difficulty-hard {
  background: #f8d7da;
  color: #721c24;
}

.npc-description {
  font-size: 0.75rem;
  color: #666;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.npc-goals {
  margin-bottom: 0.6rem;
  padding: 0.6rem;
  background: white;
  border-radius: 0.4rem;
  display: none;
}

.npc-mission-card.active .npc-goals {
  display: block;
}

.goal-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.4rem;
  font-size: 0.75rem;
}

.goal-row:last-child {
  margin-bottom: 0;
}

.goal-name {
  min-width: 40px;
  font-weight: 600;
  color: #333;
  font-size: 0.7rem;
}

.goal-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.current-bar {
  flex: 1;
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
}

.current-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.goal-values {
  min-width: 45px;
  text-align: right;
  font-weight: 600;
  color: #667eea;
  font-size: 0.7rem;
  white-space: nowrap;
}

.npc-reward {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.4rem;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border-radius: 0.3rem;
  display: none;
}

.npc-mission-card.active .npc-reward {
  display: block;
}

/* 左側：行程卡面板 */
.cards-panel {
  background: white;
  border-radius: 0.8rem;
  padding: 1rem;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.cards-panel h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  flex: 1;
}

.card {
  padding: 1rem;
  border-radius: 0.5rem;
  color: white;
  cursor: move;
  user-select: none;
  transition: transform 0.2s;
}

.card:hover {
  transform: scale(1.05);
}

.card-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.card-effect {
  font-size: 0.85rem;
  opacity: 0.9;
}

.card-effect span {
  display: block;
}

/* 右側：時間表面板 */
.timetable-panel {
  flex: 1;
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.timetable-header-info {
  margin-bottom: 1rem;
}

.timetable-header-info h2 {
  margin: 0 0 0.3rem 0;
  font-size: 1.2rem;
  color: #667eea;
}

.timetable-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.timetable-panel h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.timetable {
  display: grid;
  gap: 1px;
  background: #ddd;
  padding: 1px;
  border-radius: 0.3rem;
}

.timetable-header {
  display: grid;
  grid-template-columns: 80px repeat(10, 1fr);
  gap: 1px;
  background: #667eea;
  padding: 1px;
  border-radius: 0.3rem;
  margin-bottom: 1px;
}

.time-col {
  background: #667eea;
  color: white;
  font-weight: 600;
}

.day-col {
  background: #667eea;
  color: white;
  font-weight: 600;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.timetable-row {
  display: grid;
  grid-template-columns: 80px repeat(10, 1fr);
  gap: 1px;
}

.time-label {
  background: #f0f0f0;
  padding: 0.5rem;
  font-weight: 600;
  text-align: center;
  font-size: 0.9rem;
}

.schedule-cell {
  background: white;
  border: 2px dashed #ddd;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.schedule-cell:hover {
  background: #f9f9f9;
  border-color: #667eea;
}

.empty-slot {
  color: #ccc;
  font-size: 1.5rem;
}

.scheduled-card {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  padding: 0.3rem;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.scheduled-card:hover {
  opacity: 0.8;
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
