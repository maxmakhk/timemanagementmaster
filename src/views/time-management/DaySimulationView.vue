<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getActivityByName } from '../../data/time-management/activities'

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
const runTime = 1000;
const currentActivity = ref(null) // Track current activity for header images

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
  return `${t('day.title')} - ${timePart} / ${totalDays} ${t('day.days')} (${npcName})`
})

// Header background and character images
const headerBackgroundImage = computed(() => {
  if (!currentActivity.value || !currentActivity.value.bgImage) {
    return '/images/time-management/bg_rest.jpg'
  }
  return currentActivity.value.bgImage
})

const headerCharacterImage = computed(() => {
  if (!selectedNPC.value) return null
  const npcName = selectedNPC.value.name
  
  if (!currentActivity.value || !currentActivity.value.activityKey) {
    return `/images/time-management/${npcName}_rest.png`
  }
  
  return `/images/time-management/${npcName}_${currentActivity.value.activityKey}.png`
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
    // Load current day from simulationData or initialize npcCurrentDays
    if (!simulationData.value.npcCurrentDays) {
      simulationData.value.npcCurrentDays = {}
      simulationData.value.selectedNPCs.forEach(npc => {
        simulationData.value.npcCurrentDays[npc.id] = 0
      })
    }
    // Set currentDay to the first NPC's current day
    currentDay.value = simulationData.value.npcCurrentDays[simulationData.value.selectedNPCs[0].id] || 0
    
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
    alert(t('day.cannotLoadData'))
    router.push('/time-management/schedule')
  }
})

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Map translated activity names back to English names for lookup
const getActivityKeyFromDisplayName = (displayName) => {
  const activityMap = {
    '編程課': 'Coding Class',
    'Coding Class': 'Coding Class',
    '數學學習': 'Math Study',
    'Math Study': 'Math Study',
    '健身訓練': 'Fitness',
    'Fitness Training': 'Fitness',
    'Fitness': 'Fitness',
    '休息': 'Rest',
    'Rest': 'Rest',
    '午餐': 'Lunch',
    'Lunch': 'Lunch'
  }
  return activityMap[displayName] || displayName
}

// Process a single activity for an NPC
const processActivity = async (npc, item, npcLogs, abilities) => {
  npcLogs.push(`⏰ ${item.time} - ${item.activity}`)
  
  // 獲取活動的定義（用來查詢成本）
  // Convert display name to activity name for lookup
  const activityName = getActivityKeyFromDisplayName(item.activity)
  const activityDef = getActivityByName(activityName)
  
  // Update current activity for header display
  currentActivity.value = activityDef || null
  
  let gains = { coding: 0, math: 0, fitness: 0 }
  
  // 檢查是否為休息卡片
  if (activityDef?.isRest) {
    abilities.energy = 100
    abilities.mood = 100
    npcLogs.push(`  ${t('day.energyRestored')}`)
    npcLogs.push(`  ${t('day.moodRestored')}`)
  } else if (item.activity === 'Lunch') {
    // 午餐只恢復能量，不消耗心情
    abilities.energy = Math.min(abilities.energy + 50, 100)
    npcLogs.push(`  ${t('day.energyGained', { amount: 50 })}`)
  } else {
    // 學習活動：計算效果並消耗資源
    const cost = activityDef?.cost || { energy: 30, mood: 50 }
    
    // 先消耗資源
    const oldEnergy = abilities.energy
    const oldMood = abilities.mood
    
    abilities.energy -= cost.energy
    abilities.mood -= cost.mood
    
    npcLogs.push(`  ${t('day.energyConsumed', { amount: cost.energy, old: oldEnergy, new: Math.max(abilities.energy, 0) })}`)
    npcLogs.push(`  ${t('day.moodConsumed', { amount: cost.mood, old: oldMood, new: Math.max(abilities.mood, 0) })}`)
    
    // 計算效率 - 如果能量或心情 <= 0，學習效果減半
    let efficiency = 1.0
    if (abilities.energy < 0 || abilities.mood < 0) {
      efficiency = 0.5
      npcLogs.push(`  ${t('day.lowEfficiency')}`)
    }
    
    // 應用學習效果
    if (item.effect.coding) {
      const gain = Math.floor(item.effect.coding * efficiency)
      gains.coding = gain
      npcLogs.push(`  ${t('day.codingGained', { amount: gain })}`)
    }
    if (item.effect.math) {
      const gain = Math.floor(item.effect.math * efficiency)
      gains.math = gain
      npcLogs.push(`  ${t('day.mathGained', { amount: gain })}`)
    }
    if (item.effect.fitness) {
      const gain = Math.floor(item.effect.fitness * efficiency)
      gains.fitness = gain
      npcLogs.push(`  ${t('day.fitnessGained', { amount: gain })}`)
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
  headerTimeLabel.value = t('day.preparing')
  
  // Get this NPC's current day
  const npcCurrentDay = simulationData.value.npcCurrentDays?.[npc.id] ?? 0
  
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
  npcLogs.push(t('day.daySchedule', { day: npcCurrentDay + 1, name: npc.name }))
  npcLogs.push('---')
  
  await delay(500) // Initial delay
  
  // Get schedule for this NPC
  const schedule = simulationData.value.npcSchedules[npc.id]
  const daySchedule = schedule?.[npcCurrentDay] || []
  
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
  const isNPCExamDay = npcCurrentDay === npcMaxDays
  
  if (isNPCExamDay) {
    // This is exam day - show exam instead of regular schedule
    npcLogs.push(t('day.examDay'))
    npcLogs.push('---')
    headerTimeLabel.value = t('day.examInProgress')
    
    await delay(runTime)
    
    // Calculate and show exam results
    const examResults = calculateExamResults()
    if (examResults) {
      npcLogs.push(t('day.examResults'))
      npcLogs.push('---')
      npcLogs.push(t('day.examAttempt', { attempt: examResults.examAttempt }))
      npcLogs.push('---')
      npcLogs.push(t('day.skillAssessment'))
      
      examResults.skillResults.forEach(skill => {
        const status = skill.passed ? t('day.passed') : t('day.failed')
        const bar = '█'.repeat(Math.floor(skill.percentage / 10)) + '░'.repeat(10 - Math.floor(skill.percentage / 10))
        npcLogs.push(`  ${skill.emoji} ${skill.name}: ${skill.current}/${skill.goal} (${skill.percentage}%) ${status}`)
        npcLogs.push(`     ${bar}`)
      })
      
      npcLogs.push('---')
      npcLogs.push(t('day.overallPassRate', { passed: examResults.passedSkills }))
      
      if (examResults.passed) {
        npcLogs.push(t('day.examPassed'))
        npcLogs.push(t('day.reputationGained', { amount: examResults.finalReward }))
        npcLogs.push(t('day.questCompleted'))
      } else {
        npcLogs.push(t('day.examFailed'))
        npcLogs.push(t('day.skillsBelowTarget', { count: 3 - examResults.passedSkills }))
        npcLogs.push(t('day.needMoreTime'))
        if (examResults.examAttempt > 1) {
          npcLogs.push(t('day.rewardReduced', { 
            original: examResults.originalReward, 
            final: examResults.finalReward, 
            percent: Math.round((1 - examResults.finalReward / examResults.originalReward) * 100) 
          }))
        }
      }
      
      npcLogs.push('---')
    }
    
    headerTimeLabel.value = t('day.examComplete')
    await delay(runTime)
  } else if (scheduleItems.length === 0) {
    npcLogs.push(t('day.noSchedule'))
    headerTimeLabel.value = t('day.noScheduleStatus')
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
    npcLogs.push(t('day.dailySummary'))
    npcLogs.push(`  ${t('day.coding')}：${abilities.coding - totalCoding} → ${abilities.coding}`)
    npcLogs.push(`  ${t('day.math')}：${abilities.math - totalMath} → ${abilities.math}`)
    npcLogs.push(`  ${t('day.body')}：${abilities.fitness - totalFitness} → ${abilities.fitness}`)
    npcLogs.push(`  ${t('day.energy')}：${abilities.energy}`)
    npcLogs.push(`  ${t('day.mood')}：${abilities.mood}`)
    
    await delay(runTime)
    
    npcLogs.push(t('day.dayComplete'))
    headerTimeLabel.value = t('day.complete')
  }
  
  // Update this NPC's current day
  simulationData.value.npcCurrentDays[npc.id] = npcCurrentDay
  
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
    logs.value[currentNPC.value.id].push(t('day.cannotCalculateExam'))
    return
  }
  
  const npcLogs = logs.value[currentNPC.value.id]
  
  npcLogs.push('---')
  npcLogs.push(t('day.examResults'))
  npcLogs.push('---')
  npcLogs.push(t('day.examAttempt', { attempt: examResults.examAttempt }))
  npcLogs.push('---')
  npcLogs.push(t('day.skillAssessment'))
  
  examResults.skillResults.forEach(skill => {
        const status = skill.passed ? t('day.passed') : t('day.failed')
    npcLogs.push(`  ${skill.emoji} ${skill.name}: ${skill.current}/${skill.goal} (${skill.percentage}%) ${status}`)
    npcLogs.push(`     ${bar}`)
  })
  
  npcLogs.push('---')
  npcLogs.push(t('day.overallPassRate', { passed: examResults.passedSkills }))
  if (examResults.passed) {
    npcLogs.push(t('day.examPassed'))
    npcLogs.push(t('day.reputationGained', { amount: examResults.finalReward }))
    npcLogs.push(t('day.questCompleted'))
    
    // Mark quest as completed
    simulationData.value.completedQuests = simulationData.value.completedQuests || []
    simulationData.value.completedQuests.push({
      id: currentNPC.value.id,
      reward: examResults.finalReward,
      passed: true
    })
  } else {
    npcLogs.push(t('day.examFailed'))
    npcLogs.push(t('day.skillsBelowTarget', { count: 3 - examResults.passedSkills }))
    npcLogs.push(t('day.needMoreTime'))
    if (examResults.examAttempt > 1) {
      npcLogs.push(t('day.rewardReduced', { 
        original: examResults.originalReward, 
        final: examResults.finalReward, 
        percent: Math.round((1 - examResults.finalReward / examResults.originalReward) * 100) 
      }))
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
      // Exam passed - mark this NPC as passed
      if (!simulationData.value.npcCurrentDays) {
        simulationData.value.npcCurrentDays = {}
      }
      if (!simulationData.value.npcPassStatus) {
        simulationData.value.npcPassStatus = {}
      }
      simulationData.value.npcCurrentDays[currentNPC.value.id] = -1 // -1 means completed
      simulationData.value.npcPassStatus[currentNPC.value.id] = true // Mark as passed
      
      // Save to schedule state
      const stateData = {
        selectedNPCs: simulationData.value.selectedNPCs,
        npcSchedules: simulationData.value.npcSchedules,
        npcCurrentAbilities: simulationData.value.npcCurrentAbilities,
        npcCurrentDays: simulationData.value.npcCurrentDays,
        npcPassStatus: simulationData.value.npcPassStatus,
        completedQuestIds: simulationData.value.completedQuestIds || [],
        extendedDays: simulationData.value.extendedDays,
      }
      
      // Add current NPC id to completed quests if not already there
      if (!stateData.completedQuestIds.includes(currentNPC.value.id)) {
        stateData.completedQuestIds.push(currentNPC.value.id)
      }
      
      sessionStorage.setItem('scheduleState', JSON.stringify(stateData))
      sessionStorage.setItem('simulationData', JSON.stringify(simulationData.value))
      
      // Always return to schedule for continuous gameplay
      router.push('/time-management/schedule')
    } else if (examResults) {
      // Exam failed - extend days and return to schedule
      const originalRequired = currentNPC.value.requiredDays
      const npcId = currentNPC.value.id
      
      // Continue from day after exam (e.g., if exam was day 6, continue from day 7)
      if (!simulationData.value.npcCurrentDays) {
        simulationData.value.npcCurrentDays = {}
      }
      simulationData.value.npcCurrentDays[npcId] = originalRequired + 1
      simulationData.value.examAttempt = (simulationData.value.examAttempt || 1) + 1
      
      // Extend days by 5 more training days (e.g., 5 days + 1 exam day + 5 more days = 11 total, exam on day 12)
      simulationData.value.extendedDays = simulationData.value.extendedDays || {}
      simulationData.value.extendedDays[npcId] = originalRequired + 1 + 5
      
      sessionStorage.setItem('simulationData', JSON.stringify(simulationData.value))
      
      router.push('/time-management/schedule')
    }
  } else {
    // Regular learning day - increment all NPCs' days and go to next day
    if (!simulationData.value.npcCurrentDays) {
      simulationData.value.npcCurrentDays = {}
    }
    simulationData.value.selectedNPCs.forEach(npc => {
      if (simulationData.value.npcCurrentDays[npc.id] !== -1) { // Skip completed NPCs
        simulationData.value.npcCurrentDays[npc.id] = (simulationData.value.npcCurrentDays[npc.id] || 0) + 1
      }
    })
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
    <header class="simulation-header" :style="{ backgroundImage: `url(${headerBackgroundImage})` }">
      <div class="header-overlay"></div>
      <div class="header-content">
        <img v-if="headerCharacterImage" :src="headerCharacterImage" class="header-character" alt="Character">
      </div>
    </header>
    <div class="header-info">
      <strong v-if="selectedNPC || currentNPC">
        {{ headerTitle }}
      </strong>
      <div v-if="isSimulationRunning" class="simulation-status">
        <span class="status-indicator running">⏳</span>
        <span>{{ $t('day.simulationRunning') }}</span>
      </div>
      <div v-else-if="simulationComplete" class="simulation-status">
        <span class="status-indicator complete">✅</span>
        <span>{{ $t('day.simulationComplete') }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

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
          <span class="status-label">⚡ {{ $t('day.energy') }}</span>
          <div class="bar">
            <div class="fill" :style="{ width: selectedAbilities?.energy || 0 + '%', backgroundColor: selectedAbilities?.energy > 50 ? '#2ecc71' : selectedAbilities?.energy > 25 ? '#f39c12' : '#e74c3c' }"></div>
          </div>
          <span class="status-value">{{ selectedAbilities?.energy || 0 }}/100</span>
        </div>
        <div class="status-item mood-bar">
          <span class="status-label">😊 {{ $t('day.mood') }}</span>
          <div class="bar">
            <div class="fill" :style="{ width: selectedAbilities?.mood || 0 + '%', backgroundColor: selectedAbilities?.mood > 50 ? '#3498db' : selectedAbilities?.mood > 25 ? '#f39c12' : '#e74c3c' }"></div>
          </div>
          <span class="status-value">{{ selectedAbilities?.mood || 0 }}/100</span>
        </div>
      </div>

      <!-- Combined Content -->
      <div class="combined-content">
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
          <h2>📊 {{ selectedNPC?.name }} {{ $t('day.currentAbilities') }}</h2>
          <div class="abilities-grid">
            <div class="ability-card">
              <div class="ability-name">📚 {{ $t('day.coding') }}</div>
              <div class="ability-bar">
                <div class="ability-fill" :style="{ width: (selectedAbilities?.coding / 100 * 100) + '%' }"></div>
              </div>
              <div class="ability-value">{{ selectedAbilities?.coding || 0 }} / {{ selectedNPC?.goals?.coding || 0 }}</div>
            </div>
            <div class="ability-card">
              <div class="ability-name">🔢 {{ $t('day.math') }}</div>
              <div class="ability-bar">
                <div class="ability-fill" :style="{ width: (selectedAbilities?.math / 100 * 100) + '%' }"></div>
              </div>
              <div class="ability-value">{{ selectedAbilities?.math || 0 }} / {{ selectedNPC?.goals?.math || 0 }}</div>
            </div>
            <div class="ability-card">
              <div class="ability-name">💪 {{ $t('day.body') }}</div>
              <div class="ability-bar">
                <div class="ability-fill" :style="{ width: (selectedAbilities?.fitness / 100 * 100) + '%' }"></div>
              </div>
              <div class="ability-value">{{ selectedAbilities?.fitness || 0 }} / {{ selectedNPC?.goals?.fitness || 0 }}</div>
            </div>
            <div class="ability-card">
              <div class="ability-name">😊 {{ $t('day.mood') }}</div>
              <div class="ability-bar">
                <div class="ability-fill" :style="{ width: (selectedAbilities?.mood || 0) + '%' }"></div>
              </div>
              <div class="ability-value">{{ selectedAbilities?.mood || 0 }}/100</div>
            </div>
            <div class="ability-card">
              <div class="ability-name">⚡ {{ $t('day.energy') }}</div>
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
        {{ $t('day.simulatingAllStudents') }}
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
  background-size: cover;
  background-position: center;
  color: white;
  padding: 0;
  position: relative;
  height: 250px;
  display: flex;
  align-items: stretch;
}

.header-overlay {
  display: none;
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 100%;
}

.header-character {
  width: auto;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  flex-shrink: 0;
}

.header-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 0.85rem;
}

.header-info strong {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1;
  white-space: nowrap;
  font-weight: 600;
}

.simulation-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-indicator {
  font-size: 1rem;
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
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
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
  grid-template-columns: repeat(2, 1fr);
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

/* Responsive Design for Mobile */
@media screen and (max-width: 768px) {
  .header-info {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .header-info strong {
    width: 100%;
    font-size: 0.85rem;
  }
  
  .simulation-status {
    font-size: 0.8rem;
  }
  
  .progress-bar {
    width: 100%;
  }
  
  .status-bar {
    gap: 0.8rem;
    padding: 0.8rem;
  }
  
  .status-item {
    gap: 0.6rem;
  }
  
  .status-label {
    min-width: 50px;
    font-size: 0.95rem;
  }
  
  .status-value {
    font-size: 0.95rem;
  }
}

@media screen and (max-width: 480px) {
  .simulation-header {
    height: 200px;
  }
  
  .header-info {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }
  
  .header-info strong {
    font-size: 0.8rem;
  }
  
  .simulation-status {
    font-size: 0.75rem;
  }
  
  .status-bar {
    padding: 0.6rem;
    gap: 0.6rem;
  }
  
  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }
  
  .status-label {
    min-width: auto;
    font-size: 0.85rem;
  }
  
  .status-item .bar {
    width: 100%;
    height: 16px;
  }
  
  .status-value {
    font-size: 0.85rem;
  }
  
  .npc-tabs {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
  
  .npc-tab {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
