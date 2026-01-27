<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NPCQuests } from '../../data/quests'

const router = useRouter()
const { t } = useI18n()

// 示例：已選擇的 NPC（實際應從 store 傳入）
// 第一局只有 Alice（難度 Easy）
const selectedNPCs = ref([
  NPCQuests[0], // Alice - 第一個 NPC - 默認值
  // NPCQuests[1]  // Bob - 示例第二個（移除：第一局不可用）
])

// 當前正在編輯的 NPC
const currentNPCId = ref(selectedNPCs.value[0].id)

// 當前進行到第幾天（0-indexed，用於區分已過的天數）
const currentDay = ref(0)

// 儲存延伸後的天數（當考試失敗時）
const extendedDays = reactive({})

// 計算所有 NPC 中最多需要的天數（作為時間表的最大天數）
const maxRequiredDays = computed(() => {
  let max = Math.max(...selectedNPCs.value.map(npc => {
    // Check if this NPC has extended days due to failed exam
    return extendedDays[npc.id] || npc.requiredDays || 5
  }))
  return max
})

// 動態生成天數陣列，包括考試日（針對當前 NPC）
const days = computed(() => {
  if (!currentNPC.value) return []
  
  const extended = extendedDays[currentNPC.value.id]
  const required = extended || currentNPC.value.requiredDays || 5
  const totalDays = required + 1 // +1 for exam day
  
  return Array.from({ length: totalDays }, (_, i) => {
    const dayNum = i + 1
    const isExamDay = dayNum === required + 1
    return isExamDay ? `📝 Exam Day ${dayNum}` : `Day ${dayNum}`
  })
})

// 時間段定義
const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']

// 可用行程卡 - 包含學習效果和資源消耗
const availableCards = [
  { id: 1, name: t('schedule.codingClass'), effect: { coding: 5 }, cost: { energy: 30, mood: 50 }, color: '#3498db' },
  { id: 2, name: t('schedule.mathStudy'), effect: { math: 5 }, cost: { energy: 30, mood: 50 }, color: '#e74c3c' },
  { id: 3, name: t('schedule.fitnessTraining'), effect: { fitness: 5 }, cost: { energy: 30, mood: 50 }, color: '#2ecc71' },
  { id: 4, name: t('schedule.rest'), effect: { energy: 100, mood: 100 }, isRest: true, color: '#f39c12' },
  { id: 5, name: t('schedule.lunch'), effect: { energy: 50 }, color: '#95a5a6' },
]

// 為每個 NPC 維護獨立的時間表和當前能力值
const npcSchedules = reactive({})
const npcCurrentAbilities = reactive({})

// 初始化每個 NPC 的時間表和當前能力值（+1 for exam day）
selectedNPCs.value.forEach(npc => {
  const npcDays = (npc.requiredDays || 5) + 1 // Each NPC's own days + exam day
  npcSchedules[npc.id] = Array.from({ length: npcDays }, () => Array(6).fill(null))
  // 初始化當前能力值為 initial 的值
  npcCurrentAbilities[npc.id] = {
    coding: npc.initial.coding,
    math: npc.initial.math,
    fitness: npc.initial.fitness,
    mood: 50, // 初始心情值
    energy: 50 // 初始精力值
  }
})

// 計算當前 NPC 的時間表
const currentSchedule = computed(() => {
  if (!currentNPC.value) return []
  const extended = extendedDays[currentNPC.value.id]
  const required = extended || currentNPC.value.requiredDays || 5
  return npcSchedules[currentNPCId.value] || Array.from({ length: required + 1 }, () => Array(6).fill(null))
})

// 當前正在編輯的 NPC 對象
const currentNPC = computed(() => {
  return selectedNPCs.value.find(npc => npc.id === currentNPCId.value)
})

// 當前 NPC 的實際截止天數（考慮延伸）
const currentNPCDeadline = computed(() => {
  if (!currentNPC.value) return 5
  return extendedDays[currentNPC.value.id] || currentNPC.value.requiredDays || 5
})

// 被拖動的卡片
const draggedCard = ref(null)

// 點擊選擇的卡片
const selectedCard = ref(null)

// 拖動開始
const startDrag = (card) => {
  draggedCard.value = card
}

// 點擊選擇卡片
const selectCard = (card) => {
  if (selectedCard.value?.id === card.id) {
    // 再次點擊相同卡片則取消選擇
    selectedCard.value = null
  } else {
    selectedCard.value = card
  }
}

// 選擇 NPC（切換時間表）
const selectNPC = (npc) => {
  currentNPCId.value = npc.id
}

// 拖放到時間表格子
const dropOnSlot = (dayIndex, slotIndex) => {
  // 檢查是否已經過了這一天，如果是則不允許編輯
  if (dayIndex < currentDay.value) {
    alert('已過的天數無法編輯')
    draggedCard.value = null
    return
  }
  
  // 優先使用拖拽的卡片，否則使用選擇的卡片
  const cardToPlace = draggedCard.value || selectedCard.value
  
  if (cardToPlace) {
    // 複製卡片到時間表
    const cardCopy = { ...cardToPlace, instanceId: Date.now() }
    currentSchedule.value[dayIndex][slotIndex] = cardCopy
    draggedCard.value = null
    // 保留選擇的卡片，不清除，以便繼續添加
  }
}

// 點擊時間表格子設置卡片
const clickOnSlot = (dayIndex, slotIndex) => {
  if (selectedCard.value) {
    dropOnSlot(dayIndex, slotIndex)
  }
}


// 移除時間表中的卡片
const removeCard = (dayIndex, slotIndex) => {
  // 檢查是否已經過了這一天，如果是則不允許編輯
  if (dayIndex < currentDay.value) {
    alert('已過的天數無法編輯')
    return
  }
  
  currentSchedule.value[dayIndex][slotIndex] = null
}

// 允許 drop
const allowDrop = (e) => {
  e.preventDefault()
}

// 在頁面掛載時，從 sessionStorage 載入模擬數據
onMounted(() => {
  // 首先檢查是否有選中的 NPC 資料（從 StudentIntakeView 傳來）
  const npcsData = sessionStorage.getItem('selectedNPCs')
  if (npcsData) {
    selectedNPCs.value = JSON.parse(npcsData)
    currentNPCId.value = selectedNPCs.value[0].id
    
    // 重新初始化時間表和能力值
    const maxRequiredDays_value = Math.max(...selectedNPCs.value.map(npc => npc.requiredDays || 5))
    selectedNPCs.value.forEach(npc => {
      npcSchedules[npc.id] = Array.from({ length: maxRequiredDays_value }, () => Array(6).fill(null))
      npcCurrentAbilities[npc.id] = {
        coding: npc.initial.coding,
        math: npc.initial.math,
        fitness: npc.initial.fitness,
        mood: 50,
        energy: 50
      }
    })
  }

  // 然後檢查是否有進行中的遊戲數據（從 DaySimulationView 返回）
  const data = sessionStorage.getItem('simulationData')
  if (data) {
    const simulationData = JSON.parse(data)
    // 恢復 currentDay、npcSchedules 和 npcCurrentAbilities
    currentDay.value = simulationData.currentDay || 0
    Object.assign(npcSchedules, simulationData.npcSchedules)
    Object.assign(npcCurrentAbilities, simulationData.npcCurrentAbilities)
    
    // 如果有延伸的天數，也要載入
    if (simulationData.extendedDays) {
      Object.assign(extendedDays, simulationData.extendedDays)
      
      // 擴展 npcSchedules 以容納新的天數（包括新的考試日）
      selectedNPCs.value.forEach(npc => {
        const extendedDaysCount = simulationData.extendedDays[npc.id]
        if (extendedDaysCount && npcSchedules[npc.id]) {
          // 如果現有的天數少於擴展後的天數+考試日，則添加新的空日期
          const requiredLength = extendedDaysCount + 1 // +1 for new exam day
          const currentLength = npcSchedules[npc.id].length
          if (currentLength < requiredLength) {
            for (let i = currentLength; i < requiredLength; i++) {
              npcSchedules[npc.id].push(Array(6).fill(null))
            }
          }
        }
      })
    }
  }
})

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
      requiredDays: npc.requiredDays,
    })),
    npcSchedules: npcSchedules,
    npcCurrentAbilities: npcCurrentAbilities,
    currentDay: currentDay.value,
    extendedDays: Object.keys(extendedDays).length > 0 ? extendedDays : undefined,
  }
  
  sessionStorage.setItem('simulationData', JSON.stringify(simulationData))
  router.push('/time-management/simulation')
}

// 返回
const goBack = () => {
  router.push('/time-management/intake')
}
</script>

<template>
  <div class="schedule-view">
    <!-- 頂部信息欄 -->
    <div class="schedule-header-bar">
      <div class="header-title">
        <strong>{{ $t('schedule.title') }}</strong>
        <span class="header-subtitle">{{ $t('schedule.subtitle') }}</span>
      </div>
      <div v-if="currentNPC" class="header-info">
        <span>{{ currentNPC.name }}</span>
        <span class="deadline">截止: 第 {{ currentNPCDeadline }} 天 | 進度: 第 {{ currentDay + 1 }} 天</span>
      </div>
    </div>

    <!-- 圖像展示區域 (預留給視覺小說式背景和角色) -->
    <div class="schedule-graphic-area">
      <!-- 這裡將來可以添加：背景圖、角色動畫、視覺效果等 -->
      <div class="graphic-placeholder">
        <span>{{ currentNPC?.image }}</span>
        <p>{{ currentNPC?.name }} - {{ currentNPC?.character }}</p>
      </div>
    </div>

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
              <div class="npc-status">
                <span class="status-item">⚡ 精力: {{ npcCurrentAbilities[npc.id].energy }}/100</span>
                <span class="status-item">😊 心情: {{ npcCurrentAbilities[npc.id].mood }}/100</span>
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
          <p class="cards-hint">{{ selectedCard ? '' + selectedCard.name + ' | 點擊時間表添加' : '點擊選擇 或 拖拽添加' }}</p>
          <div class="cards-list">
            <div
              v-for="card in availableCards"
              :key="card.id"
              class="card"
              :class="{ selected: selectedCard?.id === card.id }"
              :style="{ backgroundColor: card.color, opacity: selectedCard?.id === card.id ? 1 : 0.8 }"
              draggable="true"
              @dragstart="startDrag(card)"
              @click="selectCard(card)"
            >
              <div class="card-name">{{ card.name }}</div>
              <div class="card-effect">
                <span v-for="(value, key) in card.effect" :key="key" v-if="key !== 'energy' && key !== 'mood'">
                  {{ key }}: +{{ value }}
                </span>
                <span v-if="card.effect.energy && !card.isRest">💾 能量+{{ card.effect.energy }}</span>
                <span v-if="card.effect.mood && !card.isRest">😊 心情+{{ card.effect.mood }}</span>
              </div>
              <div v-if="card.cost" class="card-cost">
                <span v-if="card.cost.energy">⚡ -{{ card.cost.energy }}</span>
                <span v-if="card.cost.mood">😊 -{{ card.cost.mood }}</span>
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
            <div v-for="(day, dayIndex) in days" :key="day" class="day-col" :class="{ 
              'past-day-header': dayIndex < currentDay,
              'today-header': dayIndex === currentDay,
              'future-day-header': dayIndex > currentDay
            }">
              {{ day }}
              <span v-if="dayIndex < currentDay" class="day-status">✓ 已過</span>
              <span v-else-if="dayIndex === currentDay" class="day-status">📍 今天</span>
            </div>
          </div>

          <!-- 時間行 -->
          <div v-for="(slot, slotIndex) in timeSlots" :key="slotIndex" class="timetable-row">
            <div class="time-label">{{ slot }}</div>
            <div
              v-for="(day, dayIndex) in days"
              :key="`${dayIndex}-${slotIndex}`"
              class="schedule-cell"
              :class="{ 
                'past-day': dayIndex < currentDay,
                'today': dayIndex === currentDay,
                'future-day': dayIndex > currentDay,
                'selected-slot': selectedCard && dayIndex >= currentDay
              }"
              @drop="dropOnSlot(dayIndex, slotIndex)"
              @dragover.prevent="(e) => allowDrop(e)"
              @click="clickOnSlot(dayIndex, slotIndex)"
            >
              <div
                v-if="currentSchedule[dayIndex] && currentSchedule[dayIndex][slotIndex]"
                class="scheduled-card"
                :style="{ backgroundColor: currentSchedule[dayIndex][slotIndex].color }"
                @click="dayIndex >= currentDay && removeCard(dayIndex, slotIndex)"
                :class="{ 'locked': dayIndex < currentDay }"
                :title="dayIndex < currentDay ? '已過的天數無法編輯' : '點擊移除'"
              >
                {{ currentSchedule[dayIndex][slotIndex].name }}
              </div>
              <div v-else class="empty-slot" :class="{ 'locked': dayIndex < currentDay }">＋</div>
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

/* 頂部信息欄 - 單行狀態欄 */
.schedule-header-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.8rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1rem;
}

.header-title strong {
  font-weight: 700;
  font-size: 1.1rem;
  white-space: nowrap;
}

.header-subtitle {
  font-size: 0.9rem;
  opacity: 0.9;
  white-space: nowrap;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  white-space: nowrap;
}

.header-info span:first-child {
  font-weight: 600;
}

.header-info .deadline {
  opacity: 0.9;
}

/* 圖像展示區域 - 30% 高度用於視覺小說式背景和角色 */
.schedule-graphic-area {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  height: 25vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.graphic-placeholder {
  text-align: center;
  z-index: 1;
  font-size: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.graphic-placeholder p {
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
}

.schedule-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
  height: 30vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.schedule-header h1 {
  margin: 0;
  font-size: 1.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.schedule-header p {
  margin: 0;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.npc-status {
  display: flex;
  gap: 1rem;
  padding: 0.6rem;
  background: #f0f0ff;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  justify-content: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
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

.cards-hint {
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 0.8rem 0;
  font-style: italic;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  flex: 1;
}

.card {
  padding: 0.4rem 0.6rem;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  border: 3px solid transparent;
}

.card:hover {
  transform: scale(1.05);
}

.card.selected {
    border: 10px solid #667eea;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
}

.card-name {
  font-weight: 600;
  margin-bottom: 0.2rem;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-effect {
  font-size: 0.7rem;
  opacity: 0.9;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.2rem;
}
.card-effect span {
  display: inline;
}

.card-cost {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.card-cost span {
  display: inline;
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
  overflow-x: auto;
  width: 100%;
}

.timetable-header {
  display: grid;
  grid-template-columns: 80px repeat(50, 120px);
  gap: 1px;
  background: #667eea;
  padding: 1px;
  border-radius: 0.3rem;
  margin-bottom: 1px;
  min-width: min-content;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  min-width: 120px;
  width: 120px;
}

.day-col.past-day-header {
  background: #c0c0c0;
  opacity: 0.7;
}

.day-col.today-header {
  background: #ffc107;
  color: #333;
}

.day-col.future-day-header {
  background: #667eea;
}

.day-status {
  font-size: 0.7rem;
  opacity: 0.9;
  font-weight: 600;
}

.timetable-row {
  display: grid;
  grid-template-columns: 80px repeat(50, 120px);
  gap: 1px;
  min-width: min-content;
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
  min-width: 120px;
  width: 120px;
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

/* 選擇卡片時，時間表格子的樣式 */
.schedule-cell.selected-slot:hover {
  background: #e8f4f8;
  border-color: #2ecc71;
  box-shadow: inset 0 0 5px rgba(46, 204, 113, 0.3);
}

/* 過去的天數 - 禁用編輯 */
.schedule-cell.past-day {
  background: #f0f0f0;
  border-color: #ccc;
  opacity: 0.7;
  cursor: not-allowed;
}

.schedule-cell.past-day:hover {
  background: #f0f0f0;
  border-color: #ccc;
}

/* 當前天 - 強調 */
.schedule-cell.today {
  background: #fffbea;
  border-color: #ffc107;
  border-width: 2px;
}

.schedule-cell.today:hover {
  background: #fff9d6;
  border-color: #ffc107;
}

/* 未來的天數 - 正常可編輯 */
.schedule-cell.future-day {
  background: #f9f9ff;
  border-color: #e8e8f0;
}

.schedule-cell.future-day:hover {
  background: #f0f0ff;
  border-color: #667eea;
}

.empty-slot {
  color: #ccc;
  font-size: 1.5rem;
}

.empty-slot.locked {
  color: #aaa;
  cursor: not-allowed;
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

.scheduled-card.locked {
  cursor: not-allowed;
}

.scheduled-card:hover:not(.locked) {
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
