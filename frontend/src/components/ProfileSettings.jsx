import React, { useState, useEffect } from 'react';
import { Building, CreditCard, Save, CheckCircle, ShieldCheck } from 'lucide-react';
import { getIssuerProfile, saveIssuerProfile } from '../utils/storage';
import { profileApi } from '../api/client';

export function ProfileSettings({ onTriggerToast }) {
  const [profile, setProfile] = useState({
    name: 'Alexander Wright',
    businessName: 'Wright Advisory & Solutions LLC',
    titleOrRole: 'Principal Technology Consultant',
    email: 'alex@wrightsolutions.io',
    phone: '+1 (555) 234-5678',
    address: '100 Innovation Way, Suite 400',
    cityStateZip: 'San Francisco, CA 94105',
    country: 'United States',
    taxId: 'XX-XXX4920',
  });

  const [wireDetails, setWireDetails] = useState({
    accountHolderName: 'Wright Advisory & Solutions LLC',
    bankName: 'JPMorgan Chase Bank, N.A.',
    bankAddress: '270 Park Avenue, New York, NY 10017, USA',
    accountNumberOrIban: '984729104829',
    swiftBicCode: 'CHASUS33XXX',
    routingAba: '021000021 (Wire / Fedwire)',
    achRouting: '121000248 (ACH Direct Deposit)',
    paymentInstructions: 'Please include the invoice number in the wire transfer memo field.',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const remote = await profileApi.get();
        if (remote?.profile) setProfile(remote.profile);
        if (remote?.wireDetails) setWireDetails(remote.wireDetails);
        return;
      } catch (e) {
        // Fallback to local
      }
      const saved = getIssuerProfile();
      if (saved) {
        if (saved.profile) setProfile(saved.profile);
        if (saved.wireDetails) setWireDetails(saved.wireDetails);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    saveIssuerProfile(profile, wireDetails);
    try {
      await profileApi.update(profile, wireDetails);
    } catch (e) {
      console.warn('[ProfileSettings] Saved locally (backend offline)');
    }
    onTriggerToast('Saved your profile and wire instructions! New invoices will automatically use these details.');
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Building size={22} color="var(--primary-600)" />
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Consultant / Business Profile</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Your business details appear on all invoices as the issuing party.
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">CONSULTANT FULL NAME</label>
              <input 
                type="text" 
                className="form-input" 
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
                value={profile.titleOrRole}
                onChange={(e) => setProfile({ ...profile, titleOrRole: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">TAX ID / EIN / VAT</label>
              <input 
                type="text" 
                className="form-input form-input-mono" 
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
                value={profile.cityStateZip}
                onChange={(e) => setProfile({ ...profile, cityStateZip: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">COUNTRY</label>
              <input 
                type="text" 
                className="form-input" 
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Wire Transfer Details Card */}
        <div className="wire-transfer-section" style={{ marginBottom: '1.5rem' }}>
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

          <p style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '1.25rem' }}>
            Store your wire transfer information here so that every monthly invoice can be populated in one click.
          </p>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">ACCOUNT HOLDER NAME</label>
              <input 
                type="text" 
                className="form-input" 
                value={wireDetails.accountHolderName}
                onChange={(e) => setWireDetails({ ...wireDetails, accountHolderName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">BANK NAME</label>
              <input 
                type="text" 
                className="form-input" 
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
                value={wireDetails.accountNumberOrIban}
                onChange={(e) => setWireDetails({ ...wireDetails, accountNumberOrIban: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SWIFT / BIC CODE</label>
              <input 
                type="text" 
                className="form-input form-input-mono" 
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
                value={wireDetails.routingAba}
                onChange={(e) => setWireDetails({ ...wireDetails, routingAba: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ACH ROUTING NUMBER (DIRECT DEPOSIT)</label>
              <input 
                type="text" 
                className="form-input form-input-mono" 
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
              value={wireDetails.bankAddress}
              onChange={(e) => setWireDetails({ ...wireDetails, bankAddress: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">PAYMENT INSTRUCTIONS NOTE</label>
            <input 
              type="text" 
              className="form-input" 
              value={wireDetails.paymentInstructions}
              onChange={(e) => setWireDetails({ ...wireDetails, paymentInstructions: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end mt-4">
          <button type="submit" className="btn btn-primary btn-lg w-full sm:w-auto justify-center flex items-center gap-2">
            <Save size={18} />
            <span>Save Profile & Banking Details</span>
          </button>
        </div>
      </form>
    </div>
  );
}
