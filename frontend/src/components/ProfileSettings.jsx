import React, { useState, useEffect } from 'react';
import { Building, CreditCard, Save, CheckCircle, ShieldCheck, DollarSign, RotateCcw } from 'lucide-react';
import { getIssuerProfile, saveIssuerProfile } from '../utils/storage';
import { profileApi } from '../api/client';
import { CURRENCIES } from '../utils/invoiceSchema';

export function ProfileSettings({ onTriggerToast }) {
  const [profile, setProfile] = useState({
    name: '',
    businessName: '',
    titleOrRole: '',
    email: '',
    phone: '',
    address: '',
    cityStateZip: '',
    country: 'United States',
    taxId: '',
  });

  const [wageSettings, setWageSettings] = useState({
    defaultHourlyRate: '',
    defaultMonthlyHours: '',
    currency: 'USD',
    taxRate: '',
  });

  const [wireDetails, setWireDetails] = useState({
    accountHolderName: '',
    bankName: '',
    bankAddress: '',
    accountNumberOrIban: '',
    swiftBicCode: '',
    routingAba: '',
    achRouting: '',
    paymentInstructions: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const remote = await profileApi.get();
        if (remote?.profile) setProfile(remote.profile);
        if (remote?.wireDetails) setWireDetails(remote.wireDetails);
        if (remote?.wageSettings) setWageSettings(remote.wageSettings);
      } catch (e) {
        // Fallback to local
      }
      const saved = getIssuerProfile();
      if (saved) {
        if (saved.profile) setProfile(saved.profile);
        if (saved.wireDetails) setWireDetails(saved.wireDetails);
        if (saved.wageSettings) setWageSettings(saved.wageSettings);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    saveIssuerProfile(profile, wireDetails, wageSettings);
    try {
      await profileApi.update(profile, wireDetails, wageSettings);
    } catch (e) {
      console.warn('[ProfileSettings] Saved locally (backend offline)');
    }
    onTriggerToast('Saved your business, wage profile & wire instructions! New invoices will automatically use these details.');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all profile and wage settings to empty defaults?')) {
      const emptyProfile = {
        name: '',
        businessName: '',
        titleOrRole: '',
        email: '',
        phone: '',
        address: '',
        cityStateZip: '',
        country: 'United States',
        taxId: '',
      };
      const emptyWage = {
        defaultHourlyRate: '',
        defaultMonthlyHours: '',
        currency: 'USD',
        taxRate: '',
      };
      const emptyWire = {
        accountHolderName: '',
        bankName: '',
        bankAddress: '',
        accountNumberOrIban: '',
        swiftBicCode: '',
        routingAba: '',
        achRouting: '',
        paymentInstructions: '',
      };
      setProfile(emptyProfile);
      setWageSettings(emptyWage);
      setWireDetails(emptyWire);
      saveIssuerProfile(emptyProfile, emptyWire, emptyWage);
      onTriggerToast('Profile, wage and wire settings have been reset.');
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Consultant / Business Details Card */}
        <div className="card p-4 sm:p-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Building size={22} className="text-slate-800 dark:text-slate-200" />
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Consultant / Business Profile</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--apple-text-secondary)' }}>
                  Your business details appear on all invoices as the issuing party.
                </div>
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              onClick={handleResetDefaults}
              title="Reset profile data"
            >
              <RotateCcw size={13} />
              <span>Reset Profile</span>
            </button>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">CONSULTANT FULL NAME</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Sarah Jenkins"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">REGISTERED BUSINESS NAME</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Jenkins Advisory & Consulting LLC"
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">PROFESSIONAL TITLE / ROLE</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Principal Consultant"
                value={profile.titleOrRole}
                onChange={(e) => setProfile({ ...profile, titleOrRole: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">TAX ID / EIN / VAT</label>
              <input 
                type="text" 
                className="form-input form-input-mono" 
                placeholder="e.g. XX-XXXXXXX"
                value={profile.taxId}
                onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">EMAIL ADDRESS</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="e.g. consultant@advisory.io"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">PHONE NUMBER</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. +1 (555) 000-0000"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">STREET ADDRESS</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 100 Financial Plaza, Suite 500"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">CITY, STATE, ZIP</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. New York, NY 10001"
                value={profile.cityStateZip}
                onChange={(e) => setProfile({ ...profile, cityStateZip: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">COUNTRY</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="United States"
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Wage & Billing Rate Profile Card */}
        <div className="card p-4 sm:p-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <DollarSign size={22} className="text-slate-800 dark:text-slate-200" />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Wage & Billing Rate Profile</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--apple-text-secondary)' }}>
                Set your standard hourly wage/rate and hours to automatically pre-populate new invoices.
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">DEFAULT HOURLY RATE</label>
              <div className="input-with-icon">
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="form-input form-input-mono" 
                  placeholder="e.g. 95.00"
                  value={wageSettings.defaultHourlyRate}
                  onChange={(e) => setWageSettings({ ...wageSettings, defaultHourlyRate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">STANDARD MONTHLY HOURS</label>
              <input 
                type="number" 
                step="0.5"
                min="0"
                className="form-input form-input-mono" 
                placeholder="e.g. 160"
                value={wageSettings.defaultMonthlyHours}
                onChange={(e) => setWageSettings({ ...wageSettings, defaultMonthlyHours: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">DEFAULT BILLING CURRENCY</label>
              <select
                className="form-select"
                value={wageSettings.currency}
                onChange={(e) => setWageSettings({ ...wageSettings, currency: e.target.value })}
              >
                {CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">DEFAULT TAX RATE (%) (OPTIONAL)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className="form-input form-input-mono" 
                placeholder="e.g. 0"
                value={wageSettings.taxRate}
                onChange={(e) => setWageSettings({ ...wageSettings, taxRate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Wire Transfer Details Card */}
        <div className="wire-transfer-section">
          <div className="wire-header">
            <div className="wire-header-title">
              <CreditCard size={20} />
              <span>Default Wire Transfer & Banking Instructions</span>
            </div>
            <span className="security-pill">
              <ShieldCheck size={14} />
              Saved Securely
            </span>
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--apple-text-secondary)', marginBottom: '1.25rem' }}>
            Store your wire transfer information here so that every monthly invoice can be populated in one click.
          </p>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">ACCOUNT HOLDER NAME</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Jenkins Advisory LLC"
                value={wireDetails.accountHolderName}
                onChange={(e) => setWireDetails({ ...wireDetails, accountHolderName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">BANK NAME</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. JPMorgan Chase Bank, N.A."
                value={wireDetails.bankName}
                onChange={(e) => setWireDetails({ ...wireDetails, bankName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">ACCOUNT NUMBER OR IBAN</label>
              <input 
                type="text" 
                className="form-input form-input-mono" 
                placeholder="e.g. 123456789012"
                value={wireDetails.accountNumberOrIban}
                onChange={(e) => setWireDetails({ ...wireDetails, accountNumberOrIban: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SWIFT / BIC CODE</label>
              <input 
                type="text" 
                className="form-input form-input-mono" 
                placeholder="e.g. CHASUS33XXX"
                value={wireDetails.swiftBicCode}
                onChange={(e) => setWireDetails({ ...wireDetails, swiftBicCode: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">ROUTING NUMBER (FEDWIRE / ABA)</label>
              <input 
                type="text" 
                className="form-input form-input-mono" 
                placeholder="e.g. 021000021"
                value={wireDetails.routingAba}
                onChange={(e) => setWireDetails({ ...wireDetails, routingAba: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ACH ROUTING NUMBER (DIRECT DEPOSIT)</label>
              <input 
                type="text" 
                className="form-input form-input-mono" 
                placeholder="e.g. 121000248"
                value={wireDetails.achRouting}
                onChange={(e) => setWireDetails({ ...wireDetails, achRouting: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">BANK BRANCH ADDRESS</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 270 Park Avenue, New York, NY 10017"
              value={wireDetails.bankAddress}
              onChange={(e) => setWireDetails({ ...wireDetails, bankAddress: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">PAYMENT INSTRUCTIONS NOTE</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Please include invoice number in wire reference memo."
              value={wireDetails.paymentInstructions}
              onChange={(e) => setWireDetails({ ...wireDetails, paymentInstructions: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end mt-4">
          <button type="submit" className="btn btn-primary btn-lg w-full sm:w-auto justify-center flex items-center gap-2">
            <Save size={18} />
            <span>Save Profile & Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
