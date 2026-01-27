<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// 模擬數據
const simulationData = ref(null)
const currentDay = ref(0)
const currentNPCIndex = ref(0)
const logs = ref({}) // Store logs per NPC: { npcId: [logs] }

// Active tabs
const selectedNPCId = ref(null) // Currently selected NPC tab

// Header animation state
const headerTimeLabel = ref('')
const runTime = 100;

// Simulation state
const isSimulationRunning = ref(false)
const currentSimulatingNPCIndex = ref(0)
const simulationComplete = ref(false)

// 計算出最大的要求天數
const maxRequiredDays = computed(() => {
  if (!simulationData.value) return 5
  
  // Check for extended days
  if (simulationData.value.extendedDays && simulationData.value.extendedDays[currentNPC.value?.id]) {
    return simulationData.value.extendedDays[currentNPC.value.id]
  }
  
  return Math.max(...simulationData.value.selectedNPCs.map(npc => npc.requiredDays || 5))
})

// 當前 NPC (the one actively being simulated)
const currentNPC = computed(() => {
  if (!simulationData.value) return null
  return simulationData.value.selectedNPCs[currentNPCIndex.value]
})

// Selected NPC for viewing (can be different from currentNPC)
const selectedNPC = computed(() => {
  if (!simulationData.value || !selectedNPCId.value) return currentNPC.value
  return simulationData.value.selectedNPCs.find(npc => npc.id === selectedNPCId.value) || currentNPC.value
})

// Get abilities for the selected NPC
const selectedAbilities = computed(() => {
  if (!simulationData.value || !selectedNPC.value) return null
  return simulationData.value.npcCurrentAbilities[selectedNPC.value.id] || {}
})

// Get today's schedule for the selected NPC
const selectedSchedule = computed(() => {
  if (!simulationData.value || !selectedNPC.value) return []
  
  const schedule = simulationData.value.npcSchedules[selectedNPC.value.id]
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

// Selected NPC total days (includes extension if any)
const selectedMaxDays = computed(() => {
  if (!simulationData.value || !selectedNPC.value) return maxRequiredDays.value
  const extended = simulationData.value.extendedDays?.[selectedNPC.value.id]
  return extended || selectedNPC.value.requiredDays || maxRequiredDays.value
})

// Header display with animated time label
const headerTitle = computed(() => {
  const npcName = selectedNPC.value?.name || currentNPC.value?.name || ''
  const dayIndex = currentDay.value + 1
  const totalDays = selectedMaxDays.value
  const timeLabel = headerTimeLabel.value || ''
  const timePart = timeLabel ? `Day ${dayIndex} ${timeLabel}` : `Day ${dayIndex}`
  return `${t('day.title')} - ${timePart} / ${totalDays} 天 (${npcName})`
})

// Get logs for the selected NPC
const selectedLogs = computed(() => {
  if (!selectedNPC.value) return []
  return logs.value[selectedNPC.value.id] || []
})

// Auto-scroll log container when new logs appear
const logContainer = ref(null)
const scrollToBottom = () => {
  if (logContainer.value) {
    setTimeout(() => {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }, 100)
  }
}

// Watch for log changes and auto-scroll
watch(() => selectedLogs.value.length, () => {
  scrollToBottom()
})

// Keep backward compatibility
const currentAbilities = computed(() => {
  if (!simulationData.value || !currentNPC.value) return null
  return simulationData.value.npcCurrentAbilities[currentNPC.value.id] || {}
})

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
    // 從 simulationData 中載入當前天數
    currentDay.value = simulationData.value.currentDay || 0
    
    // Initialize logs structure for all NPCs
    if (simulationData.value.selectedNPCs) {
      simulationData.value.selectedNPCs.forEach(npc => {
        if (!logs.value[npc.id]) {
          logs.value[npc.id] = []
        }
      })
    }
    
    // Set initial selected NPC to current NPC
    if (currentNPC.value) {
      selectedNPCId.value = currentNPC.value.id
    }
    
    // Auto-start simulation
    startAllNPCSimulations()
  } else {
    alert('無法載入模擬數據')
    router.push('/time-management/schedule')
  }
})

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Process a single activity for an NPC
const processActivity = async (npc, item, npcLogs, abilities) => {
  npcLogs.push(`⏰ ${item.time} - ${item.activity}`)
  
  // 獲取活動的定義（用來查詢成本）
  const activityDef = [
    { id: 1, name: 'Coding Class', effect: { coding: 5 }, cost: { energy: 30, mood: 50 } },
    { id: 2, name: 'Math Study', effect: { math: 5 }, cost: { energy: 30, mood: 50 } },
    { id: 3, name: 'Fitness', effect: { fitness: 5 }, cost: { energy: 30, mood: 50 } },
    { id: 4, name: 'Rest', isRest: true },
    { id: 5, name: 'Lunch', cost: { energy: -50 } }
  ].find(a => a.name === item.activity)
  
  let gains = { coding: 0, math: 0, fitness: 0 }
  
  // 檢查是否為休息卡片
  if (activityDef?.isRest) {
    abilities.energy = 100
    abilities.mood = 100
    npcLogs.push(`  ✓ 精力恢復至 100`)
    npcLogs.push(`  ✓ 心情恢復至 100`)
  } else if (item.activity === 'Lunch') {
    // 午餐只恢復能量，不消耗心情
    abilities.energy = Math.min(abilities.energy + 50, 100)
    npcLogs.push(`  ✓ 精力 +50`)
  } else {
    // 學習活動：計算效果並消耗資源
    const cost = activityDef?.cost || { energy: 30, mood: 50 }
    
    // 先消耗資源
    const oldEnergy = abilities.energy
    const oldMood = abilities.mood
    
    abilities.energy -= cost.energy
    abilities.mood -= cost.mood
    
    npcLogs.push(`  📉 精力消耗 ${cost.energy} (${oldEnergy} → ${Math.max(abilities.energy, 0)})`)
    npcLogs.push(`  📉 心情消耗 ${cost.mood} (${oldMood} → ${Math.max(abilities.mood, 0)})`)
    
    // 計算效率 - 如果能量或心情 <= 0，學習效果減半
    let efficiency = 1.0
    if (abilities.energy < 0 || abilities.mood < 0) {
      efficiency = 0.5
      npcLogs.push(`  ⚠️ 能量或心情不足，學習效果降低 50%`)
    }
    
    // 應用學習效果
    if (item.effect.coding) {
      const gain = Math.floor(item.effect.coding * efficiency)
      gains.coding = gain
      npcLogs.push(`  ✓ 編程能力 +${gain}`)
    }
    if (item.effect.math) {
      const gain = Math.floor(item.effect.math * efficiency)
      gains.math = gain
      npcLogs.push(`  ✓ 數學能力 +${gain}`)
    }
    if (item.effect.fitness) {
      const gain = Math.floor(item.effect.fitness * efficiency)
      gains.fitness = gain
      npcLogs.push(`  ✓ 身體素質 +${gain}`)
    }
  }
  
  // 確保不低於0
  abilities.energy = Math.max(abilities.energy, 0)
  abilities.mood = Math.max(abilities.mood, 0)
  
  return gains
}

// 執行單個NPC的當天模擬 (step by step with animation)
const simulateNPCDay = async (npc, npcIndex) => {
  // Switch to this NPC's tab
  selectedNPCId.value = npc.id
  currentSimulatingNPCIndex.value = npcIndex
  headerTimeLabel.value = '準備中'
  
  // Initialize logs for NPC if not exists
  if (!logs.value[npc.id]) {
    logs.value[npc.id] = []
  }
  
  // Clear NPC's logs
  logs.value[npc.id] = []
  
  const abilities = simulationData.value.npcCurrentAbilities[npc.id]
  
  // 每天開始時重置心情和精力到100
  abilities.energy = 100
  abilities.mood = 100
  
  const npcLogs = logs.value[npc.id]
  
  // 開始日誌
  npcLogs.push(`📅 第 ${currentDay.value + 1} 天 - ${npc.name} 的日程`)
  npcLogs.push('---')
  
  await delay(500) // Initial delay
  
  // Get schedule for this NPC
  const schedule = simulationData.value.npcSchedules[npc.id]
  const daySchedule = schedule?.[currentDay.value] || []
  
  const scheduleItems = daySchedule
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
  
  // Check if this is exam day
  const npcRequiredDays = npc.requiredDays || 5
  const npcExtendedDays = simulationData.value?.extendedDays?.[npc.id]
  const npcMaxDays = npcExtendedDays || npcRequiredDays
  const isNPCExamDay = currentDay.value === npcMaxDays
  
  if (isNPCExamDay) {
    // This is exam day - show exam instead of regular schedule
    npcLogs.push('📝 今天是考試日！')
    npcLogs.push('---')
    headerTimeLabel.value = '考試中'
    
    await delay(runTime)
    
    // Calculate and show exam results
    const examResults = calculateExamResults()
    if (examResults) {
      npcLogs.push('🎓 === 考試結果 === 🎓')
      npcLogs.push('---')
      npcLogs.push(`📋 考試嘗試次數: #${examResults.examAttempt}`)
      npcLogs.push('---')
      npcLogs.push('📊 技能評估：')
      
      examResults.skillResults.forEach(skill => {
        const status = skill.passed ? '✅ 通過' : '❌ 未通過'
        const bar = '█'.repeat(Math.floor(skill.percentage / 10)) + '░'.repeat(10 - Math.floor(skill.percentage / 10))
        npcLogs.push(`  ${skill.emoji} ${skill.name}: ${skill.current}/${skill.goal} (${skill.percentage}%) ${status}`)
        npcLogs.push(`     ${bar}`)
      })
      
      npcLogs.push('---')
      npcLogs.push(`📈 總體通過率: ${examResults.passedSkills}/3 技能`)
      
      if (examResults.passed) {
        npcLogs.push('🎉 === 考試通過！ === 🎉')
        npcLogs.push(`🏆 獲得聲望: ${examResults.finalReward}`)
        npcLogs.push('✨ 恭喜完成任務！')
      } else {
        npcLogs.push('😔 === 考試未通過 === 😔')
        npcLogs.push(`⚠️ ${3 - examResults.passedSkills} 個技能未達標`)
        npcLogs.push('💡 建議：需要更多學習時間')
        if (examResults.examAttempt > 1) {
          npcLogs.push(`📉 聲望獎勵已降低: ${examResults.originalReward} → ${examResults.finalReward} (-${Math.round((1 - examResults.finalReward / examResults.originalReward) * 100)}%)`)
        }
      }
      
      npcLogs.push('---')
    }
    
    headerTimeLabel.value = '考試完成'
    await delay(runTime)
  } else if (scheduleItems.length === 0) {
    npcLogs.push('✗ 今天沒有安排行程')
    headerTimeLabel.value = '無行程'
    await delay(runTime)
  } else {
    let totalCoding = 0
    let totalMath = 0
    let totalFitness = 0
    
    // Process each activity with delay
    for (const item of scheduleItems) {
      headerTimeLabel.value = item.time
      const gains = await processActivity(npc, item, npcLogs, abilities)
      totalCoding += gains.coding
      totalMath += gains.math
      totalFitness += gains.fitness
      
      // Apply gains
      abilities.coding += gains.coding
      abilities.math += gains.math
      abilities.fitness += gains.fitness
      
      await delay(runTime) // 1 second delay between activities
    }
    
    npcLogs.push('---')
    npcLogs.push(`📊 今日總進度：`)
    npcLogs.push(`  編程：${abilities.coding - totalCoding} → ${abilities.coding}`)
    npcLogs.push(`  數學：${abilities.math - totalMath} → ${abilities.math}`)
    npcLogs.push(`  身體：${abilities.fitness - totalFitness} → ${abilities.fitness}`)
    npcLogs.push(`  精力：${abilities.energy}`)
    npcLogs.push(`  心情：${abilities.mood}`)
    
    await delay(runTime)
    
    npcLogs.push('✅ 一天結束')
    headerTimeLabel.value = '完成'
  }
  
  await delay(1500) // Delay before next NPC
}

// 執行所有NPC的模擬
const startAllNPCSimulations = async () => {
  if (!simulationData.value || isSimulationRunning.value) return
  
  isSimulationRunning.value = true
  simulationComplete.value = false
  
  // Run simulation for each NPC sequentially
  for (let i = 0; i < simulationData.value.selectedNPCs.length; i++) {
    const npc = simulationData.value.selectedNPCs[i]
    await simulateNPCDay(npc, i)
  }
  
  isSimulationRunning.value = false
  simulationComplete.value = true
}

// Check if today is exam day
const isExamDay = computed(() => {
  if (!currentNPC.value) return false
  const requiredDays = currentNPC.value.requiredDays || 5
  const extendedDays = simulationData.value?.extendedDays?.[currentNPC.value.id]
  const maxDays = extendedDays || requiredDays
  // Exam day is the day after required days complete
  return currentDay.value === maxDays
})

// 計算考試結果
const calculateExamResults = () => {
  if (!currentNPC.value) {
    console.error('currentNPC is null')
    return null
  }
  
  if (!currentNPC.value.goals) {
    console.error('currentNPC.goals is missing', currentNPC.value)
    return null
  }
  
  const examAttempt = simulationData.value.examAttempt || 1
  const skills = [
    { name: 'Coding', emoji: '📚', key: 'coding', goal: currentNPC.value.goals.coding },
    { name: 'Math', emoji: '🔢', key: 'math', goal: currentNPC.value.goals.math },
    { name: 'Fitness', emoji: '💪', key: 'fitness', goal: currentNPC.value.goals.fitness }
  ]
  
  let passedSkills = 0
  const skillResults = skills.map(skill => {
    const current = currentAbilities.value[skill.key] || 0
    const percentage = Math.round((current / skill.goal) * 100)
    const passed = current >= skill.goal
    
    if (passed) {
      passedSkills++
    }
    
    return {
      name: skill.name,
      emoji: skill.emoji,
      key: skill.key,
      current,
      goal: skill.goal,
      percentage: Math.min(percentage, 100),
      passed
    }
  })
  
  // Overall pass: all skills must pass
  const overallPassed = passedSkills === 3
  
  // Calculate reward with 25% reduction per failed attempt
  const baseReward = currentNPC.value?.rewards?.masterReputation || 10
  const rewardReduction = Math.pow(0.75, examAttempt - 1)
  const finalReward = Math.round(baseReward * rewardReduction)
  
  const result = {
    skillResults,
    passedSkills,
    passed: overallPassed,
    originalReward: baseReward,
    finalReward,
    requiredDays: currentNPC.value?.requiredDays || 5,
    examAttempt,
    currentNPC: currentNPC.value,
    questIndex: currentNPCIndex.value
  }
  
  console.log('Exam results calculated:', result)
  return result
}

// Show exam results in event log
const showExamResults = () => {
  const examResults = calculateExamResults()
  
  if (!examResults || !currentNPC.value) {
    if (!logs.value[currentNPC.value?.id]) {
      logs.value[currentNPC.value.id] = []
    }
    logs.value[currentNPC.value.id].push('❌ 無法計算考試結果')
    return
  }
  
  const npcLogs = logs.value[currentNPC.value.id]
  
  npcLogs.push('---')
  npcLogs.push('🎓 === 考試結果 === 🎓')
  npcLogs.push('---')
  npcLogs.push(`📋 考試嘗試次數: #${examResults.examAttempt}`)
  npcLogs.push('---')
  npcLogs.push('📊 技能評估：')
  
  examResults.skillResults.forEach(skill => {
    const status = skill.passed ? '✅ 通過' : '❌ 未通過'
    const bar = '█'.repeat(Math.floor(skill.percentage / 10)) + '░'.repeat(10 - Math.floor(skill.percentage / 10))
    npcLogs.push(`  ${skill.emoji} ${skill.name}: ${skill.current}/${skill.goal} (${skill.percentage}%) ${status}`)
    npcLogs.push(`     ${bar}`)
  })
  
  npcLogs.push('---')
  npcLogs.push(`📈 總體通過率: ${examResults.passedSkills}/3 技能`)
  
  if (examResults.passed) {
    npcLogs.push('🎉 === 考試通過！ === 🎉')
    npcLogs.push(`🏆 獲得聲望: ${examResults.finalReward}`)
    npcLogs.push('✨ 恭喜完成任務！')
    
    // Mark quest as completed
    simulationData.value.completedQuests = simulationData.value.completedQuests || []
    simulationData.value.completedQuests.push({
      id: currentNPC.value.id,
      reward: examResults.finalReward,
      passed: true
    })
  } else {
    npcLogs.push('😔 === 考試未通過 === 😔')
    npcLogs.push(`⚠️ ${3 - examResults.passedSkills} 個技能未達標`)
    npcLogs.push('💡 建議：需要更多學習時間')
    if (examResults.examAttempt > 1) {
      npcLogs.push(`📉 聲望獎勵已降低: ${examResults.originalReward} → ${examResults.finalReward} (-${Math.round((1 - examResults.finalReward / examResults.originalReward) * 100)}%)`)
    }
  }
  
  npcLogs.push('---')
  
  return examResults
}

// 完成一天
const completeDay = () => {
  console.log('completeDay called, currentDay:', currentDay.value, 'isExamDay:', isExamDay.value)
  
  // If this is the exam day, show exam results in log
  if (isExamDay.value) {
    const examResults = showExamResults()
    
    if (examResults && examResults.passed) {
      // Exam passed - move to next NPC or report
      simulationData.value.currentNPCIndex = (simulationData.value.currentNPCIndex || 0) + 1
      simulationData.value.currentDay = 0
      simulationData.value.examAttempt = 1 // Reset for new student
      
      sessionStorage.setItem('simulationData', JSON.stringify(simulationData.value))
      
      // Check if there are more NPCs
      if (simulationData.value.currentNPCIndex < simulationData.value.selectedNPCs.length) {
        setTimeout(() => {
          router.push('/time-management/schedule')
        }, 3000) // Give user time to read results
      } else {
        setTimeout(() => {
          router.push('/time-management/report')
        }, 3000)
      }
    } else if (examResults) {
      // Exam failed - extend days and return to schedule
      const originalRequired = currentNPC.value.requiredDays
      const npcId = currentNPC.value.id
      
      // Continue from day after exam (e.g., if exam was day 6, continue from day 7)
      simulationData.value.currentDay = originalRequired + 1
      simulationData.value.examAttempt = (simulationData.value.examAttempt || 1) + 1
      
      // Extend days by 5 more training days (e.g., 5 days + 1 exam day + 5 more days = 11 total, exam on day 12)
      simulationData.value.extendedDays = simulationData.value.extendedDays || {}
      simulationData.value.extendedDays[npcId] = originalRequired + 1 + 5
      
      sessionStorage.setItem('simulationData', JSON.stringify(simulationData.value))
      
      setTimeout(() => {
        router.push('/time-management/schedule')
      }, 3000) // Give user time to read results
    }
  } else {
    // Regular learning day - go to next day (which will be exam day)
    currentDay.value++
    simulationData.value.currentDay = currentDay.value
    
    sessionStorage.setItem('simulationData', JSON.stringify(simulationData.value))
    router.push('/time-management/schedule')
  }
}

// 計算進度百分比
const progressPercent = computed(() => {
  const totalNPCs = simulationData.value?.selectedNPCs.length || 1
  const totalItems = maxRequiredDays.value * totalNPCs
  const currentItem = currentDay.value * totalNPCs + currentNPCIndex.value + 1
  return (currentItem / totalItems) * 100
})
</script>

<template>
  <div class="day-simulation-view">
    <header class="simulation-header">
      <h1 v-if="selectedNPC || currentNPC">
        {{ headerTitle }}
      </h1>
      <div v-if="isSimulationRunning" class="simulation-status">
        <span class="status-indicator running">⏳</span>
        <span>正在運行中...</span>
      </div>
      <div v-else-if="simulationComplete" class="simulation-status">
        <span class="status-indicator complete">✅</span>
        <span>模擬完成</span>
      </div>
      <div class="progress-bar">
        <div class="progress" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </header>

    <div v-if="simulationData" class="simulation-container">
      <!-- NPC Tabs -->
      <div class="npc-tabs">
        <button 
          v-for="npc in simulationData.selectedNPCs" 
          :key="npc.id"
          class="npc-tab"
          :class="{ active: selectedNPCId === npc.id }"
          @click="selectedNPCId = npc.id">
          {{ npc.image }} {{ npc.name }}
        </button>
      </div>

      <!-- 狀態欄 for Selected NPC -->
      <div class="status-bar">
        <div class="status-item energy-bar">
          <span class="status-label">⚡ 精力</span>
          <div class="bar">
            <div class="fill" :style="{ width: selectedAbilities?.energy || 0 + '%', backgroundColor: selectedAbilities?.energy > 50 ? '#2ecc71' : selectedAbilities?.energy > 25 ? '#f39c12' : '#e74c3c' }"></div>
          </div>
          <span class="status-value">{{ selectedAbilities?.energy || 0 }}/100</span>
        </div>
        <div class="status-item mood-bar">
          <span class="status-label">😊 心情</span>
          <div class="bar">
            <div class="fill" :style="{ width: selectedAbilities?.mood || 0 + '%', backgroundColor: selectedAbilities?.mood > 50 ? '#3498db' : selectedAbilities?.mood > 25 ? '#f39c12' : '#e74c3c' }"></div>
          </div>
          <span class="status-value">{{ selectedAbilities?.mood || 0 }}/100</span>
        </div>
      </div>

      <!-- Combined Content -->
      <div class="combined-content">
        <!-- Schedule Section -->
        <div class="schedule-section">
          <h2>📅 {{ selectedNPC?.name }} - {{ $t('day.todaySchedule') }}</h2>
          <div v-if="selectedSchedule.length > 0" class="schedule-table">
            <div v-for="(item, index) in selectedSchedule" :key="index" class="schedule-row">
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

        <!-- Event Log Section -->
        <div class="log-section">
          <h2>📝 {{ $t('day.eventLog') }}</h2>
          <div ref="logContainer" class="log-container">
            <div v-for="(log, index) in selectedLogs" :key="index" class="log-entry">
              {{ log }}
            </div>
          </div>
        </div>

        <!-- Abilities Section -->
        <div class="abilities-section">
          <h2>📊 {{ selectedNPC?.name }} 當前能力值</h2>
          <div class="abilities-grid">
            <div class="ability-card">
              <div class="ability-name">📚 編程</div>
              <div class="ability-bar">
                <div class="ability-fill" :style="{ width: (selectedAbilities?.coding / 100 * 100) + '%' }"></div>
              </div>
              <div class="ability-value">{{ selectedAbilities?.coding || 0 }} / {{ selectedNPC?.goals?.coding || 0 }}</div>
            </div>
            <div class="ability-card">
              <div class="ability-name">🔢 數學</div>
              <div class="ability-bar">
                <div class="ability-fill" :style="{ width: (selectedAbilities?.math / 100 * 100) + '%' }"></div>
              </div>
              <div class="ability-value">{{ selectedAbilities?.math || 0 }} / {{ selectedNPC?.goals?.math || 0 }}</div>
            </div>
            <div class="ability-card">
              <div class="ability-name">💪 身體</div>
              <div class="ability-bar">
                <div class="ability-fill" :style="{ width: (selectedAbilities?.fitness / 100 * 100) + '%' }"></div>
              </div>
              <div class="ability-value">{{ selectedAbilities?.fitness || 0 }} / {{ selectedNPC?.goals?.fitness || 0 }}</div>
            </div>
            <div class="ability-card">
              <div class="ability-name">😊 心情</div>
              <div class="ability-bar">
                <div class="ability-fill" :style="{ width: (selectedAbilities?.mood || 0) + '%' }"></div>
              </div>
              <div class="ability-value">{{ selectedAbilities?.mood || 0 }}/100</div>
            </div>
            <div class="ability-card">
              <div class="ability-name">⚡ 精力</div>
              <div class="ability-bar">
                <div class="ability-fill" :style="{ width: (selectedAbilities?.energy || 0) + '%' }"></div>
              </div>
              <div class="ability-value">{{ selectedAbilities?.energy || 0 }}/100</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按鈕 -->
    <div class="action-buttons">
      <button 
        v-if="simulationComplete" 
        @click="completeDay" 
        class="btn btn-primary">
        {{ $t('day.completeDay') }}
      </button>
      <div v-else-if="isSimulationRunning" class="simulation-message">
        <span class="spinner"></span>
        正在模擬每位學生的一天...
      </div>
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

.simulation-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.status-indicator {
  font-size: 1.5rem;
  animation: pulse 2s ease-in-out infinite;
}

.status-indicator.complete {
  animation: none;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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
  flex-direction: column;
}

/* NPC Tabs (Top Level) */
.npc-tabs {
  display: flex;
  gap: 0.5rem;
  background: white;
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.npc-tab {
  padding: 0.8rem 1.5rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
  white-space: nowrap;
  position: relative;
}

.npc-tab:hover {
  background: #f5f5f5;
  border-color: #667eea;
  color: #333;
}

.npc-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 狀態欄 */
.status-bar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Combined Content */
.combined-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-label {
  font-weight: 600;
  min-width: 60px;
  font-size: 1.1rem;
}

.status-item .bar {
  flex: 1;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.status-item .fill {
  height: 100%;
  transition: width 0.3s ease;
}

.status-value {
  font-weight: 600;
  min-width: 60px;
  text-align: right;
  font-size: 1.1rem;
}

/* 行程部分 */
.schedule-section {
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
  grid-template-columns: repeat(5, 1fr);
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
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 300px;
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
  align-items: center;
}

.simulation-message {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.1rem;
  color: #667eea;
  font-weight: 500;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.btn-exam {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
}

.btn-exam:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(243, 156, 18, 0.4);
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
