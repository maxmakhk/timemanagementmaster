<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// 模擬數據
const simulationData = ref(null)
const currentDay = ref(0)
const currentNPCIndex = ref(0)
const logs = ref([])

// 計算出總共要模擬的天數和 NPC 數量
const totalDays = 5 // 改為 5 天（與 ScheduleView 一致）

// 當前 NPC
const currentNPC = computed(() => {
  if (!simulationData.value) return null
  return simulationData.value.selectedNPCs[currentNPCIndex.value]
})

// 當前 NPC 的當前能力值
const currentAbilities = computed(() => {
  if (!simulationData.value || !currentNPC.value) return null
  return simulationData.value.npcCurrentAbilities[currentNPC.value.id] || {}
})

// 當前 NPC 在當前天的行程
const todaySchedule = computed(() => {
  if (!simulationData.value || !currentNPC.value) return []
  
  const schedule = simulationData.value.npcSchedules[currentNPC.value.id]
  if (!schedule || !schedule[currentDay.value]) return []
  
  return schedule[currentDay.value]
    .map((card, slotIndex) => {
      if (!card) return null
      return {
        slotIndex,
        time: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'][slotIndex],
        activity: card.name,
        effect: card.effect
      }
    })
    .filter(item => item !== null)
})

// 載入模擬數據
onMounted(() => {
  const data = sessionStorage.getItem('simulationData')
  if (data) {
    simulationData.value = JSON.parse(data)
    startDaySimulation()
  } else {
    alert('無法載入模擬數據')
    router.push('/schedule')
  }
})

// 執行當天的模擬
const startDaySimulation = () => {
  logs.value = []
  
  if (!currentNPC.value) return
  
  // 開始日誌
  logs.value.push(`📅 第 ${currentDay.value + 1} 天 - ${currentNPC.value.name} 的日程`)
  logs.value.push('---')
  
  // 執行當天的每一個行程
  let totalCoding = 0
  let totalMath = 0
  let totalFitness = 0
  
  if (todaySchedule.value.length === 0) {
    logs.value.push('✗ 今天沒有安排行程')
  } else {
    todaySchedule.value.forEach(item => {
      logs.value.push(`⏰ ${item.time} - ${item.activity}`)
      
      // 計算效果
      if (item.effect.coding) {
        totalCoding += item.effect.coding
        logs.value.push(`  ✓ 編程能力 +${item.effect.coding}`)
      }
      if (item.effect.math) {
        totalMath += item.effect.math
        logs.value.push(`  ✓ 數學能力 +${item.effect.math}`)
      }
      if (item.effect.fitness) {
        totalFitness += item.effect.fitness
        logs.value.push(`  ✓ 身體素質 +${item.effect.fitness}`)
      }
      if (item.effect.mood) {
        logs.value.push(`  ✓ 心情 +${item.effect.mood}`)
      }
      if (item.effect.energy) {
        logs.value.push(`  ✓ 精力恢復 +${item.effect.energy}`)
      }
    })
    
    logs.value.push('---')
    logs.value.push(`📊 今日總進度：`)
    logs.value.push(`  編程：${currentAbilities.value.coding} → ${currentAbilities.value.coding + totalCoding}`)
    logs.value.push(`  數學：${currentAbilities.value.math} → ${currentAbilities.value.math + totalMath}`)
    logs.value.push(`  身體：${currentAbilities.value.fitness} → ${currentAbilities.value.fitness + totalFitness}`)
    
    // 更新當前能力值
    currentAbilities.value.coding += totalCoding
    currentAbilities.value.math += totalMath
    currentAbilities.value.fitness += totalFitness
    
    logs.value.push('✅ 一天結束')
  }
}

// 下一天或下一個 NPC
const nextDay = () => {
  // 先移到下一個 NPC（同一天）
  if (currentNPCIndex.value < simulationData.value.selectedNPCs.length - 1) {
    currentNPCIndex.value++
    startDaySimulation()
  } else {
    // 所有 NPC 都完成了這一天，移到下一天
    currentNPCIndex.value = 0
    
    if (currentDay.value < totalDays - 1) {
      currentDay.value++
      startDaySimulation()
    } else {
      // 完成所有天數，進入報告頁面
      router.push('/report')
    }
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

// 計算進度百分比
const progressPercent = computed(() => {
  const totalNPCs = simulationData.value?.selectedNPCs.length || 1
  const totalItems = totalDays * totalNPCs
  const currentItem = currentDay.value * totalNPCs + currentNPCIndex.value + 1
  return (currentItem / totalItems) * 100
})
</script>

<template>
  <div class="day-simulation-view">
    <header class="simulation-header">
      <h1 v-if="currentNPC">
        {{ $t('day.title') }} - 第 {{ currentDay + 1 }} 天 / {{ totalDays }} 天 ({{ currentNPC.name }})
      </h1>
      <div class="progress-bar">
        <div class="progress" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </header>

    <div v-if="simulationData" class="simulation-container">
      <!-- 上半部分：今日行程 -->
      <div class="schedule-section">
        <h2>{{ currentNPC?.name }} - {{ $t('day.todaySchedule') }}</h2>
        <div v-if="todaySchedule.length > 0" class="schedule-table">
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
        <div v-else class="no-schedule">
          ✗ 今天沒有安排行程
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

      <!-- 當前能力值顯示 -->
      <div class="abilities-section">
        <h2>{{ currentNPC?.name }} 當前能力值</h2>
        <div class="abilities-grid">
          <div class="ability-card">
            <div class="ability-name">📚 編程</div>
            <div class="ability-bar">
              <div class="ability-fill" :style="{ width: (currentAbilities?.coding / 100 * 100) + '%' }"></div>
            </div>
            <div class="ability-value">{{ currentAbilities?.coding || 0 }}</div>
          </div>
          <div class="ability-card">
            <div class="ability-name">🔢 數學</div>
            <div class="ability-bar">
              <div class="ability-fill" :style="{ width: (currentAbilities?.math / 100 * 100) + '%' }"></div>
            </div>
            <div class="ability-value">{{ currentAbilities?.math || 0 }}</div>
          </div>
          <div class="ability-card">
            <div class="ability-name">💪 身體</div>
            <div class="ability-bar">
              <div class="ability-fill" :style="{ width: (currentAbilities?.fitness / 100 * 100) + '%' }"></div>
            </div>
            <div class="ability-value">{{ currentAbilities?.fitness || 0 }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按鈕 -->
    <div class="action-buttons">
      <button @click="goBack" class="btn btn-secondary">
        {{ $t('day.goBack') }}
      </button>
      <button 
        v-if="currentDay === totalDays - 1 && currentNPCIndex === (simulationData?.selectedNPCs.length || 1) - 1"
        @click="endSimulation"
        class="btn btn-primary"
      >
        {{ $t('day.viewReport') }}
      </button>
      <button 
        v-else
        @click="nextDay"
        class="btn btn-primary"
      >
        {{ $t('day.nextDay') }}
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

.no-schedule {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-size: 1.1rem;
}

/* 能力值部分 */
.abilities-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
}

.abilities-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.abilities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.ability-card {
  background: #f9f9f9;
  border: 2px solid #e8e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
}

.ability-name {
  font-weight: 600;
  margin-bottom: 0.8rem;
  font-size: 1rem;
}

.ability-bar {
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.ability-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.ability-value {
  font-weight: 600;
  color: #667eea;
  font-size: 1.2rem;
}


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
