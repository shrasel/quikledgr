import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoiceList } from './components/InvoiceList';
import { ProfileSettings } from './components/ProfileSettings';
import { InvoiceView } from './components/InvoiceView';
import { ShareModal } from './components/ShareModal';
import { AuthScreen } from './components/AuthScreen';
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
import { invoiceApi } from './api/client';

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'editor', 'list', 'profile'
  const [theme, setTheme] = useState(() => localStorage.getItem('quikledgr_theme') || localStorage.getItem('blukers_theme') || 'light');
  const [toasts, setToasts] = useState([]);
  
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Routing detection for recipient link
  const [routeInfo, setRouteInfo] = useState({ isRecipientRoute: false, invoiceId: null, encodedData: null });

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
      // Empty by default for production readiness; do not auto-save into list
    }

    // Attempt to sync from backend API if authenticated
    async function syncBackendInvoices() {
      try {
        const remoteInvoices = await invoiceApi.getAll();
        if (remoteInvoices && remoteInvoices.length > 0) {
          setInvoices(remoteInvoices);
          setCurrentInvoice(remoteInvoices[0]);
        }
      } catch (e) {
        console.log('[App] Using local invoices cache');
      }
    }

    if (user) {
      syncBackendInvoices();
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
          setRouteInfo({ isRecipientRoute: true, invoiceId: id, encodedData: data });
          return;
        }
      }
      setRouteInfo({ isRecipientRoute: false, invoiceId: null, encodedData: null });
    };

    checkHashRoute();
    window.addEventListener('hashchange', checkHashRoute);
    return () => window.removeEventListener('hashchange', checkHashRoute);
  }, []);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quikledgr_theme', theme);
    localStorage.setItem('blukers_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const triggerToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    clearUserSession();
    setUser(null);
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

  // 3. Authenticated App Portal
  return (
    <div className="app-container">
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        theme={theme} 
        toggleTheme={toggleTheme}
        onNewInvoice={handleNewInvoice}
        invoiceCount={invoices.length}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
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

        {currentTab === 'profile' && (
          <ProfileSettings onTriggerToast={triggerToast} />
        )}
      </main>

      {/* Share Modal */}
      {isShareModalOpen && currentInvoice && (
        <ShareModal 
          invoice={currentInvoice}
          shareUrl={shareUrl}
          onClose={() => setIsShareModalOpen(false)}
          onTriggerToast={triggerToast}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}
