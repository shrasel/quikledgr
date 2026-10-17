import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, Save, ShieldCheck, DollarSign, RotateCcw } from 'lucide-react';
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
        // Fallback to local storage
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
    onTriggerToast('Settings updated successfully. New invoices will automatically use these details.');
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Profile & Billing Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure your consultant entity, standard wage calculation rates, and banking instructions.
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary btn-sm self-start sm:self-auto text-slate-600 dark:text-slate-300"
          onClick={handleResetDefaults}
          title="Reset profile to empty defaults"
        >
          <RotateCcw size={14} />
          <span>Reset Defaults</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Consultant / Business Details */}
        <div className="card">
          <div className="card-header-clean">
            <div className="card-header-title-wrap">
              <div className="card-header-icon-box">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="card-header-heading">Consultant & Entity Profile</h2>
                <p className="card-header-subtext">
                  Your business credentials appear on every invoice as the issuing entity.
                </p>
              </div>
            </div>
          </div>

          <div className="card-body-clean space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Consultant Full Name *</label>
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
                <label className="form-label">Registered Business Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Jenkins Advisory & Consulting LLC"
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Professional Title / Role</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Principal Consultant"
                  value={profile.titleOrRole}
                  onChange={(e) => setProfile({ ...profile, titleOrRole: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tax ID / EIN / VAT</label>
                <input 
                  type="text" 
                  className="form-input form-input-mono" 
                  placeholder="e.g. 12-3456789"
                  value={profile.taxId}
                  onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
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
                <label className="form-label">Phone Number</label>
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
              <label className="form-label">Street Address</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 100 Financial Plaza, Suite 500"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">City, State, Zip</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. New York, NY 10001"
                  value={profile.cityStateZip}
                  onChange={(e) => setProfile({ ...profile, cityStateZip: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Country</label>
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
        </div>

        {/* Card 2: Wage & Billing Rate Profile */}
        <div className="card">
          <div className="card-header-clean">
            <div className="card-header-title-wrap">
              <div className="card-header-icon-box">
                <DollarSign size={18} />
              </div>
              <div>
                <h2 className="card-header-heading">Wage & Billing Defaults</h2>
                <p className="card-header-subtext">
                  Standard hourly rate and monthly hours to automatically pre-populate line items.
                </p>
              </div>
            </div>
          </div>

          <div className="card-body-clean space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Default Hourly Rate</label>
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

              <div className="form-group">
                <label className="form-label">Standard Monthly Hours</label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Default Currency</label>
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
                <label className="form-label">
                  Default Tax Rate (%)
                  <span className="form-label-hint">(Optional)</span>
                </label>
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
        </div>

        {/* Card 3: Wire Transfer & Banking Instructions */}
        <div className="card">
          <div className="card-header-clean">
            <div className="card-header-title-wrap">
              <div className="card-header-icon-box">
                <CreditCard size={18} />
              </div>
              <div>
                <h2 className="card-header-heading">Wire & Banking Instructions</h2>
                <p className="card-header-subtext">
                  Direct deposit and Fedwire details included in invoice payment instructions.
                </p>
              </div>
            </div>

            <span className="security-pill">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Encrypted Storage</span>
            </span>
          </div>

          <div className="card-body-clean space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Account Holder Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Jenkins Advisory LLC"
                  value={wireDetails.accountHolderName}
                  onChange={(e) => setWireDetails({ ...wireDetails, accountHolderName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. JPMorgan Chase Bank, N.A."
                  value={wireDetails.bankName}
                  onChange={(e) => setWireDetails({ ...wireDetails, bankName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Account Number / IBAN</label>
                <input 
                  type="text" 
                  className="form-input form-input-mono" 
                  placeholder="e.g. 123456789012"
                  value={wireDetails.accountNumberOrIban}
                  onChange={(e) => setWireDetails({ ...wireDetails, accountNumberOrIban: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SWIFT / BIC Code</label>
                <input 
                  type="text" 
                  className="form-input form-input-mono" 
                  placeholder="e.g. CHASUS33XXX"
                  value={wireDetails.swiftBicCode}
                  onChange={(e) => setWireDetails({ ...wireDetails, swiftBicCode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Routing Number (Fedwire / ABA)</label>
                <input 
                  type="text" 
                  className="form-input form-input-mono" 
                  placeholder="e.g. 021000021"
                  value={wireDetails.routingAba}
                  onChange={(e) => setWireDetails({ ...wireDetails, routingAba: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ACH Routing Number (Direct Deposit)</label>
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
              <label className="form-label">Bank Branch Address</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 270 Park Avenue, New York, NY 10017"
                value={wireDetails.bankAddress}
                onChange={(e) => setWireDetails({ ...wireDetails, bankAddress: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Instructions Memo</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Please include invoice number in wire reference memo."
                value={wireDetails.paymentInstructions}
                onChange={(e) => setWireDetails({ ...wireDetails, paymentInstructions: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
          <button 
            type="submit" 
            className="btn btn-primary btn-lg w-full sm:w-auto"
          >
            <Save size={16} />
            <span>Save Profile & Billing Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
