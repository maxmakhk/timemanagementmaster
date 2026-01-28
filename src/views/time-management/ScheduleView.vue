<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NPCQuests } from '../../data/time-management/quests'
import { activityCards } from '../../data/time-management/activities'

const router = useRouter()
const { t } = useI18n()
const baseUrl = import.meta.env.BASE_URL

// 示例：已選擇的 NPC（實際應從 store 傳入）
// Start with empty list - users add NPCs via "Add Mission" button
const selectedNPCs = ref([])

// 當前正在編輯的 NPC
const currentNPCId = ref(selectedNPCs.value.length > 0 ? selectedNPCs.value[0].id : null)

// 當前進行到第幾天（0-indexed，用於區分已過的天數）
const currentDay = ref(0)

// Store current day for each NPC separately
const npcCurrentDays = reactive({})

// Store pass status for each NPC (true = passed, false = not passed yet)
const npcPassStatus = reactive({})

// Track completed quest IDs for quest selection
const completedQuestIds = ref([])

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
const availableCards = computed(() => {
  return activityCards.map(card => ({
    ...card,
    name: t(`schedule.${card.activityKey}`)
  }))
})

// Current NPC's character image getter
const getCurrentCharacterImage = (activityKey) => {
  if (!currentNPC.value || !activityKey) return null
  const npcName = currentNPC.value.name.toLowerCase()
  return baseUrl + `images/${npcName}_${activityKey}.png`
}

// 為每個 NPC 維護獨立的時間表和當前能力值
const npcSchedules = reactive({})
const npcCurrentAbilities = reactive({})

// Initialize schedules and abilities when NPCs are added
// (moved to addNPCMission function)

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

// Current NPC's current day (how many days they've completed)
const currentNPCDay = computed(() => {
  if (!currentNPC.value) return 0
  return npcCurrentDays[currentNPC.value.id] || 0
})

// Current NPC character image (changes with quest)
const currentCharacterImage = computed(() => {
  if (!currentNPC.value) return baseUrl + 'images/time-management/Alice_rest.png'
  const characters = ['Alice', 'Bob']
  const activities = ['codingClass', 'mathStudy', 'fitnessTraining', 'lunch', 'rest']
  const npcName = currentNPC.value.name
  const randomActivity = activities[Math.floor(Math.random() * activities.length)]
  return baseUrl + `images/time-management/${npcName}_${randomActivity}.png`
})

// Current NPC background (changes with quest)
const currentBackground = computed(() => {
  const backgrounds = ['bg_codingClass.jpg', 'bg_mathStudy.jpg', 'bg_fitnessTraining.jpg', 'bg_lunch.jpg', 'bg_rest.jpg']
  const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)]
  return baseUrl + `images/time-management/${randomBg}`
})

// 被拖動的卡片
const draggedCard = ref(null)

// 點擊選擇的卡片
const selectedCard = ref(null)

// Track shift key state
const isShiftPressed = ref(false)

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
const dropOnSlot = (dayIndex, slotIndex, applyToAllDays = false) => {
  // Check if there's a current NPC selected
  if (!currentNPC.value) {
    alert(t('schedule.selectNPCFirst'))
    draggedCard.value = null
    return
  }
  
  // 檢查是否已經過了這一天，如果是則不允許編輯
  if (dayIndex < currentNPCDay.value) {
    alert(t('schedule.pastDaysNoEdit'))
    draggedCard.value = null
    return
  }
  
  // 優先使用拖拽的卡片，否則使用選擇的卡片
  const cardToPlace = draggedCard.value || selectedCard.value
  
  if (cardToPlace) {
    if (applyToAllDays) {
      // 應用到這個時間段的所有未來天數
      const totalDays = currentSchedule.value.length
      for (let i = dayIndex; i < totalDays; i++) {
        const cardCopy = { ...cardToPlace, instanceId: Date.now() + i }
        currentSchedule.value[i][slotIndex] = cardCopy
      }
    } else {
      // 只應用到當前選中的格子
      const cardCopy = { ...cardToPlace, instanceId: Date.now() }
      currentSchedule.value[dayIndex][slotIndex] = cardCopy
    }
    draggedCard.value = null
    // 保留選擇的卡片，不清除，以便繼續添加
  }
}

// 點擊時間表格子設置卡片
const clickOnSlot = (dayIndex, slotIndex, event) => {
  if (selectedCard.value) {
    // 如果按住 Shift 鍵，則應用到所有未來天數
    const applyToAllDays = event?.shiftKey || false
    
    // Prevent text selection when shift clicking
    if (applyToAllDays) {
      event.preventDefault()
    }
    
    dropOnSlot(dayIndex, slotIndex, applyToAllDays)
    
    // 提示用戶
    if (applyToAllDays) {
      const totalApplied = currentSchedule.value.length - dayIndex
      console.log(t('schedule.appliedToMultipleDays', { 
        card: selectedCard.value.name, 
        count: totalApplied, 
        timeSlot: timeSlots[slotIndex] 
      }))
    }
  }
}


// 移除時間表中的卡片
const removeCard = (dayIndex, slotIndex) => {
  // 檢查是否已經過了這一天，如果是則不允許編輯
  if (dayIndex < currentNPCDay.value) {
    alert(t('schedule.pastDaysNoEdit'))
    return
  }
  
  currentSchedule.value[dayIndex][slotIndex] = null
}

// 允許 drop
const allowDrop = (e) => {
  e.preventDefault()
}

// Keyboard event handlers for shift key
const handleKeyDown = (e) => {
  if (e.key === 'Shift') {
    isShiftPressed.value = true
  }
}

const handleKeyUp = (e) => {
  if (e.key === 'Shift') {
    isShiftPressed.value = false
  }
}

// 在頁面掛載時，從 sessionStorage 載入模擬數據
onMounted(() => {
  // Add keyboard event listeners
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  
  // First check if returning from intake with new NPC
  const newNPCData = sessionStorage.getItem('newNPC')
  if (newNPCData) {
    const newNPC = JSON.parse(newNPCData)
    sessionStorage.removeItem('newNPC')
    
    // Load previous state
    const stateData = sessionStorage.getItem('scheduleState')
    if (stateData) {
      const state = JSON.parse(stateData)
      selectedNPCs.value = state.selectedNPCs || []
      Object.assign(npcSchedules, state.npcSchedules || {})
      Object.assign(npcCurrentAbilities, state.npcCurrentAbilities || {})
      Object.assign(npcCurrentDays, state.npcCurrentDays || {})
      Object.assign(npcPassStatus, state.npcPassStatus || {})
      completedQuestIds.value = state.completedQuestIds || []
      if (state.extendedDays) {
        Object.assign(extendedDays, state.extendedDays)
      }
    }
    
    // Add new NPC
    selectedNPCs.value.push(newNPC)
    
    // Initialize new NPC's schedule and abilities
    const npcDays = (newNPC.requiredDays || 5) + 1
    npcSchedules[newNPC.id] = Array.from({ length: npcDays }, () => Array(6).fill(null))
    npcCurrentAbilities[newNPC.id] = {
      coding: newNPC.initial.coding,
      math: newNPC.initial.math,
      fitness: newNPC.initial.fitness,
      mood: 50,
      energy: 50
    }
    npcCurrentDays[newNPC.id] = 0
    npcPassStatus[newNPC.id] = false
    
    // Select the new NPC
    currentNPCId.value = newNPC.id
    return
  }
  
  // Load schedule state if exists (returning from simulation)
  const stateData = sessionStorage.getItem('scheduleState')
  if (stateData) {
    const state = JSON.parse(stateData)
    selectedNPCs.value = state.selectedNPCs || []
    Object.assign(npcSchedules, state.npcSchedules || {})
    Object.assign(npcCurrentAbilities, state.npcCurrentAbilities || {})
    Object.assign(npcCurrentDays, state.npcCurrentDays || {})
    Object.assign(npcPassStatus, state.npcPassStatus || {})
    completedQuestIds.value = state.completedQuestIds || []
    if (state.extendedDays) {
      Object.assign(extendedDays, state.extendedDays)
    }
    if (selectedNPCs.value.length > 0 && !currentNPCId.value) {
      currentNPCId.value = selectedNPCs.value[0].id
    }
    return
  }

  // Legacy: Check for old selectedNPCs format (for backward compatibility)
  const npcsData = sessionStorage.getItem('selectedNPCs')
  if (npcsData) {
    selectedNPCs.value = JSON.parse(npcsData)
    if (selectedNPCs.value.length > 0) {
      currentNPCId.value = selectedNPCs.value[0].id
    }
    
    // Initialize schedules and abilities
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
      npcCurrentDays[npc.id] = 0
      npcPassStatus[npc.id] = false
    })
    return
  }

  // Check for simulation data (returning from DaySimulationView)
  const data = sessionStorage.getItem('simulationData')
  if (data) {
    const simulationData = JSON.parse(data)
    currentDay.value = simulationData.currentDay || 0
    Object.assign(npcSchedules, simulationData.npcSchedules)
    Object.assign(npcCurrentAbilities, simulationData.npcCurrentAbilities)
    
    if (simulationData.npcCurrentDays) {
      Object.assign(npcCurrentDays, simulationData.npcCurrentDays)
    }
    
    if (simulationData.npcPassStatus) {
      Object.assign(npcPassStatus, simulationData.npcPassStatus)
    }
    
    if (simulationData.extendedDays) {
      Object.assign(extendedDays, simulationData.extendedDays)
      
      selectedNPCs.value.forEach(npc => {
        const extendedDaysCount = simulationData.extendedDays[npc.id]
        if (extendedDaysCount && npcSchedules[npc.id]) {
          const requiredLength = extendedDaysCount + 1
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

// Cleanup keyboard event listeners
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

// 開始模擬
const startSimulation = () => {
  // 驗證至少有一個 NPC 被選擇
  if (selectedNPCs.value.length === 0) {
    alert(t('schedule.selectAtLeastOneNPC'))
    return
  }

  // Save schedule state
  const stateData = {
    selectedNPCs: selectedNPCs.value,
    npcSchedules,
    npcCurrentAbilities,
    npcCurrentDays,
    npcPassStatus,
    completedQuestIds: completedQuestIds.value,
    extendedDays: Object.keys(extendedDays).length > 0 ? extendedDays : undefined,
  }
  sessionStorage.setItem('scheduleState', JSON.stringify(stateData))

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
    npcCurrentDays: npcCurrentDays,
    npcPassStatus: npcPassStatus,
    currentDay: currentDay.value,
    extendedDays: Object.keys(extendedDays).length > 0 ? extendedDays : undefined,
  }
  
  sessionStorage.setItem('simulationData', JSON.stringify(simulationData))
  router.push('/time-management/simulation')
}

// 返回
const goBack = () => {
  router.push('/')
}

// Add new NPC mission
const addNPCMission = () => {
  // Save current state before going to intake
  const stateData = {
    selectedNPCs: selectedNPCs.value,
    npcSchedules,
    npcCurrentAbilities,
    npcCurrentDays,
    npcPassStatus,
    completedQuestIds: completedQuestIds.value,
    extendedDays: Object.keys(extendedDays).length > 0 ? extendedDays : undefined,
  }
  sessionStorage.setItem('scheduleState', JSON.stringify(stateData))
  router.push('/time-management/intake')
}

// Start new game (clear all data)
const startNewGame = () => {
  if (selectedNPCs.value.length > 0) {
    if (!confirm('Start a new game? This will clear all current missions and progress.')) {
      return
    }
  }
  
  // Clear all session storage
  sessionStorage.removeItem('scheduleState')
  sessionStorage.removeItem('simulationData')
  sessionStorage.removeItem('selectedNPCs')
  sessionStorage.removeItem('newNPC')
  
  // Reset all reactive data
  selectedNPCs.value = []
  currentNPCId.value = null
  currentDay.value = 0
  completedQuestIds.value = []
  Object.keys(npcSchedules).forEach(key => delete npcSchedules[key])
  Object.keys(npcCurrentAbilities).forEach(key => delete npcCurrentAbilities[key])
  Object.keys(npcCurrentDays).forEach(key => delete npcCurrentDays[key])
  Object.keys(npcPassStatus).forEach(key => delete npcPassStatus[key])
  Object.keys(extendedDays).forEach(key => delete extendedDays[key])
}
</script>

<template>
  <div class="schedule-view">
    <!-- Home Button (Top Left) -->
    <button @click="goBack" class="home-button">🏠</button>

    <!-- 圖像展示區域 (視覺小說式背景和角色) -->
    <div class="schedule-graphic-area" :style="{ backgroundImage: `url(${currentBackground})` }">
      <div class="graphic-placeholder">
        <img v-if="currentNPC" :src="currentCharacterImage" class="random-character" alt="Character">
      </div>
    </div>

    <!-- 頂部信息欄 -->
    <div class="schedule-header-bar">
      <div class="header-title">
        <strong>{{ $t('schedule.title') }}</strong>
        <span class="header-subtitle">{{ $t('schedule.subtitle') }}</span>
      </div>
      <div v-if="currentNPC" class="header-info">
        <span>{{ currentNPC.name }} - {{ $t(currentNPC.characterKey) }}</span>
        <span class="deadline">{{ $t('schedule.deadline') }}: {{ $t('schedule.day') }} {{ currentNPCDeadline }} | {{ $t('schedule.progress') }}: {{ $t('schedule.day') }} {{ currentDay + 1 }}</span>
      </div>
    </div>

    <div class="schedule-container">
      <!-- 左側面板：NPC 任務卡 + 可用行程 -->
      <div class="left-panels">
        <!-- NPC 任務卡顯示 -->
        <div class="npc-panel">
          <div class="panel-header">
            <h2>📋 {{ $t('schedule.npcMissions') }}</h2>
            <button @click="addNPCMission" class="btn-add-mission">
              ➕ Add NPC Mission
            </button>
          </div>
          <div v-if="selectedNPCs.length === 0" class="empty-state">
            <p>No missions yet!</p>
            <p>Click "Add NPC Mission" to start</p>
          </div>
          <div v-else class="npc-cards-list">
            <div
              v-for="npc in selectedNPCs"
              :key="npc.id"
              class="npc-mission-card"
              :class="{ 
                active: currentNPCId === npc.id,
                passed: npcPassStatus[npc.id]
              }"
              @click="!npcPassStatus[npc.id] && selectNPC(npc)"
            >
              <div v-if="npcPassStatus[npc.id]" class="pass-badge">✅ PASSED</div>
              <div class="npc-header">
                <span class="npc-image">{{ npc.image }}</span>
                <div class="npc-title">
                  <h3>{{ npc.name }}</h3>
                  <span class="difficulty" :class="'difficulty-' + npc.difficulty.toLowerCase()">
                    {{ npc.difficulty }}
                  </span>
                </div>
              </div>
              <p class="npc-description">{{ $t(npc.descriptionKey) }}</p>
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
          <p class="cards-hint">{{ selectedCard ? `${selectedCard.name} | ${$t('schedule.clickToAdd')} | ${$t('schedule.shiftClickApplyAll')}` : $t('schedule.clickSelectOrDrag') }}</p>
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
          <!-- 表頭 - 時間槽在頂部 -->
          <div class="timetable-header">
            <div class="day-col"></div>
            <div v-for="(slot, slotIndex) in timeSlots" :key="slotIndex" class="time-col">
              {{ slot }}
            </div>
          </div>

          <!-- 每日行 - 日期在左側 -->
          <div v-for="(day, dayIndex) in days" :key="day" class="timetable-row" :class="{ 
            'past-day-row': dayIndex < currentNPCDay,
            'today-row': dayIndex === currentNPCDay,
            'future-day-row': dayIndex > currentNPCDay,
            'exam-day-row': dayIndex === currentNPCDeadline
          }">
            <div class="day-label" :class="{ 
              'past-day-header': dayIndex < currentNPCDay,
              'today-header': dayIndex === currentNPCDay,
              'future-day-header': dayIndex > currentNPCDay,
              'exam-day-header': dayIndex === currentNPCDeadline
            }">
              {{ day }}
              <span v-if="dayIndex < currentNPCDay" class="day-status">{{ $t('schedule.dayPassed') }}</span>
              <span v-else-if="dayIndex === currentNPCDay" class="day-status">{{ $t('schedule.dayToday') }}</span>
            </div>
            <div
              v-for="(slot, slotIndex) in timeSlots"
              :key="`${dayIndex}-${slotIndex}`"
              class="schedule-cell"
              :class="{ 
                'past-day': dayIndex < currentNPCDay,
                'today': dayIndex === currentNPCDay,
                'future-day': dayIndex > currentNPCDay,
                'exam-day': dayIndex === currentNPCDeadline,
                'selected-slot': selectedCard && dayIndex >= currentNPCDay && dayIndex < currentNPCDeadline && !isShiftPressed
              }"
              @drop="(event) => { if (dayIndex >= currentNPCDay && dayIndex < currentNPCDeadline) dropOnSlot(dayIndex, slotIndex) }"
              @dragover.prevent="(event) => { if (dayIndex >= currentNPCDay && dayIndex < currentNPCDeadline) allowDrop(event) }"
              @click="(event) => { if (dayIndex >= currentNPCDay && dayIndex < currentNPCDeadline) clickOnSlot(dayIndex, slotIndex, event) }"
            >
              <div
                v-if="currentSchedule[dayIndex] && currentSchedule[dayIndex][slotIndex]"
                class="scheduled-card"
                :style="{ backgroundColor: currentSchedule[dayIndex][slotIndex].color }"
                @click="dayIndex >= currentNPCDay && dayIndex < currentNPCDeadline && removeCard(dayIndex, slotIndex)"
                :class="{ 'locked': dayIndex < currentNPCDay || dayIndex === currentNPCDeadline }"
                :title="dayIndex === currentNPCDeadline ? '考試日無法編輯' : dayIndex < currentNPCDay ? '已過的天數無法編輯' : '點擊移除'"
              >
                {{ currentSchedule[dayIndex][slotIndex].name }}
              </div>
              <div v-else class="empty-slot" :class="{ 'locked': dayIndex < currentNPCDay || dayIndex === currentNPCDeadline }">
                {{ dayIndex === currentNPCDeadline ? '📝' : '＋' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作按鈕 -->
    <div class="action-buttons">
      <button v-if="selectedNPCs.length > 0 && selectedNPCs.some(npc => !npcPassStatus[npc.id])" @click="startSimulation" class="btn btn-primary">
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
  position: relative;
}

.home-button {
  position: fixed;
  top: 1rem;
  left: 1rem;
  width: 45px;
  height: 45px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.home-button:active {
  transform: scale(0.95);
}

/* 頂部信息欄 - 單行狀態欄 (matches DaySimulationView header-info) */
.schedule-header-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
}

.header-title strong {
  font-weight: 700;
  font-size: 1rem;
  white-space: nowrap;
}

.header-subtitle {
  font-size: 0.85rem;
  opacity: 0.9;
  white-space: nowrap;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
  white-space: nowrap;
}

.header-info span:first-child {
  font-weight: 600;
}

.header-info .deadline {
  opacity: 0.9;
}

/* 圖像展示區域 - 視覺小說式背景和角色 */
.schedule-graphic-area {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: cover;
  background-position: center;
  height: 250px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.graphic-placeholder {
  text-align: center;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: relative;
  width: 100%;
  height: 100%;
}

.random-character {
  width: auto;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
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
  overflow-x: hidden;
  overflow-y: visible;
  display: flex;
  flex-direction: column;
}

.npc-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.npc-panel h2 {
  margin: 0;
  font-size: 0.95rem;
  color: #667eea;
}

.btn-add-mission {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-add-mission:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  color: #999;
  font-size: 0.9rem;
  text-align: center;
}

.npc-cards-list {
  display: flex;
  flex-direction: row;
  gap: 0.8rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

.npc-cards-list::-webkit-scrollbar {
  height: 6px;
}

.npc-cards-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.npc-cards-list::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.npc-cards-list::-webkit-scrollbar-thumb:hover {
  background: #5568d3;
}

.npc-mission-card {
  border: 2px solid #e8e8f0;
  border-radius: 0.6rem;
  padding: 0.8rem;
  background: #f9f9ff;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 280px;
  flex-shrink: 0;
  max-height: 400px;
  overflow-y: auto;
}

.npc-mission-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.npc-mission-card::-webkit-scrollbar {
  width: 6px;
}

.npc-mission-card::-webkit-scrollbar-track {
  background: #f9f9ff;
  border-radius: 3px;
}

.npc-mission-card::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.npc-mission-card::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.npc-mission-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #e8e8ff 0%, #f0f0ff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.npc-mission-card.passed {
  opacity: 0.7;
  background: #e8f5e9;
  border-color: #4caf50;
  cursor: not-allowed;
}

.npc-mission-card.passed:hover {
  border-color: #4caf50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.pass-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #4caf50;
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 0.3rem;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
  display: none;
  gap: 1rem;
  padding: 0.6rem;
  background: #f0f0ff;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  justify-content: center;
  flex-shrink: 0;
}

.npc-mission-card.active .npc-status {
  display: flex;
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
  flex-shrink: 0;
}

.npc-mission-card.active .npc-reward {
  display: block;
}

/* 左側：行程卡面板 */
.cards-panel {
  background: white;
  border-radius: 0.8rem;
  padding: 1rem;
  overflow-x: hidden;
  overflow-y: visible;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 80px;
  z-index: 10;
}

.cards-hint {
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 0.8rem 0;
  font-style: italic;
}

.cards-list {
  display: flex;
  flex-direction: row;
  gap: 0.8rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

.cards-list::-webkit-scrollbar {
  height: 6px;
}

.cards-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.cards-list::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.cards-list::-webkit-scrollbar-thumb:hover {
  background: #5568d3;
}

.card {
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  min-width: 180px;
  flex-shrink: 0;
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
  user-select: none; /* Prevent text selection when shift-clicking */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.timetable-header {
  display: grid;
  grid-template-columns: 80px repeat(6, 60px);
  gap: 1px;
  background: #667eea;
  padding: 1px;
  border-radius: 0.3rem;
  margin-bottom: 1px;
  min-width: min-content;
  position: sticky;
  top: 0;
  z-index: 10;
}

.time-col {
  background: #667eea;
  color: white;
  font-weight: 600;
  padding: 0.4rem;
  font-size: 0.75rem;
  width: 60px;
  min-width: 60px;
  text-align: center;
}

.day-label {
  background: #667eea;
  color: white;
  font-weight: 600;
  padding: 0.4rem 0.3rem;
  text-align: center;
  font-size: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 80px;
  width: 80px;
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

.day-label.past-day-header {
  background: #c0c0c0;
  opacity: 0.7;
}

.day-label.today-header {
  background: #ffc107;
  color: #333;
}

.day-label.future-day-header {
  background: #667eea;
}

.day-status {
  font-size: 0.7rem;
  opacity: 0.9;
  font-weight: 600;
}

.timetable-row {
  display: grid;
  grid-template-columns: 80px repeat(6, 60px);
  gap: 1px;
  min-width: min-content;
}

.time-label {
  background: #f0f0f0;
  padding: 0.4rem;
  font-weight: 600;
  text-align: center;
  font-size: 0.8rem;
  width: 80px;
  min-width: 80px;
}

.schedule-cell {
  background: white;
  border: 2px dashed #ddd;
  min-height: 50px;
  min-width: 60px;
  width: 60px;
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

/* 考試日 - 禁用編輯 */
.schedule-cell.exam-day {
  background: #fff3cd;
  border-color: #ff9800;
  cursor: not-allowed;
  opacity: 0.8;
}

.schedule-cell.exam-day:hover {
  background: #fff3cd;
  border-color: #ff9800;
  box-shadow: none;
}

.exam-day-header {
  background: #ff9800;
  color: white;
}

.exam-day-row {
  opacity: 0.9;
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

.btn-danger {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(231, 76, 60, 0.4);
}

/* Responsive Design for Mobile and Small Screens */
@media screen and (max-width: 1200px) {
  .schedule-container {
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .left-panels {
    grid-template-columns: 1fr;
    height: auto;
    max-height: 50vh;
    overflow: visible;
  }
  
  .timetable-panel {
    width: 100%;
    flex-shrink: 0;
    min-height: 500px;
    flex: none;
  }
}

@media screen and (max-width: 768px) {
  .schedule-graphic-area {
    height: 180px;
  }
  
  .random-character {
    height: 180px;
  }
  
  .schedule-header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }
  
  .header-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .left-panels {
    max-height: none;
    overflow: visible;
  }
  
  .npc-panel, .cards-panel {
    max-height: 300px;
    flex-shrink: 0;
  }
  
  .timetable-panel {
    min-height: 450px;
    flex: none;
  }
  
  .timetable {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .day-col {
    min-width: 100px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .action-buttons button {
    width: 100%;
  }
}

@media screen and (max-width: 480px) {
  .schedule-graphic-area {
    height: 150px;
  }
  
  .random-character {
    height: 150px;
  }
  
  .schedule-header-bar {
    font-size: 0.8rem;
  }
  
  .header-title strong {
    font-size: 0.9rem;
  }
  
  .npc-panel, .cards-panel {
    max-height: 250px;
  }
  
  .card {
    min-width: 150px;
    font-size: 0.85rem;
  }
  
  .day-col {
    min-width: 80px;
    font-size: 0.75rem;
  }
  
  .time-label {
    font-size: 0.75rem;
  }
  
  .card-name {
    font-size: 0.75rem;
  }
}
</style>

