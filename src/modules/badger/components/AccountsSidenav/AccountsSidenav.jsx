import { Stack, NavLink, Text, Group, ActionIcon, Divider, Skeleton, Tooltip, Badge } from '@mantine/core';
import {
  IconPlus, IconX, IconSettings,
  IconWallet, IconCreditCard, IconBuildingBank, IconPigMoney, IconGhost,
} from '@tabler/icons-react';
import { useBadgerStore } from '../../store/badgerStore';
import { useAccounts } from '../../api/badgerApi';
import { formatMoney } from '../../utils/badgerUtils';
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
        {/* Заголовок */}
        <Group px={collapsed ? 4 : 12} py={10} justify="space-between" style={{ flexShrink: 0 }}>
          {!collapsed && (
            <Text size="sm" fw={600} c="green.7" className="sidebar-label">Badger</Text>
          )}
          <Group gap={4} ml={collapsed ? 'auto' : undefined} mr={collapsed ? 'auto' : undefined}>
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
                              <Text size="xs" c="dimmed" style={{ opacity: isOtherCurrency ? 0.4 : 1 }}>
                                {formatMoney(account.balance_today ?? 0, account.currency)}
                              </Text>
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
