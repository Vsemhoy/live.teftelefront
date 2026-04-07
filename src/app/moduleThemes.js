export const MODULE_THEMES = {
  eventor: {
    gradient: 'linear-gradient(90deg, #d5f7df 0%, #afdbdb 100%)',
    accent: '#2d9e6b',
    textColor: '#1a4a35',
    label: 'Eventor',
  },
  exploiter: {
    gradient: 'linear-gradient(90deg, #fef3c7 0%, #fde8a8 100%)',
    accent: '#b45309',
    textColor: '#4a2e06',
    label: 'Exploiter',
  },
  badger: {
    gradient: 'linear-gradient(90deg, #ede9fe 0%, #ddd6fe 100%)',
    accent: '#6d28d9',
    textColor: '#2e1a5e',
    label: 'Badger',
  },
  tasker: {
    gradient: 'linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)',
    accent: '#1d4ed8',
    textColor: '#1e3a6e',
    label: 'Tasker',
  },
  pm: {
    gradient: 'linear-gradient(90deg, #fce7f3 0%, #fbcfe8 100%)',
    accent: '#be185d',
    textColor: '#5a1030',
    label: 'Project Manager',
  },
};

export const getModuleTheme = (moduleId) =>
  MODULE_THEMES[moduleId] || MODULE_THEMES.eventor;
