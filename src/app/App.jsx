import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Text, Center, Loader } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';

import { useAuthStore } from '@/modules/auth/authStore';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { AuthModal, AuthWall } from '@/modules/auth/AuthModal';
import { AppHeader } from './AppHeader';

// Eventor
import { SectionsSidenav } from '@/modules/eventor/components/SectionsSidenav/SectionsSidenav';
import { EventorToolbar } from '@/modules/eventor/components/Toolbar/EventorToolbar';
import { EventEditor } from '@/modules/eventor/components/EventEditor/EventEditor';
import { ReadModal } from '@/modules/eventor/components/ReadModal/ReadModal';
import { SectionsManager } from '@/modules/eventor/components/SectionsManager/SectionsManager';
import { FlowView } from '@/modules/eventor/views/FlowView/FlowView';
import { GridCalendar } from '@/modules/eventor/views/GridCalendar/GridCalendar';
import { SearchPanel } from '@/modules/eventor/views/SearchPanel/SearchPanel';
import { DraftsView } from '@/modules/eventor/views/DraftsView/DraftsView';

// Badger
import { AccountsSidenav } from '@/modules/badger/components/AccountsSidenav/AccountsSidenav';
import { BadgerToolbar } from '@/modules/badger/components/Toolbar/BadgerToolbar';
import { TimelineView } from '@/modules/badger/views/TimelineView/TimelineView';
import '@/modules/badger/badger.css';
import { PinboardButton } from '@/modules/eventor/components/Pinboard/Pinboard';
import { TransactionReadModal } from '@/modules/badger/components/TransactionReadModal/TransactionReadModal';
import { TransactionEditor } from '@/modules/badger/components/TransactionEditor/TransactionEditor';

const ComingSoon = ({ name }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <Text c="dimmed" size="sm">{name} — coming soon</Text>
  </div>
);

// ── Лэйаут Eventor ────────────────────────────────────────────────
const EventorLayout = ({ sidebarCollapsed, mobileSidebarOpen, onMobileClose }) => {
  const isOnline = useOnlineStatus();
  return (
    <>
      <SectionsSidenav
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={onMobileClose}
      />
      <div className="main-content">
        {!isOnline && (
          <div className="offline-banner">
            <span>●</span>
            No internet connection — events will be saved as local drafts
          </div>
        )}
        <EventorToolbar />
        <Outlet />
      </div>
    </>
  );
};

// ── Лэйаут Badger ─────────────────────────────────────────────────
const BadgerLayout = ({ sidebarCollapsed, mobileSidebarOpen, onMobileClose }) => (
  <>
    <AccountsSidenav
      collapsed={sidebarCollapsed}
      mobileOpen={mobileSidebarOpen}
      onMobileClose={onMobileClose}
    />
    <div className="main-content">
      <BadgerToolbar />
      <Outlet />
    </div>
  </>
);

export default function App() {
  const user = useAuthStore((s) => s.user);
  const isChecked = useAuthStore((s) => s.isChecked);
  const isKnownBrowser = useAuthStore((s) => s.isKnownBrowser);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  const navigate = useNavigate();
  const location = useLocation();
  const [authOpened, { open: openAuth, close: closeAuth }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Сайдбар: collapsed на десктопе, drawer на мобиле
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (isMobile) setMobileSidebarOpen((v) => !v);
    else setSidebarCollapsed((v) => !v);
  };

  // Закрываем мобильный сайдбар при смене роута
  useEffect(() => { setMobileSidebarOpen(false); }, [location.pathname]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/eventor' || location.pathname === '/eventor/') {
      navigate('/eventor/flow', { replace: true });
    }
    if (location.pathname === '/badger' || location.pathname === '/badger/') {
      navigate('/badger/timeline', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (!isChecked) {
    return (
      <Center style={{ width: '100vw', height: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  // Новый браузер — жёсткая стена логина
  if (!user && !isKnownBrowser) {
    return <AuthWall />;
  }

  return (
    <div className="app-shell">

      {/* Верхний хедер — не sticky */}
      <AppHeader
        onToggleSidebar={handleToggleSidebar}
        authModalOpen={openAuth}
      />

      {/* Тело */}
      <div className="app-body">
        {/* Оверлей под мобильным сайдбаром */}
        {isMobile && mobileSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
        )}

        {/* Rail — невидимая зона слева, открывает сайдбар на мобилке */}
        {isMobile && !mobileSidebarOpen && (
          <div
            className="sidebar-rail"
            onClick={() => setMobileSidebarOpen(true)}
          />
        )}

        <Routes>
          {/* Eventor: nested routes */}
          <Route path="/eventor" element={
            <EventorLayout
              sidebarCollapsed={!isMobile && sidebarCollapsed}
              mobileSidebarOpen={isMobile && mobileSidebarOpen}
              onMobileClose={() => setMobileSidebarOpen(false)}
            />
          }>
            <Route index element={<Navigate to="flow" replace />} />
            <Route path="flow"     element={<FlowView />} />
            <Route path="calendar" element={<GridCalendar />} />
            <Route path="search"   element={<SearchPanel />} />
            <Route path="drafts"   element={<DraftsView />} />
          </Route>

          {/* Badger: nested routes */}
          <Route path="/badger" element={
            <BadgerLayout
              sidebarCollapsed={!isMobile && sidebarCollapsed}
              mobileSidebarOpen={isMobile && mobileSidebarOpen}
              onMobileClose={() => setMobileSidebarOpen(false)}
            />
          }>
            <Route index element={<Navigate to="timeline" replace />} />
            <Route path="timeline" element={<TimelineView />} />
          </Route>

          <Route path="/exploiter/*" element={<div className="main-content"><ComingSoon name="Exploiter" /></div>} />
          <Route path="/tasker/*"    element={<div className="main-content"><ComingSoon name="Tasker" /></div>} />
          <Route path="/pm/*"        element={<div className="main-content"><ComingSoon name="Project Manager" /></div>} />
        </Routes>
      </div>

      {/* Глобальные оверлеи */}
      <AuthModal opened={authOpened} onClose={closeAuth} />
      <ReadModal />
      <EventEditor />
      <SectionsManager />
      <TransactionEditor />
      <TransactionReadModal />
      <PinboardButton />
    </div>
  );
}
