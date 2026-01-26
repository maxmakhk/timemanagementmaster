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

      <!-- 其他設置區域（為未來擴展預留） -->
      <div class="settings-card">
        <h2>{{ $t('common.settings') }}</h2>
        <p class="placeholder">更多設置功能即將推出...</p>
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
  max-width: 600px;
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
}
</style>
