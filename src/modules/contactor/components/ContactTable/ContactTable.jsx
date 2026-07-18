import { useState } from 'react';
import { Avatar, Badge, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconMessagePlus, IconSortAscending, IconSortDescending, IconInfoCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useContactorStore } from '../../store/contactorStore';
import { formatLastContact, getInitials } from '../../utils/contactorUtils';

const GROUP_COLORS = {
  family: 'pink', friends: 'green', work: 'indigo',
  service: 'orange', acquaintance: 'gray',
};

const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return null;
  return sortDir === 'asc'
    ? <IconSortAscending size={13} />
    : <IconSortDescending size={13} />;
};

const Th = ({ children, field, sortField, sortDir, onSort, style }) => (
  <th
    onClick={() => onSort(field)}
    style={{
      cursor: 'pointer',
      userSelect: 'none',
      padding: '8px 12px',
      textAlign: 'left',
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--mantine-color-gray-6)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      borderBottom: '1px solid var(--mantine-color-gray-2)',
      background: 'var(--mantine-color-gray-0)',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    <Group gap={4} wrap="nowrap">
      {children}
      <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </Group>
  </th>
);

export const ContactTable = ({ contacts }) => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { openLogEditor, openContactEditor, sortField, sortDir, setSort } = useContactorStore();
  const [hoveredId, setHoveredId] = useState(null);

  const showActions = (id) => isMobile || hoveredId === id;

  return (
    <div className="cnt-table-wrap">
      <table className="cnt-table">
        <thead>
          <tr>
            <Th field="name" sortField={sortField} sortDir={sortDir} onSort={setSort}>Name</Th>
            <Th field="group" sortField={sortField} sortDir={sortDir} onSort={setSort}>Group</Th>
            <Th field="last_contact_at" sortField={sortField} sortDir={sortDir} onSort={setSort}>Last contact</Th>
            <th style={{
              width: 72,
              padding: '8px 12px',
              borderBottom: '1px solid var(--mantine-color-gray-2)',
              background: 'var(--mantine-color-gray-0)',
            }} />
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              className="cnt-table-row"
              onMouseEnter={() => setHoveredId(contact.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <td className="cnt-td cnt-td-name">
                <Group gap={8} wrap="nowrap">
                  <Avatar size={28} radius="xl" color="indigo" src={contact.avatar || null} style={{ flexShrink: 0 }}>
                    {getInitials(contact.name)}
                  </Avatar>
                  <div style={{ minWidth: 0 }}>
                    <button
                      className="cnt-name-btn"
                      onClick={() => navigate(`/contactor/${contact.id}`)}
                    >
                      {contact.name}
                    </button>
                    {contact.nickname && (
                      <Text size="xs" c="dimmed" truncate style={{ lineHeight: 1.2 }}>
                        {contact.nickname}
                      </Text>
                    )}
                  </div>
                </Group>
              </td>

              <td className="cnt-td">
                <Badge size="xs" variant="light" color={GROUP_COLORS[contact.group] || 'gray'}>
                  {contact.group}
                </Badge>
                {contact.role && (
                  <Text size="xs" c="dimmed" mt={2} truncate style={{ maxWidth: 160 }}>
                        {[contact.role, contact.company].filter(Boolean).join(' / ')}
                  </Text>
                )}
              </td>

              <td className="cnt-td">
                <Text size="sm" c={contact.last_contact_at ? 'inherit' : 'dimmed'}>
                  {formatLastContact(contact.last_contact_at)}
                </Text>
              </td>

              {/* Actions are shown on hover for desktop rows and always on mobile rows. */}
              <td className="cnt-td cnt-td-actions">
                <Group gap={4} wrap="nowrap" justify="flex-end"
                  style={{ opacity: showActions(contact.id) ? 1 : 0, transition: 'opacity 0.12s' }}
                >
                  <Tooltip label="Add log entry" withArrow position="top">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="indigo"
                      onClick={() => openLogEditor({ contact_id: contact.id })}
                    >
                      <IconMessagePlus size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Contact details" withArrow position="top">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      onClick={() => openContactEditor({ id: contact.id })}
                    >
                      <IconInfoCircle size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
