<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const startNewSemester = () => {
  router.push('/intake')
}

const loadProgress = () => {
  alert('進度載入功能 - 即將推出')
}

const showTutorial = () => {
  alert('教學功能 - 即將推出')
}

const goToSettings = () => {
  router.push('/settings')
}
</script>

<template>
  <div class="home-view">
    <div class="settings-button">
      <button @click="goToSettings" class="btn-settings" :title="$t('common.settings')">
        ⚙️
      </button>
    </div>

    <div class="container">
      <h1>{{ $t('home.title') }}</h1>
      <p class="subtitle">{{ $t('home.subtitle') }}</p>

      <div class="button-group">
        <button @click="startNewSemester" class="btn btn-primary">
          {{ $t('home.startNewSemester') }}
        </button>
        <button @click="loadProgress" class="btn btn-secondary">
          {{ $t('home.loadProgress') }}
        </button>
        <button @click="showTutorial" class="btn btn-secondary">
          {{ $t('home.tutorial') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.settings-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
}

.btn-settings {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: white;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-settings:hover {
  transform: scale(1.1) rotate(20deg);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.container {
  text-align: center;
  background: white;
  padding: 3rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

h1 {
  font-size: 3rem;
  margin: 0 0 0.5rem 0;
  color: #667eea;
}

.subtitle {
  font-size: 1.2rem;
  color: #666;
  margin: 0 0 2rem 0;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 1rem 2rem;
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
  min-width: 200px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  min-width: 200px;
}

.btn-secondary:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .container {
    padding: 2rem 1rem;
  }

  h1 {
    font-size: 2rem;
  }

  .btn-settings {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
}
</style>
