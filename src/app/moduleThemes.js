export const MODULE_THEMES = {
  home: {
    gradient: 'linear-gradient(90deg, #f5f3ff 0%, #ede9fe 100%)',
    accent: '#6d28d9',
    textColor: '#3b1578',
    label: 'Home',
  },
  eventor: {
    gradient: 'linear-gradient(90deg, #e7f0fd 0%, #d0e4fb 100%)',
    accent: '#2d6cdf',
    textColor: '#1a3a6e',
    label: 'Eventor',
  },
  exploiter: {
    gradient: 'linear-gradient(90deg, #fef3c7 0%, #fde8a8 100%)',
    accent: '#b45309',
    textColor: '#4a2e06',
    label: 'Exploiter',
  },
  stuffer: {
    gradient: 'linear-gradient(90deg, #fef3c7 0%, #fde8a8 100%)',
    accent: '#b45309',
    textColor: '#4a2e06',
    label: 'Stuffer',
  },
  ledger: {
    gradient: 'linear-gradient(90deg, #d5f7df 0%, #b8f0c8 100%)',
    accent: '#2d9e6b',
    textColor: '#1a4a35',
    label: 'Ledger',
  },
  booker: {
    gradient: 'linear-gradient(90deg, rgb(253 241 231) 0%, rgb(251 222 208) 100%)',
    accent: '#D85A30',
    textColor: '#712B13',
    label: 'Booker',
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
