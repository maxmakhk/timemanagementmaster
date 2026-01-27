<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// Game collection data
const games = ref([
  {
    id: 'time-management',
    name: 'Time Management Master',
    description: '時間管理遊戲 - 指導學生達成學習目標',
    icon: '📚',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    route: '/time-management/schedule',
    enabled: true
  },
  {
    id: 'coming-soon-1',
    name: 'Coming Soon',
    description: '更多迷你遊戲即將推出...',
    icon: '🎮',
    color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    route: null,
    enabled: false
  },
  {
    id: 'coming-soon-2',
    name: 'Coming Soon',
    description: '更多迷你遊戲即將推出...',
    icon: '🎯',
    color: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    route: null,
    enabled: false
  },
  {
    id: 'coming-soon-3',
    name: 'Coming Soon',
    description: '更多迷你遊戲即將推出...',
    icon: '🎪',
    color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    route: null,
    enabled: false
  }
])

const startGame = (game) => {
  if (game.enabled && game.route) {
    // Clear any previous game data for new game
    sessionStorage.removeItem('simulationData')
    sessionStorage.removeItem('selectedNPCs')
    sessionStorage.removeItem('scheduleState')
    sessionStorage.removeItem('newNPC')
    router.push(game.route)
  }
}

const loadGame = (game) => {
  if (game.enabled) {
    const savedData = sessionStorage.getItem('simulationData')
    if (savedData) {
      router.push(game.route)
    } else {
      alert('沒有找到已保存的進度')
    }
  }
}

const goToSettings = () => {
  router.push('/settings')
}
</script>

<template>
  <div class="home-view">
    <!-- Settings Button -->
    <div class="settings-button">
      <button @click="goToSettings" class="btn-settings" :title="$t('common.settings')">
        ⚙️
      </button>
    </div>

    <!-- Main Content -->
    <div class="container">
      <div class="header">
        <h1>🎮 Mini Game Collection</h1>
        <p class="subtitle">選擇一個遊戲開始遊玩</p>
      </div>

      <!-- Game Grid -->
      <div class="game-grid">
        <div 
          v-for="game in games" 
          :key="game.id" 
          class="game-card"
          :class="{ disabled: !game.enabled }">
          <div class="game-icon" :style="{ background: game.color }">
            <span>{{ game.icon }}</span>
          </div>
          <div class="game-info">
            <h3>{{ game.name }}</h3>
            <p>{{ game.description }}</p>
          </div>
          <div class="game-actions" v-if="game.enabled">
            <button @click="startGame(game)" class="btn btn-start">
              🎯 開始新遊戲
            </button>
            <button @click="loadGame(game)" class="btn btn-load">
              📂 載入進度
            </button>
          </div>
          <div class="game-actions" v-else>
            <span class="coming-soon-label">即將推出</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  position: relative;
}

.settings-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
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
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 3rem;
  margin: 0 0 1rem 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.3rem;
  opacity: 0.95;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  padding: 1rem 0;
}

.game-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.game-card:not(.disabled):hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.game-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.game-icon {
  width: 100px;
  height: 100px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin: 0 auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.game-info {
  text-align: center;
}

.game-info h3 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.game-info p {
  font-size: 1rem;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.game-actions {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
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

.btn-start {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-load {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-load:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(240, 147, 251, 0.4);
}

.coming-soon-label {
  display: block;
  text-align: center;
  padding: 1rem;
  font-size: 1.1rem;
  color: #999;
  font-weight: 600;
  font-style: italic;
}
</style>
