<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NPCQuests, getAvailableQuests, calculateMasterLevel } from '../../data/quests'

const router = useRouter()
const { t } = useI18n()

// 遊戲進度（可從 store 或 localStorage 獲取）
const completedQuests = ref([
  1 // 示例：已完成第一個任務
])

// 計算可選的最大 NPC 數量
const maxSelectableNPCs = computed(() => {
  // 第一局只能選 1 個，完成 1 個後可以選 2 個，以此類推
  return Math.min(completedQuests.value.length + 1, 3)
})

// 獲取可用的任務卡
const availableQuests = computed(() => {
  const masterLevel = calculateMasterLevel(completedQuests.value.length)
  return getAvailableQuests(masterLevel, completedQuests.value.length)
})

// 已選擇的 NPC
const selectedNPCs = ref([])

// 選擇/取消 NPC
const toggleNPC = (quest) => {
  const index = selectedNPCs.value.findIndex(q => q.id === quest.id)
  if (index > -1) {
    selectedNPCs.value.splice(index, 1)
  } else {
    // 如果已達到最大可選數量，提示
    if (selectedNPCs.value.length >= maxSelectableNPCs.value) {
      alert(`${t('intake.canSelectMax')} ${maxSelectableNPCs.value} ${t('intake.npcCards')}`)
      return
    }
    selectedNPCs.value.push(quest)
  }
}

// 檢查 NPC 是否被選擇
const isSelected = (quest) => {
  return selectedNPCs.value.some(q => q.id === quest.id)
}

// 開始規劃時間表
const proceedToSchedule = () => {
  if (selectedNPCs.value.length === 0) {
    alert(t('intake.selectAtLeastOne'))
    return
  }
  // 將選中的 NPC 保存到 sessionStorage
  sessionStorage.setItem('selectedNPCs', JSON.stringify(selectedNPCs.value))
  router.push('/time-management/schedule')
}

// 返回首頁
const goHome = () => {
  // 清除選中的 NPC 資料
  sessionStorage.removeItem('selectedNPCs')
  router.push('/')
}
</script>

<template>
  <div class="intake-view">
    <header class="intake-header">
      <h1>{{ $t('intake.questSelection') }}</h1>
      <p>{{ $t('intake.selectNPCCards', { max: maxSelectableNPCs }) }}</p>
      <div class="progress-info">
        <span>{{ $t('intake.masterLevel') }}: {{ calculateMasterLevel(completedQuests.length) }}</span>
        <span>{{ $t('intake.completedQuests') }}: {{ completedQuests.length }}</span>
      </div>
    </header>

    <div class="intake-container">
      <!-- NPC 任務卡列表 -->
      <div class="quests-panel">
        <h2>{{ $t('intake.availableNPCCards') }}</h2>
        <div class="quests-grid">
          <div
            v-for="quest in availableQuests"
            :key="quest.id"
            class="quest-card"
            :class="{ selected: isSelected(quest) }"
            @click="toggleNPC(quest)"
          >
            <div class="quest-image">{{ quest.image }}</div>
            <div class="quest-name">{{ quest.name }}</div>
            <div class="quest-character">{{ quest.character }}</div>
            <div class="quest-difficulty" :class="'difficulty-' + quest.difficulty.toLowerCase()">
              {{ quest.difficulty }}
            </div>
            <div class="quest-description">{{ quest.description }}</div>
            <div class="quest-goals">
              <div class="goal-item">
                <span class="goal-label">{{ $t('intake.coding') }}</span>
                <span class="goal-value">{{ quest.goals.coding }}</span>
              </div>
              <div class="goal-item">
                <span class="goal-label">{{ $t('intake.math') }}</span>
                <span class="goal-value">{{ quest.goals.math }}</span>
              </div>
              <div class="goal-item">
                <span class="goal-label">{{ $t('intake.fitness') }}</span>
                <span class="goal-value">{{ quest.goals.fitness }}</span>
              </div>
            </div>
            <div class="quest-reward">
              <span>💰 +{{ quest.rewards.masterReputation }}</span>
            </div>
          </div>
        </div>
        <div v-if="availableQuests.length === 0" class="no-quests">
          {{ $t('intake.noAvailableQuests') }}
        </div>
      </div>

      <!-- 右側：已選擇的 NPC -->
      <div class="selected-panel">
        <h2>{{ $t('intake.selectedNPCs') }} ({{ selectedNPCs.length }}/{{ maxSelectableNPCs }})</h2>
        <div v-if="selectedNPCs.length === 0" class="no-selection">
          <p>{{ $t('intake.selectNPCToStart') }}</p>
        </div>
        <div v-else class="selected-list">
          <div v-for="npc in selectedNPCs" :key="npc.id" class="selected-item">
            <div class="selected-image">{{ npc.image }}</div>
            <div class="selected-info">
              <h4>{{ npc.name }}</h4>
              <p>{{ npc.character }}</p>
              <div class="selected-goals">
                <span>{{ $t('intake.coding') }}: {{ npc.goals.coding }}</span>
                <span>{{ $t('intake.math') }}: {{ npc.goals.math }}</span>
                <span>{{ $t('intake.fitness') }}: {{ npc.goals.fitness }}</span>
              </div>
            </div>
            <button class="remove-btn" @click="toggleNPC(npc)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按鈕 -->
    <div class="action-buttons">
      <button @click="goHome" class="btn btn-secondary">
        {{ $t('intake.goHome') }}
      </button>
      <button @click="proceedToSchedule" class="btn btn-primary">
        {{ $t('intake.proceedToSchedule') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.intake-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

.intake-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.intake-header h1 {
  margin: 0 0 0.5rem 0;
}

.intake-header p {
  margin: 0 0 1rem 0;
  opacity: 0.9;
}

.progress-info {
  display: flex;
  gap: 2rem;
  justify-content: center;
  font-size: 0.95rem;
  opacity: 0.95;
}

.intake-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  flex: 1;
  overflow: hidden;
}

/* NPC 任務卡面板 */
.quests-panel {
  background: white;
  border-radius: 0.8rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.quests-panel h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.quests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.quest-card {
  border: 2px solid #ddd;
  border-radius: 0.8rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  position: relative;
}

.quest-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.quest-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f0ff 0%, #e8e8ff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.quest-card.selected::after {
  content: '✓';
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.quest-image {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.quest-name {
  font-weight: 700;
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 0.3rem;
}

.quest-character {
  font-size: 0.85rem;
  color: #666;
  text-align: center;
  margin-bottom: 0.5rem;
}

.quest-difficulty {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  margin: 0 auto 0.5rem;
  width: fit-content;
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

.quest-description {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.8rem;
  text-align: center;
}

.quest-goals {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
  padding: 0.8rem;
  background: #f9f9f9;
  border-radius: 0.4rem;
}

.goal-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.goal-label {
  font-weight: 600;
  color: #333;
}

.goal-value {
  color: #667eea;
  font-weight: 700;
}

.quest-reward {
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: #f39c12;
}

.no-quests {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  color: #999;
}

/* 已選擇 NPC 面板 */
.selected-panel {
  background: white;
  border-radius: 0.8rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.selected-panel h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #667eea;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: #999;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  flex: 1;
}

.selected-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 0.5rem;
  border-left: 4px solid #667eea;
  position: relative;
}

.selected-image {
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
}

.selected-info {
  flex: 1;
}

.selected-info h4 {
  margin: 0 0 0.3rem 0;
}

.selected-info p {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.selected-goals {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.8rem;
  color: #666;
}

.remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border: none;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #ee5a52;
  transform: scale(1.1);
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
  .intake-container {
    grid-template-columns: 1fr;
  }
}
</style>

<style scoped>
.intake-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.intake-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.intake-header h1 {
  margin: 0 0 0.5rem 0;
}

.intake-header p {
  margin: 0;
  opacity: 0.9;
}

.intake-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1rem;
  padding: 1rem;
}

/* 左側：學生列表 */
.students-panel {
  flex: 0 0 350px;
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.students-panel h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.student-card {
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.student-card:hover {
  border-color: #667eea;
  background: #f9f9f9;
}

.student-card.selected {
  border-color: #667eea;
  background: #f0f0ff;
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
}

.student-name {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.student-info {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.student-abilities {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.ability {
  background: #f0f0f0;
  padding: 0.3rem 0.5rem;
  border-radius: 0.3rem;
  text-align: center;
}

/* 右側：目標設定 */
.goals-panel {
  flex: 1;
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.goals-panel h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 1.1rem;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.goal-section h3 {
  margin: 0 0 1rem 0;
  color: #667eea;
}

.goal-inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.goal-input {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.goal-input label {
  font-weight: 600;
  font-size: 0.9rem;
}

.goal-input input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.3rem;
  font-size: 1rem;
}

.goal-input input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
}

.points {
  font-size: 0.85rem;
  color: #666;
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
