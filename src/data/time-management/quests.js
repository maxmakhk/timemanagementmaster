// 遊戲 NPC 任務卡資料
// 每個 NPC 都有固定的目標、難度等級和解鎖條件

export const NPCQuests = [
  {
    id: 1,
    name: 'Alice',
    characterKey: 'quests.alice1.character',
    difficulty: 'Easy',
    descriptionKey: 'quests.alice1.description',
    personalityKey: 'quests.alice1.personality',
    image: '👧',
    // 初始能力值
    initial: {
      coding: 0,
      math: 0,
      fitness: 0
    },
    // 固定的目標
    goals: {
      coding: 40,
      math: 30,
      fitness: 20
    },
    // 所需條件
    requirements: {
      minMasterLevel: 0, // 第一局就可以選
      minCompletedQuests: 0
    },
    // 所需天數
    requiredDays: 5,
    // 獎勵
    rewards: {
      masterReputation: 10,
      coins: 100
    }
  },
  {
    id: 2,
    name: 'Bob',
    characterKey: 'quests.bob1.character',
    difficulty: 'Normal',
    descriptionKey: 'quests.bob1.description',
    personalityKey: 'quests.bob1.personality',
    image: '👦',
    initial: {
      coding: 5,
      math: 3,
      fitness: 8
    },
    goals: {
      coding: 50,
      math: 35,
      fitness: 40
    },
    requirements: {
      minMasterLevel: 0,
      minCompletedQuests: 0
    },
    requiredDays: 7,
    rewards: {
      masterReputation: 15,
      coins: 150
    }
  },
  {
    id: 3,
    name: 'Alice',
    characterKey: 'quests.alice2.character',
    difficulty: 'Hard',
    descriptionKey: 'quests.alice2.description',
    personalityKey: 'quests.alice2.personality',
    image: '🧑‍🎓',
    initial: {
      coding: 8,
      math: 10,
      fitness: 2
    },
    goals: {
      coding: 60,
      math: 70,
      fitness: 25
    },
    requirements: {
      minMasterLevel: 2,
      minCompletedQuests: 2
    },
    requiredDays: 10,
    rewards: {
      masterReputation: 20,
      coins: 200
    }
  },
  {
    id: 4,
    name: 'Alice',
    characterKey: 'quests.alice3.character',
    difficulty: 'Hard',
    descriptionKey: 'quests.alice3.description',
    personalityKey: 'quests.alice3.personality',
    image: '👩',
    initial: {
      coding: 6,
      math: 6,
      fitness: 6
    },
    goals: {
      coding: 50,
      math: 50,
      fitness: 50
    },
    requirements: {
      minMasterLevel: 1,
      minCompletedQuests: 1
    },
    requiredDays: 10,
    rewards: {
      masterReputation: 25,
      coins: 250
    }
  },
  {
    id: 5,
    name: 'Bob',
    characterKey: 'quests.bob2.character',
    difficulty: 'Normal',
    descriptionKey: 'quests.bob2.description',
    personalityKey: 'quests.bob2.personality',
    image: '🏃‍♀️',
    initial: {
      coding: 2,
      math: 2,
      fitness: 12
    },
    goals: {
      coding: 30,
      math: 25,
      fitness: 60
    },
    requirements: {
      minMasterLevel: 1,
      minCompletedQuests: 1
    },
    requiredDays: 7,
    rewards: {
      masterReputation: 15,
      coins: 150
    }
  }
]

// 獲取可用的 NPC 任務（根據 Master 等級和已完成的任務）
export const getAvailableQuests = (masterLevel = 0, completedQuestCount = 0) => {
  return NPCQuests.filter(quest => {
    return (
      quest.requirements.minMasterLevel <= masterLevel &&
      quest.requirements.minCompletedQuests <= completedQuestCount
    )
  })
}

// 計算 Master 等級（基於已完成的任務數）
export const calculateMasterLevel = (completedQuestCount) => {
  return Math.floor(completedQuestCount / 2)
}

// 計算 Master 名聲（基於已完成的任務獎勵總和）
export const calculateMasterReputation = (completedQuests) => {
  return completedQuests.reduce((total, quest) => {
    return total + (NPCQuests.find(q => q.id === quest.id)?.rewards.masterReputation || 0)
  }, 0)
}
