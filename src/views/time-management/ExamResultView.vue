<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// Exam data from sessionStorage
const examData = ref(null)
const simulationData = ref(null)

// Exam result details
const skillResults = ref([])
const overallPassed = ref(false)
const passedSkills = ref(0)
const totalSkills = ref(3) // coding, math, fitness
const currentAttempt = ref(1)
const currentNPC = ref(null)
const originalReward = ref(0)
const finalReward = ref(0)

onMounted(() => {
  const examDataStr = sessionStorage.getItem('examData')
  const simDataStr = sessionStorage.getItem('simulationData')
  
  if (examDataStr) {
    examData.value = JSON.parse(examDataStr)
    simulationData.value = JSON.parse(simDataStr)
    
    // Extract exam details
    currentNPC.value = examData.value.currentNPC
    currentAttempt.value = examData.value.examAttempt || 1
    skillResults.value = examData.value.skillResults || []
    overallPassed.value = examData.value.passed || false
    passedSkills.value = examData.value.passedSkills || 0
    originalReward.value = examData.value.originalReward || 0
    finalReward.value = examData.value.finalReward || 0
  } else {
    router.push('/time-management/schedule')
  }
})

// Calculate pass percentage
const passPercentage = computed(() => {
  return Math.round((passedSkills.value / totalSkills.value) * 100)
})

// Retry exam - go back to schedule with extended days
const retryExam = () => {
  if (simulationData.value && examData.value && currentNPC.value) {
    // Extend days by 5 more (e.g., from 5 to 10)
    const originalRequired = examData.value.requiredDays
    const npcId = currentNPC.value.id
    
    // Update simulationData
    simulationData.value.currentDay = originalRequired
    simulationData.value.examAttempt = (simulationData.value.examAttempt || 1) + 1
    
    // Update the NPC's requiredDays temporarily (stored in npcRequiredDays)
    simulationData.value.extendedDays = simulationData.value.extendedDays || {}
    simulationData.value.extendedDays[npcId] = originalRequired + 5
    
    sessionStorage.setItem('simulationData', JSON.stringify(simulationData.value))
    sessionStorage.removeItem('examData')
    
    router.push('/time-management/schedule')
  }
}

// Continue to next student or report
const continueToNext = () => {
  if (simulationData.value && examData.value) {
    // Move to next NPC or report
    simulationData.value.currentNPCIndex = (simulationData.value.currentNPCIndex || 0) + 1
    simulationData.value.currentDay = 0
    simulationData.value.examAttempt = 1 // Reset for new student
    
    // Update rewards in quest data
    if (examData.value.questIndex >= 0) {
      simulationData.value.completedQuests = simulationData.value.completedQuests || []
      simulationData.value.completedQuests.push({
        id: currentNPC.value.id,
        reward: finalReward.value,
        passed: overallPassed.value
      })
    }
    
    sessionStorage.setItem('simulationData', JSON.stringify(simulationData.value))
    sessionStorage.removeItem('examData')
    
    // Check if there are more NPCs
    if (simulationData.value.currentNPCIndex < simulationData.value.selectedNPCs.length) {
      router.push('/time-management/schedule')
    } else {
      router.push('/time-management/report')
    }
  }
}

// Determine color for skill result
const getSkillColor = (skill) => {
  if (skill.passed) {
    return '#2ecc71' // green
  } else {
    return '#e74c3c' // red
  }
}

// Determine status text
const getStatusText = (skill) => {
  if (skill.passed) {
    return t('exam.pass')
  } else {
    return t('exam.fail')
  }
}
</script>

<template>
  <div class="exam-result-view">
    <header class="exam-header">
      <h1>{{ $t('exam.title') }}</h1>
      <p v-if="currentNPC" class="exam-subtitle">{{ currentNPC.name }} - {{ $t('exam.attempt') }} #{{ currentAttempt }}</p>
    </header>

    <div v-if="examData" class="exam-container">
      <!-- Overall Result Card -->
      <div class="result-card" :class="{ passed: overallPassed, failed: !overallPassed }">
        <h2>{{ $t('exam.overallResult') }}</h2>
        <div class="overall-status">
          <div class="status-icon">{{ overallPassed ? '✓' : '✗' }}</div>
          <div class="status-text">{{ overallPassed ? $t('exam.passed') : $t('exam.failed') }}</div>
        </div>
        <div class="pass-rate-section">
          <div class="pass-rate">
            <span class="rate-label">{{ $t('exam.passRate') }}</span>
            <span class="rate-value">{{ passedSkills }} / {{ totalSkills }}</span>
            <span class="rate-percentage">({{ passPercentage }}%)</span>
          </div>
        </div>
        <p v-if="!overallPassed" class="failure-note">
          {{ totalSkills - passedSkills }} {{ $t('exam.skillsFailed') }}
        </p>
        <p class="exam-desc">{{ $t('exam.examDescription') }}</p>
      </div>

      <!-- Skill Breakdown -->
      <div class="skills-section">
        <h2>{{ $t('exam.skillBreakdown') }}</h2>
        <div class="skills-grid">
          <div v-for="skill in skillResults" :key="skill.name" class="skill-card" :style="{ borderColor: getSkillColor(skill) }">
            <div class="skill-header">
              <h3 class="skill-name">{{ skill.emoji }} {{ skill.name }}</h3>
              <span class="skill-status" :style="{ backgroundColor: getSkillColor(skill) }">{{ getStatusText(skill) }}</span>
            </div>
            
            <div class="skill-details">
              <div class="detail-row">
                <span class="detail-label">{{ $t('exam.currentLevel') }}</span>
                <span class="detail-value">{{ skill.current }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">{{ $t('exam.goalLevel') }}</span>
                <span class="detail-value">{{ skill.goal }}</span>
              </div>
            </div>

            <div class="progress-section">
              <div class="progress-label">{{ $t('exam.progress') }}: {{ skill.percentage }}%</div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: Math.min(skill.percentage, 100) + '%', backgroundColor: getSkillColor(skill) }"></div>
              </div>
            </div>

            <div v-if="!skill.passed && skill.percentage > 0 && skill.percentage < 100" class="random-chance">
              <span class="chance-label">{{ $t('exam.randomChance') }}</span>
              <span class="chance-value">{{ skill.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Reward Section -->
      <div class="reward-section">
        <h2>{{ $t('exam.examScore') }}</h2>
        <div class="reward-card">
          <div class="reward-row">
            <span class="reward-label">{{ $t('exam.originalReward') }}</span>
            <span class="reward-value original">{{ originalReward }} Reputation</span>
          </div>
          <div v-if="currentAttempt > 1" class="reward-row">
            <span class="reward-label">{{ $t('exam.rewardReduction') }}</span>
            <span class="reward-reduction">-{{ ((originalReward - finalReward) / originalReward * 100).toFixed(0) }}%</span>
          </div>
          <div class="reward-row final">
            <span class="reward-label">{{ $t('exam.rewardAfterDeduction') }}</span>
            <span class="reward-value final">{{ finalReward }} Reputation</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button v-if="!overallPassed" @click="retryExam" class="btn btn-retry">
        {{ $t('exam.retryExam') }}
      </button>
      <button @click="continueToNext" :class="['btn', 'btn-next', { 'btn-primary': overallPassed }]">
        {{ $t('exam.nextStudent') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.exam-result-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.exam-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 1.5rem;
  text-align: center;
}

.exam-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.exam-subtitle {
  margin: 0;
  font-size: 1rem;
  opacity: 0.9;
}

.exam-container {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Overall Result Card */
.result-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left: 6px solid #667eea;
}

.result-card.passed {
  border-left-color: #2ecc71;
  background: linear-gradient(135deg, #f0fff4 0%, #ffffff 100%);
}

.result-card.failed {
  border-left-color: #e74c3c;
  background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
}

.result-card h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.3rem;
  color: #333;
}

.overall-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.status-icon {
  font-size: 3rem;
  font-weight: bold;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f0f0;
  color: #667eea;
}

.result-card.passed .status-icon {
  background: #d4edda;
  color: #2ecc71;
}

.result-card.failed .status-icon {
  background: #f8d7da;
  color: #e74c3c;
}

.status-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.pass-rate-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 0.5rem;
}

.pass-rate {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.rate-label {
  color: #666;
}

.rate-value {
  color: #667eea;
  font-size: 1.3rem;
}

.rate-percentage {
  color: #999;
  font-size: 1rem;
}

.failure-note {
  margin: 1rem 0 0 0;
  color: #e74c3c;
  font-weight: 500;
  font-size: 0.95rem;
}

.exam-desc {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
}

/* Skills Section */
.skills-section {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.skills-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.3rem;
  color: #333;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.skill-card {
  background: #f9f9f9;
  border: 2px solid #e8e8f0;
  border-left: 6px solid #667eea;
  border-radius: 0.8rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.skill-card:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.skill-name {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.skill-status {
  padding: 0.4rem 0.8rem;
  border-radius: 0.4rem;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
}

.skill-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 0.4rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail-label {
  font-size: 0.8rem;
  color: #999;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.detail-value {
  font-size: 1.3rem;
  font-weight: 600;
  color: #667eea;
}

.progress-section {
  margin-bottom: 0.8rem;
}

.progress-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 10px;
  background: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.random-chance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.9rem;
}

.chance-label {
  color: #999;
}

.chance-value {
  color: #f39c12;
  font-weight: 600;
}

/* Reward Section */
.reward-section {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reward-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.3rem;
  color: #333;
}

.reward-card {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  border-radius: 0.8rem;
  padding: 1.5rem;
  color: white;
}

.reward-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.reward-row.final {
  border-bottom: none;
  border-top: 2px solid rgba(255, 255, 255, 0.3);
  padding-top: 1rem;
  margin-top: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.reward-label {
  font-weight: 500;
  font-size: 0.95rem;
}

.reward-value {
  font-weight: 600;
  font-size: 1.1rem;
}

.reward-value.original {
  text-decoration: line-through;
  opacity: 0.7;
}

.reward-value.final {
  font-size: 1.3rem;
}

.reward-reduction {
  color: #ffcccc;
  font-weight: 600;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: white;
  border-top: 1px solid #ddd;
  justify-content: center;
}

.btn {
  padding: 0.9rem 1.8rem;
  font-size: 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-retry {
  background: #f39c12;
  color: white;
}

.btn-retry:hover {
  background: #e67e22;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(243, 156, 18, 0.4);
}

.btn-next {
  background: #95a5a6;
  color: white;
}

.btn-next.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-next:hover,
.btn-next.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}
</style>
