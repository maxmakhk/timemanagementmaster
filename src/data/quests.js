// 遊戲 NPC 任務卡資料
// 每個 NPC 都有固定的目標、難度等級和解鎖條件

export const NPCQuests = [
  {
    id: 1,
    name: 'Alice',
    character: '勤奮的學生',
    difficulty: 'Easy',
    description: '幫助 Alice 提升基礎技能',
    personality: '勤奮',
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
    // 獎勵
    rewards: {
      masterReputation: 10,
      coins: 100
    }
  },
  {
    id: 2,
    name: 'Bob',
    character: '活潑的學生',
    difficulty: 'Normal',
    description: '協助 Bob 達到均衡發展',
    personality: '活潑',
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
      minMasterLevel: 1,
      minCompletedQuests: 1
    },
    rewards: {
      masterReputation: 15,
      coins: 150
    }
  },
  {
    id: 3,
    name: 'Charlie',
    character: '聰慧的學生',
    difficulty: 'Hard',
    description: '指導 Charlie 成為學術高手',
    personality: '聰慧',
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
    rewards: {
      masterReputation: 20,
      coins: 200
    }
  },
  {
    id: 4,
    name: 'Diana',
    character: '均衡的學生',
    difficulty: 'Hard',
    description: '培養 Diana 成為全能人才',
    personality: '均衡',
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
      minMasterLevel: 2,
      minCompletedQuests: 2
    },
    rewards: {
      masterReputation: 25,
      coins: 250
    }
  },
  {
    id: 5,
    name: 'Emma',
    character: '體育天才',
    difficulty: 'Normal',
    description: '幫助 Emma 全面發展',
    personality: '活躍',
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
