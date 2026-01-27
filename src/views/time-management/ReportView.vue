<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// 示例成績數據
const studentResults = ref([
  {
    name: 'Alice',
    goals: { coding: 50, math: 30, fitness: 20 },
    actual: { coding: 48, math: 32, fitness: 18 },
    mood: 85,
    passed: true,
  },
])

// 計算是否通過
const isPassed = (student) => {
  const codingPass = student.actual.coding >= student.goals.coding * 0.8
  const mathPass = student.actual.math >= student.goals.math * 0.8
  const fitnessPass = student.actual.fitness >= student.goals.fitness * 0.8
  return codingPass && mathPass && fitnessPass && student.mood > 50
}

// 計算進度百分比
const getProgress = (actual, goal) => {
  return Math.min((actual / goal) * 100, 100)
}

// 開始下一學期
const nextSemester = () => {
  // 清除遊戲數據，開始新學期
  sessionStorage.removeItem('simulationData')
  sessionStorage.removeItem('selectedNPCs')
  router.push('/time-management/intake')
}

// 返回首頁
const goHome = () => {
  // 清除遊戲數據
  sessionStorage.removeItem('simulationData')
  sessionStorage.removeItem('selectedNPCs')
  router.push('/')
}
</script>

<template>
  <div class="report-view">
    <header class="report-header">
      <h1>{{ $t('report.title') }}</h1>
      <p>{{ $t('report.subtitle') }}</p>
    </header>

    <div class="report-container">
      <!-- 學生成績 -->
      <div class="results-section">
        <h2>{{ $t('report.studentGrades') }}</h2>
        <div class="results-list">
          <div v-for="student in studentResults" :key="student.name" class="student-result">
            <div class="result-header">
              <h3>{{ student.name }}</h3>
              <div :class="{ 'pass-badge': isPassed(student), 'fail-badge': !isPassed(student) }">
                {{ isPassed(student) ? $t('report.pass') : $t('report.fail') }}
              </div>
            </div>

            <div class="result-body">
              <!-- 能力對比 -->
              <div class="abilities-section">
                <h4>{{ $t('report.abilityGrowth') }}</h4>
                <div class="ability-item">
                  <span>Coding</span>
                  <div class="ability-compare">
                    <span class="goal">{{ $t('report.target') }}: {{ student.goals.coding }}</span>
                    <span class="actual">{{ $t('report.actual') }}: {{ student.actual.coding }}</span>
                  </div>
                  <div class="progress-bar">
                    <div
                      class="progress"
                      :style="{ width: getProgress(student.actual.coding, student.goals.coding) + '%' }"
                    ></div>
                  </div>
                </div>

                <div class="ability-item">
                  <span>Math</span>
                  <div class="ability-compare">
                    <span class="goal">{{ $t('report.target') }}: {{ student.goals.math }}</span>
                    <span class="actual">{{ $t('report.actual') }}: {{ student.actual.math }}</span>
                  </div>
                  <div class="progress-bar">
                    <div
                      class="progress"
                      :style="{ width: getProgress(student.actual.math, student.goals.math) + '%' }"
                    ></div>
                  </div>
                </div>

                <div class="ability-item">
                  <span>Fitness</span>
                  <div class="ability-compare">
                    <span class="goal">{{ $t('report.target') }}: {{ student.goals.fitness }}</span>
                    <span class="actual">{{ $t('report.actual') }}: {{ student.actual.fitness }}</span>
                  </div>
                  <div class="progress-bar">
                    <div
                      class="progress"
                      :style="{ width: getProgress(student.actual.fitness, student.goals.fitness) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- 其他指標 -->
              <div class="mood-section">
                <h4>{{ $t('report.statusIndicator') }}</h4>
                <div class="mood-item">
                  <span>{{ $t('report.mood') }}</span>
                  <div class="mood-bar">
                    <div class="mood-fill" :style="{ width: student.mood + '%' }"></div>
                  </div>
                  <span class="mood-text">{{ student.mood }}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Master 成就 -->
      <div class="master-section">
        <h2>{{ $t('report.masterAchievement') }}</h2>
        <div class="achievement-card">
          <div class="achievement-title">{{ $t('report.thisSemester') }}</div>
          <div class="achievement-stats">
            <div class="stat">
              <div class="stat-value">1</div>
              <div class="stat-label">{{ $t('report.student') }}</div>
            </div>
            <div class="stat">
              <div class="stat-value">1</div>
              <div class="stat-label">{{ $t('report.passed') }}</div>
            </div>
            <div class="stat">
              <div class="stat-value">0</div>
              <div class="stat-label">{{ $t('report.failed') }}</div>
            </div>
          </div>
        </div>

        <div class="reputation-card">
          <div class="reputation-title">{{ $t('report.masterReputation') }}</div>
          <div class="reputation-bar">
            <div class="reputation-fill" style="width: 35%"></div>
          </div>
          <div class="reputation-text">35/100 - {{ $t('report.student') }} Master</div>
          <p class="reputation-desc">{{ $t('report.nextCanRecruit') }}: 2 {{ $t('report.students') }}</p>
        </div>
      </div>
    </div>

    <!-- 底部按鈕 -->
    <div class="action-buttons">
      <button @click="goHome" class="btn btn-secondary">
        {{ $t('report.goHome') }}
      </button>
      <button @click="nextSemester" class="btn btn-primary">
        {{ $t('report.startNextSemester') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.report-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

.report-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.report-header h1 {
  margin: 0 0 0.5rem 0;
}

.report-header p {
  margin: 0;
  opacity: 0.9;
}

.report-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  padding: 1rem;
  flex: 1;
}

/* 左側：學生成績 */
.results-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.results-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.student-result {
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9f9f9;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

.result-header h3 {
  margin: 0;
  color: #667eea;
}

.pass-badge {
  background: #2ecc71;
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 0.3rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.fail-badge {
  background: #e74c3c;
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 0.3rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.result-body {
  padding: 1rem;
}

.abilities-section h4,
.mood-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #333;
}

.ability-item {
  margin-bottom: 1rem;
}

.ability-item span:first-child {
  display: block;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.ability-compare {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}

.goal {
  color: #666;
}

.actual {
  color: #667eea;
  font-weight: 600;
}

.progress-bar {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.mood-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.mood-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mood-item span:first-child {
  flex: 0 0 50px;
  font-weight: 600;
}

.mood-bar {
  flex: 1;
  height: 24px;
  background: #eee;
  border-radius: 12px;
  overflow: hidden;
}

.mood-fill {
  height: 100%;
  background: linear-gradient(90deg, #f39c12 0%, #e74c3c 100%);
}

.mood-text {
  flex: 0 0 70px;
  text-align: right;
  font-weight: 600;
}

/* 右側：Master 成就 */
.master-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.master-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.achievement-card {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.achievement-title {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 1rem;
}

.achievement-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
}

.reputation-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.reputation-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
}

.reputation-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.8rem;
}

.reputation-fill {
  height: 100%;
  background: white;
  transition: width 0.3s ease;
}

.reputation-text {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.reputation-desc {
  font-size: 0.85rem;
  opacity: 0.9;
  margin: 0;
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

@media (max-width: 1024px) {
  .report-container {
    grid-template-columns: 1fr;
  }
}
</style>
