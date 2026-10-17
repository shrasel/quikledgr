import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoiceList } from './components/InvoiceList';
import { QuotesList } from './components/QuotesList';
import { RecurringProfiles } from './components/RecurringProfiles';
import { ArAgingView } from './components/ArAgingView';
import { PaymentsList } from './components/PaymentsList';
import { ClientPortalView } from './components/ClientPortalView';
import { Accounting } from './components/Accounting';
import { ProfileSettings } from './components/ProfileSettings';
import { InvoiceView } from './components/InvoiceView';
import { ShareModal } from './components/ShareModal';
import { AuthScreen } from './components/AuthScreen';
import { NewOrgModal } from './components/NewOrgModal';
import { InviteMemberModal } from './components/InviteMemberModal';
import { Toast } from './components/Toast';
import { 
  initStorage, 
  getInvoices, 
  saveInvoice, 
  deleteInvoice as removeInvoiceFromStorage,
  generateShareUrl,
  getIssuerProfile 
} from './utils/storage';
import { getStoredUser, clearUserSession } from './utils/auth';
import { createBlukersInvoiceTemplate, getCurrentMonthPeriod } from './utils/invoiceSchema';
import { generateRandomPin } from './utils/cryptoUtils';
import { invoiceApi, organizationApi } from './api/client';

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganization, setActiveOrganization] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'editor', 'list', 'accounting', 'profile', 'payments'
  const [theme, setTheme] = useState(() => localStorage.getItem('quikledgr_theme') || localStorage.getItem('blukers_theme') || 'light');
  const [toasts, setToasts] = useState([]);
  
  // Modals state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isNewOrgModalOpen, setIsNewOrgModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Routing detection for recipient link and client portal
  const [routeInfo, setRouteInfo] = useState({ isRecipientRoute: false, isPortalRoute: false, invoiceId: null, encodedData: null, portalToken: null });

  const triggerToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // Sync Organizations & active selection
  const loadOrganizations = async () => {
    try {
      const orgs = await organizationApi.getAll();
      setOrganizations(orgs);
      const savedOrgId = organizationApi.getActiveOrgId();
      const matched = orgs.find(o => o.id === savedOrgId) || orgs[0];
      if (matched) {
        setActiveOrganization(matched);
        organizationApi.setActiveOrgId(matched.id);
      }
    } catch (e) {
      console.warn('[App] Error loading organizations:', e.message);
    }
  };

  // Sync Invoices for active organization
  const syncInvoices = async () => {
    try {
      const remoteInvoices = await invoiceApi.getAll();
      if (remoteInvoices && Array.isArray(remoteInvoices)) {
        setInvoices(remoteInvoices);
        if (remoteInvoices.length > 0 && !currentInvoice) {
          setCurrentInvoice(remoteInvoices[0]);
        }
      }
    } catch (e) {
      console.log('[App] Using local invoices cache');
      const stored = getInvoices();
      setInvoices(stored);
      if (stored.length > 0 && !currentInvoice) {
        setCurrentInvoice(stored[0]);
      }
    }
  };

  // Switch Active Workspace
  const handleSwitchOrganization = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      organizationApi.setActiveOrgId(org.id);
      setActiveOrganization(org);
      triggerToast(`Switched workspace to "${org.name}"`);
      syncInvoices();
    }
  };

  // On organization created
  const handleOrgCreated = (newOrg) => {
    setOrganizations(prev => [...prev, newOrg]);
    handleSwitchOrganization(newOrg.id);
  };

  // Initialize storage & detect route
  useEffect(() => {
    initStorage();
    const stored = getInvoices();
    setInvoices(stored);

    if (stored.length > 0) {
      setCurrentInvoice(stored[0]);
    } else {
      const saved = getIssuerProfile();
      const template = createBlukersInvoiceTemplate(saved);
      setCurrentInvoice(template);
    }

    if (user) {
      loadOrganizations();
      syncInvoices();
    }

    const checkHashRoute = () => {
      const hash = window.location.hash || '';
      if (hash.startsWith('#/view') || hash.startsWith('#view')) {
        const queryIdx = hash.indexOf('?');
        if (queryIdx !== -1) {
          const queryStr = hash.slice(queryIdx + 1);
          const params = new URLSearchParams(queryStr);
          const id = params.get('id');
          const data = params.get('data');
          setRouteInfo({ isRecipientRoute: true, isPortalRoute: false, invoiceId: id, encodedData: data, portalToken: null });
          return;
        }
      }
      if (hash.startsWith('#/portal') || hash.startsWith('#portal')) {
        const queryIdx = hash.indexOf('?');
        if (queryIdx !== -1) {
          const queryStr = hash.slice(queryIdx + 1);
          const params = new URLSearchParams(queryStr);
          const token = params.get('token');
          setRouteInfo({ isRecipientRoute: false, isPortalRoute: true, invoiceId: null, encodedData: null, portalToken: token });
          return;
        }
      }
      setRouteInfo({ isRecipientRoute: false, isPortalRoute: false, invoiceId: null, encodedData: null, portalToken: null });
    };

    checkHashRoute();
    window.addEventListener('hashchange', checkHashRoute);
    return () => window.removeEventListener('hashchange', checkHashRoute);
  }, []);

  // When user signs in, load organizations
  useEffect(() => {
    if (user) {
      loadOrganizations();
      syncInvoices();
    }
  }, [user]);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('quikledgr_theme', theme);
    localStorage.setItem('blukers_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setCurrentTab('dashboard');
    loadOrganizations();
    syncInvoices();
  };

  const handleLogout = () => {
    clearUserSession();
    setUser(null);
    setOrganizations([]);
    setActiveOrganization(null);
    triggerToast('Signed out successfully.');
  };

  // Create new invoice
  const handleNewInvoice = () => {
    const saved = getIssuerProfile();
    const newInv = createBlukersInvoiceTemplate(saved);
    setCurrentInvoice(newInv);
    saveInvoice(newInv);
    setInvoices(getInvoices());
    setCurrentTab('editor');
    triggerToast('Created new monthly invoice!');
  };

  // Duplicate invoice
  const handleDuplicateInvoice = (invoiceToCopy) => {
    const newId = 'BLK-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newPin = generateRandomPin();
    const dates = getCurrentMonthPeriod();

    const duplicated = {
      ...invoiceToCopy,
      id: newId,
      invoiceNumber: newId,
      status: 'draft',
      createdAt: new Date().toISOString(),
      invoiceDate: dates.invoiceDate,
      dueDate: dates.dueDate,
      servicePeriod: dates.servicePeriodLabel,
      security: {
        ...invoiceToCopy.security,
        accessPin: newPin,
      }
    };

    saveInvoice(duplicated);
    setInvoices(getInvoices());
    setCurrentInvoice(duplicated);
    setCurrentTab('editor');
    triggerToast(`Duplicated into ${newId} with new access PIN!`);
  };

  const handleDeleteInvoice = (id) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      const remaining = removeInvoiceFromStorage(id);
      setInvoices(remaining);
      if (currentInvoice?.id === id) {
        setCurrentInvoice(remaining[0] || null);
      }
      triggerToast('Invoice deleted.');
    }
  };

  const handleSelectInvoice = (inv) => {
    setCurrentInvoice(inv);
    setCurrentTab('editor');
  };

  const handleOpenInvoiceById = async (invoiceId) => {
    try {
      await syncInvoices();
      const remoteInvoices = await invoiceApi.getAll();
      const matched = remoteInvoices?.find(i => i.id === invoiceId);
      if (matched) {
        setCurrentInvoice(matched);
        setCurrentTab('editor');
        return;
      }
    } catch (e) {
      console.warn('Failed to load invoice by id:', e);
    }
    setCurrentTab('list');
  };

  // Open share modal
  const handleOpenShareModal = async (invToShare = currentInvoice) => {
    if (!invToShare) return;
    saveInvoice(invToShare);
    const url = await generateShareUrl(invToShare);
    setShareUrl(url);
    setIsShareModalOpen(true);
  };

  // In-app test of recipient lock screen
  const handleViewRecipientScreen = async () => {
    if (!currentInvoice) return;
    saveInvoice(currentInvoice);
    const url = await generateShareUrl(currentInvoice);
    setShareUrl(url);
    window.location.hash = `/view?id=${encodeURIComponent(currentInvoice.id)}`;
  };

  const handleReturnFromRecipient = () => {
    window.location.hash = '';
    setRouteInfo({ isRecipientRoute: false, invoiceId: null, encodedData: null });
    setCurrentTab('dashboard');
  };

  // 1. Recipient route: Can be viewed with just the 6-digit access PIN (no login required for recipient)
  if (routeInfo.isRecipientRoute) {
    return (
      <div className="app-container">
        <InvoiceView 
          invoiceId={routeInfo.invoiceId}
          encodedData={routeInfo.encodedData}
          onBackToEditor={handleReturnFromRecipient}
          onTriggerToast={triggerToast}
        />
        <Toast toasts={toasts} />
      </div>
    );
  }

  // 1.5. Zero-Login Client Billing Portal: accessed with 30-day crypto magic token
  if (routeInfo.isPortalRoute && routeInfo.portalToken) {
    return (
      <div className="app-container">
        <ClientPortalView 
          portalToken={routeInfo.portalToken}
          onBackToLogin={() => {
            window.location.hash = '';
            setRouteInfo({ isRecipientRoute: false, isPortalRoute: false, invoiceId: null, encodedData: null, portalToken: null });
            setCurrentTab('dashboard');
          }}
          onTriggerToast={triggerToast}
        />
        <Toast toasts={toasts} />
      </div>
    );
  }

  // 2. Consultant creator side: Requires authentication
  if (!user) {
    return (
      <div className="app-container">
        <AuthScreen 
          onLoginSuccess={handleLoginSuccess}
          onTriggerToast={triggerToast}
        />
        <Toast toasts={toasts} />
      </div>
    );
  }

  // 3. Authenticated App Portal - TailAdmin Layout Shell
  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9] dark:bg-[#1A222C] text-body dark:text-bodydark antialiased">
      {/* TailAdmin Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        invoiceCount={invoices.length}
        activeOrganization={activeOrganization}
        organizations={organizations}
        onSwitchOrganization={handleSwitchOrganization}
        onOpenNewOrgModal={() => setIsNewOrgModalOpen(true)}
      />

      {/* Content Area */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* TailAdmin Header */}
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          theme={theme}
          toggleTheme={toggleTheme}
          user={user}
          activeOrganization={activeOrganization}
          organizations={organizations}
          onSwitchOrganization={handleSwitchOrganization}
          onOpenNewOrgModal={() => setIsNewOrgModalOpen(true)}
          onOpenInviteModal={() => setIsInviteModalOpen(true)}
          onLogout={handleLogout}
          onNewInvoice={handleNewInvoice}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 2xl:p-10">
          <div className="mx-auto max-w-screen-2xl">
            {currentTab === 'dashboard' && (
              <Dashboard 
                user={user}
                invoices={invoices}
                onNavigateToTab={setCurrentTab}
                onSelectInvoice={handleSelectInvoice}
                onNewInvoice={handleNewInvoice}
                onShareInvoice={handleOpenShareModal}
              />
            )}

            {currentTab === 'editor' && currentInvoice && (
              <InvoiceEditor 
                invoice={currentInvoice}
                setInvoice={setCurrentInvoice}
                onOpenShareModal={() => handleOpenShareModal(currentInvoice)}
                onViewRecipientScreen={handleViewRecipientScreen}
                onTriggerToast={triggerToast}
              />
            )}

            {currentTab === 'list' && (
              <InvoiceList 
                invoices={invoices}
                onSelectInvoice={handleSelectInvoice}
                onShareInvoice={handleOpenShareModal}
                onDeleteInvoice={handleDeleteInvoice}
                onDuplicateInvoice={handleDuplicateInvoice}
                onNewInvoice={handleNewInvoice}
                onTriggerToast={triggerToast}
              />
            )}

            {currentTab === 'quotes' && (
              <QuotesList 
                onTriggerToast={triggerToast}
                onOpenInvoice={handleOpenInvoiceById}
              />
            )}

            {currentTab === 'recurring' && (
              <RecurringProfiles 
                onTriggerToast={triggerToast}
                onOpenInvoice={handleOpenInvoiceById}
              />
            )}

            {currentTab === 'ar' && (
              <ArAgingView 
                onTriggerToast={triggerToast}
                onOpenInvoice={handleOpenInvoiceById}
              />
            )}

            {currentTab === 'payments' && (
              <PaymentsList 
                onTriggerToast={triggerToast}
                onOpenInvoice={handleOpenInvoiceById}
              />
            )}

            {currentTab === 'accounting' && (
              <Accounting 
                organization={activeOrganization}
                userRole={activeOrganization?.role || 'owner'}
                onTriggerToast={triggerToast}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileSettings onTriggerToast={triggerToast} />
            )}
          </div>
        </main>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && currentInvoice && (
        <ShareModal 
          invoice={currentInvoice}
          shareUrl={shareUrl}
          onClose={() => setIsShareModalOpen(false)}
          onTriggerToast={triggerToast}
        />
      )}

      {/* New Entity / LLC Modal */}
      <NewOrgModal
        isOpen={isNewOrgModalOpen}
        onClose={() => setIsNewOrgModalOpen(false)}
        onCreated={handleOrgCreated}
        onTriggerToast={triggerToast}
      />

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onTriggerToast={triggerToast}
      />

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}
