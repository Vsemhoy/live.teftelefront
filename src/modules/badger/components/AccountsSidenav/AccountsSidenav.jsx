import { Stack, NavLink, Text, Group, ActionIcon, Divider, Skeleton, Tooltip, Badge, Button } from '@mantine/core';
import {
  IconPlus, IconX, IconSettings,
  IconWallet, IconCreditCard, IconBuildingBank, IconPigMoney, IconGhost,
} from '@tabler/icons-react';
import { useBadgerStore } from '../../store/badgerStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconTimeline, IconChartBar } from '@tabler/icons-react';
import { useAccounts } from '../../api/badgerApi';
import { formatMoney, calcDailyInterest, rateToStr } from '../../utils/badgerUtils';
import dayjs from 'dayjs';
import { AccountsManager } from '../AccountsManager/AccountsManager';

const AccountTypeIcon = ({ type, size = 15 }) => {
  switch (type) {
    case 'card':    return <IconCreditCard size={size} />;
    case 'credit':  return <IconBuildingBank size={size} />;
    case 'deposit': return <IconPigMoney size={size} />;
    case 'phantom': return <IconGhost size={size} />;
    default:        return <IconWallet size={size} />;
  }
};

export const AccountsSidenav = ({ collapsed = false, mobileOpen = false, onMobileClose }) => {
  const { activeAccounts, activeCurrency, toggleAccount, managerOpen, openManager, closeManager } = useBadgerStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isStats   = location.pathname.includes('/stats');
  const { data: accounts = [], isLoading } = useAccounts();

  const grouped = (accounts || [])
    .filter((a) => !Boolean(a.is_archived))
    .sort((a, b) => a.sort_order - b.sort_order)
    .reduce((acc, account) => {
      const cur = account.currency;
      if (!acc[cur]) acc[cur] = [];
      acc[cur].push(account);
      return acc;
    }, {});

  const currencies = Object.keys(grouped);

  const sidebarClass = [
    'sections-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={sidebarClass}>
        {/* Навигация Timeline / Stats + кнопка добавления счёта */}
        <Group px={collapsed ? 4 : 8} py={8} gap={4} justify="space-between" style={{ flexShrink: 0 }} wrap="nowrap">

          {/* Кнопки навигации */}
          <Group gap={4} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <Tooltip label="Timeline" position="right">
              <ActionIcon variant={!isStats ? 'light' : 'subtle'} color="green" size="sm"
                onClick={() => navigate('/badger/timeline')}>
                <IconTimeline size={15} />
              </ActionIcon>
            </Tooltip>
            {!collapsed && (
              <Button variant={!isStats ? 'light' : 'subtle'} color="green" size="compact-xs"
                onClick={() => navigate('/badger/timeline')}
                styles={{ root: { fontWeight: !isStats ? 600 : 400 } }}>
                Timeline
              </Button>
            )}
            <Tooltip label="Stats" position="right">
              <ActionIcon variant={isStats ? 'light' : 'subtle'} color="green" size="sm"
                onClick={() => navigate('/badger/stats')}>
                <IconChartBar size={15} />
              </ActionIcon>
            </Tooltip>
            {!collapsed && (
              <Button variant={isStats ? 'light' : 'subtle'} color="green" size="compact-xs"
                onClick={() => navigate('/badger/stats')}
                styles={{ root: { fontWeight: isStats ? 600 : 400 } }}>
                Stats
              </Button>
            )}
          </Group>

          {/* Плюс + закрытие мобилки */}
          <Group gap={4} style={{ flexShrink: 0 }}>
            <Tooltip label="New account" position="right">
              <ActionIcon variant="light" color="green" size="sm" onClick={openManager}>
                <IconPlus size={14} />
              </ActionIcon>
            </Tooltip>
            {mobileOpen && (
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={onMobileClose}>
                <IconX size={14} />
              </ActionIcon>
            )}
          </Group>
        </Group>
        <Divider style={{ flexShrink: 0 }} />

        {!collapsed && (
          <>
            <Group px={12} pt={10} pb={4} justify="space-between" style={{ flexShrink: 0 }}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}
                style={{ letterSpacing: '0.06em' }} className="sidebar-section-title">
                Accounts
              </Text>
              <Tooltip label="Manage accounts" withArrow position="right">
                <ActionIcon size="xs" variant="subtle" color="gray" onClick={openManager}>
                  <IconSettings size={13} />
                </ActionIcon>
              </Tooltip>
            </Group>

            <Stack gap={2} px={8} pb={4} style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {isLoading
                ? [1, 2, 3].map((i) => <Skeleton key={i} height={36} radius="sm" />)
                : currencies.map((currency) => (
                  <div key={currency}>
                    {currencies.length > 1 && (
                      <Text size="xs" c="dimmed" px={4} pt={6} pb={2} fw={500}>{currency}</Text>
                    )}
                    {grouped[currency].map((account) => {
                      const isActive = activeAccounts.includes(account.id);
                      const isOtherCurrency = activeCurrency !== account.currency && activeAccounts.length > 0;
                      return (
                        <NavLink
                          key={account.id}
                          label={
                            <Group justify="space-between" gap={4}>
                              <Text size="xs" fw={isActive ? 600 : 400}
                                style={{ opacity: isOtherCurrency ? 0.4 : 1 }}>
                                {account.name}
                              </Text>
                              <div style={{ textAlign: 'right' }}>
                                <Text size="xs" c={
                                  (account.balance_today ?? 0) < 0 ? 'red.5' : 'dimmed'
                                } style={{ opacity: isOtherCurrency ? 0.4 : 1 }}>
                                  {formatMoney(account.balance_today ?? 0, account.currency)}
                                </Text>
                                {/* Ежедневное начисление для кредитных счетов */}
                                {account.interest_rate && (account.balance_today ?? 0) < 0 && (
                                  <Text size="xs" c="orange.5" style={{ fontSize: 10 }}>
                                    {formatMoney(
                                      calcDailyInterest(account.balance_today, account.interest_rate, dayjs()),
                                      account.currency
                                    )}/день
                                  </Text>
                                )}
                              </div>
                            </Group>
                          }
                          leftSection={
                            <span style={{ opacity: isOtherCurrency ? 0.4 : 1 }}>
                              <AccountTypeIcon type={account.type} />
                            </span>
                          }
                          active={isActive}
                          onClick={() => toggleAccount(account.id, account.currency)}
                          styles={{
                            root: {
                              borderRadius: 4, fontSize: 13,
                              ...(account.color && isActive && {
                                borderLeft: `3px solid ${account.color}`,
                                paddingLeft: 9,
                              }),
                            },
                          }}
                        />
                      );
                    })}
                  </div>
                ))
              }
            </Stack>

            {activeAccounts.length > 0 && (
              <>
                <Divider style={{ flexShrink: 0 }} />
                <Group px={12} py={6} style={{ flexShrink: 0 }}>
                  <Badge size="xs" variant="light" color="green">
                    {activeCurrency} · {activeAccounts.length} selected
                  </Badge>
                </Group>
              </>
            )}

            <Divider style={{ flexShrink: 0 }} />
            <Group px={12} py={8} style={{ flexShrink: 0 }}>
              <NavLink
                label={<span className="sidebar-label">New account</span>}
                leftSection={<IconPlus size={13} />}
                onClick={openManager}
                styles={{ root: { borderRadius: 4, fontSize: 13, color: 'var(--mantine-color-gray-6)' } }}
              />
            </Group>
          </>
        )}
      </div>

      {/* Менеджер счетов */}
      <AccountsManager opened={managerOpen} onClose={closeManager} />
    </>
  );
};
