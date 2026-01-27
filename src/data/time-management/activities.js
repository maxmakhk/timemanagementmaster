// Activity card definitions for the Time Management game
export const activityCards = [
  { 
    id: 1, 
    name: 'Coding Class', 
    effect: { coding: 5 }, 
    cost: { energy: 30, mood: 50 }, 
    color: '#3498db',
    bgImage: '/images/time-management/bg_codingClass.jpg',
    activityKey: 'codingClass'
  },
  { 
    id: 2, 
    name: 'Math Study', 
    effect: { math: 5 }, 
    cost: { energy: 30, mood: 50 }, 
    color: '#e74c3c',
    bgImage: '/images/time-management/bg_mathStudy.jpg',
    activityKey: 'mathStudy'
  },
  { 
    id: 3, 
    name: 'Fitness', 
    effect: { fitness: 5 }, 
    cost: { energy: 30, mood: 50 }, 
    color: '#2ecc71',
    bgImage: '/images/time-management/bg_fitnessTraining.jpg',
    activityKey: 'fitnessTraining'
  },
  { 
    id: 4, 
    name: 'Rest', 
    effect: { energy: 100, mood: 100 }, 
    isRest: true, 
    color: '#f39c12',
    bgImage: '/images/time-management/bg_rest.jpg',
    activityKey: 'rest'
  },
  { 
    id: 5, 
    name: 'Lunch', 
    effect: { energy: 50 }, 
    cost: { energy: -50 },
    color: '#95a5a6',
    bgImage: '/images/time-management/bg_lunch.jpg',
    activityKey: 'lunch'
  },
]

// Helper function to get activity by name
export function getActivityByName(name) {
  return activityCards.find(a => a.name === name)
}

// Helper function to get activity by key
export function getActivityByKey(key) {
  return activityCards.find(a => a.activityKey === key)
}
