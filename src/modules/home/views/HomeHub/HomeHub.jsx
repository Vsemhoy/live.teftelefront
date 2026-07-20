import { Badge, Text } from '@mantine/core';
import {
  IconAddressBook,
  IconBooks,
  IconBriefcase,
  IconCalendarEvent,
  IconChecklist,
  IconCurrencyDollar,
  IconDatabase,
  IconHome,
  IconPackage,
  IconTimeline,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { getModuleTheme } from '@/app/moduleThemes';

const MODULES = [
  {
    id: 'home',
    label: 'Home Feed',
    path: '/home',
    icon: IconHome,
    desc: 'Unified stream of events, exploits, and transactions.',
    status: 'Ready',
  },
  {
    id: 'eventor',
    label: 'Eventor',
    path: '/eventor/flow',
    icon: IconCalendarEvent,
    desc: 'Calendar, journals, drafts, and structured event history.',
    status: 'Ready',
  },
  {
    id: 'ledger',
    label: 'Ledger',
    path: '/ledger/timeline',
    icon: IconCurrencyDollar,
    desc: 'Accounts, transactions, groups, categories, and balances.',
    status: 'Ready',
  },
  {
    id: 'stuffer',
    label: 'Stuffer',
    path: '/stuffer/things',
    icon: IconPackage,
    desc: 'Things, locations, assets, and ownership context.',
    status: 'Ready',
  },
  {
    id: 'exploiter',
    label: 'Exploiter',
    path: '/exploiter/timeline',
    icon: IconTimeline,
    desc: 'Lifecycle timeline, incidents, fuel, readings, costs, and links.',
    status: 'Ready',
  },
  {
    id: 'contactor',
    label: 'Contactor',
    path: '/contactor',
    icon: IconAddressBook,
    desc: 'People memory, contact details, logs, and relation graph.',
    status: 'Ready',
  },
  {
    id: 'factor',
    label: 'Factor',
    path: '/factor',
    icon: IconDatabase,
    desc: 'Fast access to facts, codes, commands, numbers, and snippets.',
    status: 'Ready',
  },
  {
    id: 'booker',
    label: 'Booker',
    path: '/booker/library',
    icon: IconBooks,
    desc: 'Books, documents, notes, and knowledge blocks.',
    status: 'Draft',
  },
  {
    id: 'projector',
    label: 'Projector',
    path: '/projector',
    icon: IconBriefcase,
    desc: 'Projects, milestones, decisions, and delivery context.',
    status: 'Ready',
  },
  {
    id: 'tasker',
    label: 'Tasker',
    path: '/tasker',
    icon: IconChecklist,
    desc: 'Tasks, reports, blockers, and time tracking.',
    status: 'Ready',
  },
];

const statusColor = {
  Ready: 'green',
  Draft: 'orange',
  Next: 'gray',
};

export const HomeHub = () => {
  const navigate = useNavigate();

  return (
    <div className="home-hub">
      <div className="home-hub-header">
        <Text size="lg" fw={600}>Teftele</Text>
        <Text size="sm" c="dimmed">Choose a module and jump straight into the workspace.</Text>
      </div>

      <div className="home-hub-grid">
        {MODULES.map((module) => {
          const theme = getModuleTheme(module.id);
          const Icon = module.icon;

          return (
            <button
              key={module.id}
              type="button"
              className="home-hub-card"
              onClick={() => navigate(module.path)}
            >
              <span className="home-hub-card-icon" style={{ background: theme.gradient }}>
                <Icon size={21} style={{ color: theme.textColor }} />
              </span>
              <span className="home-hub-card-body">
                <span className="home-hub-card-title">
                  <Text size="sm" fw={600}>{module.label}</Text>
                  <Badge size="xs" variant="light" color={statusColor[module.status] || 'gray'}>
                    {module.status}
                  </Badge>
                </span>
                <Text size="xs" c="dimmed" lh={1.45}>{module.desc}</Text>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
