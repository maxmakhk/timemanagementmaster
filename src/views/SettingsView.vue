<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setLocale, getLocale } from '../i18n/index'

const router = useRouter()
const { t } = useI18n()

const selectedLanguage = ref(getLocale())
const saveMessage = ref('')

// 保存語言設置
const saveSettings = () => {
  setLocale(selectedLanguage.value)
  saveMessage.value = t('settings.languageChanged')
  setTimeout(() => {
    saveMessage.value = ''
  }, 2000)
}

// Clear all game data
const clearAllData = () => {
  if (confirm('Clear all game progress and data? This cannot be undone!')) {
    sessionStorage.clear()
    localStorage.clear()
    saveMessage.value = 'All data cleared! Redirecting to home...'
    setTimeout(() => {
      router.push('/')
      window.location.reload()
    }, 1500)
  }
}

// Export game data
const exportData = () => {
  const data = {
    scheduleState: sessionStorage.getItem('scheduleState'),
    simulationData: sessionStorage.getItem('simulationData'),
    exportDate: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `time-management-save-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  saveMessage.value = 'Game data exported!'
  setTimeout(() => {
    saveMessage.value = ''
  }, 2000)
}

// 取消
const cancel = () => {
  selectedLanguage.value = getLocale()
  router.push('/')
}

// 返回
const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="settings-view">
    <header class="settings-header">
      <h1>{{ $t('settings.title') }}</h1>
    </header>

    <div class="settings-container">
      <div class="settings-card">
        <h2>{{ $t('settings.languageSettings') }}</h2>
        <p class="description">{{ $t('settings.selectLanguage') }}</p>

        <div class="language-options">
          <label class="language-option">
            <input
              v-model="selectedLanguage"
              type="radio"
              value="zh"
              name="language"
            />
            <span class="radio-circle"></span>
            <span class="language-label">{{ $t('common.chinese') }} (繁體中文)</span>
          </label>

          <label class="language-option">
            <input
              v-model="selectedLanguage"
              type="radio"
              value="en"
              name="language"
            />
            <span class="radio-circle"></span>
            <span class="language-label">{{ $t('common.english') }} (English)</span>
          </label>
        </div>

        <!-- 保存提示 -->
        <div v-if="saveMessage" class="save-message">
          {{ saveMessage }}
        </div>

        <!-- 按鈕 -->
        <div class="button-group">
          <button @click="cancel" class="btn btn-secondary">
            {{ $t('common.cancel') }}
          </button>
          <button @click="saveSettings" class="btn btn-primary">
            {{ $t('common.save') }}
          </button>
        </div>
      </div>

      <!-- Game Data Management -->
      <div class="settings-card">
        <h2>🎮 Game Data Management</h2>
        <p class="description">Manage your game progress and data</p>

        <div class="data-actions">
          <div class="action-item">
            <div class="action-info">
              <h3>Export Save Data</h3>
              <p>Download your game progress as a backup file</p>
            </div>
            <button @click="exportData" class="btn btn-secondary">
              📥 Export
            </button>
          </div>

          <div class="action-item danger-zone">
            <div class="action-info">
              <h3>⚠️ Clear All Data</h3>
              <p>Delete all game progress and start fresh</p>
            </div>
            <button @click="clearAllData" class="btn btn-danger">
              🗑️ Clear Data
            </button>
          </div>
        </div>
      </div>

      <!-- Game Info -->
      <div class="settings-card">
        <h2>ℹ️ About</h2>
        <div class="about-content">
          <h3>Time Management Master</h3>
          <p>A mini-game collection for managing student schedules and helping them achieve learning goals.</p>
          
          <div class="game-stats">
            <div class="stat-item">
              <span class="stat-label">Version:</span>
              <span class="stat-value">1.0.0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Game Type:</span>
              <span class="stat-value">Time Management / Simulation</span>
            </div>
          </div>

          <div class="how-to-play">
            <h4>How to Play:</h4>
            <ol>
              <li>Click "Add NPC Mission" to select a quest</li>
              <li>Plan the timetable for each day</li>
              <li>Run simulation to see progress</li>
              <li>Pass the exam to complete the quest</li>
              <li>Keep adding missions for continuous gameplay!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <!-- 返回按鈕 -->
    <div class="footer-button">
      <button @click="goBack" class="btn btn-text">
        ← {{ $t('common.back') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

.settings-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 1.5rem;
  text-align: center;
}

.settings-header h1 {
  margin: 0;
  font-size: 2rem;
}

.settings-container {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.settings-card {
  background: white;
  border-radius: 0.8rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.settings-card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  color: #667eea;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 1rem;
}

.settings-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.settings-card h4 {
  margin: 1.5rem 0 0.5rem 0;
  font-size: 1rem;
  color: #667eea;
}

.description {
  color: #666;
  margin: 0.5rem 0 1.5rem 0;
  font-size: 0.95rem;
}

.language-options {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 2rem;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.language-option:hover {
  border-color: #667eea;
  background: #f9f9ff;
}

.language-option input[type='radio'] {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.language-option input[type='radio']:checked {
  border-color: #667eea;
  background: #667eea;
}

.radio-circle {
  display: inline-block;
}

.language-label {
  font-weight: 500;
  color: #333;
  flex: 1;
}

/* Data Management Styles */
.data-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 0.8rem;
  gap: 1rem;
}

.action-item.danger-zone {
  border-color: #ffe0e0;
  background: #fff5f5;
}

.action-info {
  flex: 1;
}

.action-info h3 {
  margin: 0 0 0.3rem 0;
  font-size: 1rem;
}

.action-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

/* About Section */
.about-content p {
  color: #666;
  line-height: 1.6;
  margin: 0.5rem 0;
}

.game-stats {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f9f9ff;
  border-radius: 0.5rem;
  border-left: 4px solid #667eea;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e8e8f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-weight: 600;
  color: #555;
}

.stat-value {
  color: #667eea;
  font-weight: 500;
}

.how-to-play {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 0.5rem;
}

.how-to-play ol {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

.how-to-play li {
  margin: 0.5rem 0;
  color: #666;
  line-height: 1.5;
}

.save-message {
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #c3e6cb;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.placeholder {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 0.5rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.7rem 1.5rem;
  font-size: 0.95rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e8e8e8;
  border-color: #ccc;
  transform: translateY(-2px);
}

.btn-danger {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);
}

.btn-text {
  background: none;
  color: #667eea;
  padding: 0.5rem 1rem;
  text-decoration: none;
}

.btn-text:hover {
  color: #764ba2;
}

.footer-button {
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #ddd;
  background: white;
}

@media (max-width: 640px) {
  .settings-container {
    padding: 1rem;
    grid-template-columns: 1fr;
  }

  .settings-card {
    padding: 1.5rem;
  }

  .button-group {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }

  .action-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-item .btn {
    width: 100%;
  }
}
</style>
