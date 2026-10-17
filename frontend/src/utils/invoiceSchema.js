import { generateRandomPin } from './cryptoUtils';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
];

// Helper to get formatted dates
export function getPreviousMonthPeriod() {
  const now = new Date();
  // Service period is typically the preceding month
  const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Due date is no later than 15th of following month (which is current month)
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 15);

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const servicePeriodLabel = `${monthNames[firstDayPrevMonth.getMonth()]} 1 – ${monthNames[firstDayPrevMonth.getMonth()]} ${lastDayPrevMonth.getDate()}, ${firstDayPrevMonth.getFullYear()}`;

  return {
    invoiceDate: formatDate(now),
    serviceStartDate: formatDate(firstDayPrevMonth),
    serviceEndDate: formatDate(lastDayPrevMonth),
    servicePeriodLabel,
    dueDate: formatDate(dueDate),
  };
}

export function getCurrentMonthPeriod() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const servicePeriodLabel = `${monthNames[now.getMonth()]} 1 – ${monthNames[now.getMonth()]} ${lastDay.getDate()}, ${now.getFullYear()}`;

  return {
    invoiceDate: formatDate(now),
    serviceStartDate: formatDate(firstDay),
    serviceEndDate: formatDate(lastDay),
    servicePeriodLabel,
    dueDate: formatDate(dueDate),
  };
}

export function createBlankInvoice() {
  const dates = getCurrentMonthPeriod();
  const invoiceId = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const securityPin = generateRandomPin();

  return {
    id: invoiceId,
    invoiceNumber: invoiceId,
    title: 'CONSULTING SERVICES INVOICE',
    currency: 'USD',
    currencySymbol: '$',
    status: 'draft', // draft, sent, paid, overdue
    createdAt: new Date().toISOString(),
    
    // Dates
    invoiceDate: dates.invoiceDate,
    dueDate: dates.dueDate,
    serviceStartDate: dates.serviceStartDate,
    serviceEndDate: dates.serviceEndDate,
    servicePeriod: dates.servicePeriodLabel,
    paymentTerms: 'Payment due on or before the 15th of the month',

    // Sender / Issuer (Your Info)
    issuer: {
      name: '',
      businessName: '',
      titleOrRole: 'Senior Consultant',
      email: '',
      phone: '',
      address: '',
      cityStateZip: '',
      country: 'United States',
      taxId: '', // SSN / EIN / VAT
      logoUrl: '',
    },

    // Client ("Bill To")
    client: {
      companyName: '',
      contactName: '',
      email: '',
      ccEmail: '',
      address: '',
      cityStateZip: '',
      country: '',
      notes: '',
    },

    // Line items
    items: [
      {
        id: 'item_1',
        description: 'Professional Consulting Services',
        category: 'consulting', // consulting or additional_charge
        quantity: 160,
        rate: 85,
        amount: 13600,
      }
    ],

    // Additional pre-approved charges
    additionalCharges: [
      {
        id: 'charge_1',
        description: 'Pre-approved Cloud Hosting & Tooling Reimbursable',
        amount: 150,
      }
    ],

    // Financial calculations
    discountRate: 0,
    discountAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    subtotal: 13600,
    additionalChargesTotal: 150,
    total: 13750,

    // Sensitive Wire Transfer Details (Protected by Security Code)
    wireDetails: {
      accountHolderName: '',
      bankName: '',
      bankAddress: '',
      accountNumberOrIban: '',
      swiftBicCode: '',
      routingAba: '',
      achRouting: '',
      intermediaryBank: '',
      wireReference: '',
      paymentInstructions: 'Please include the invoice number in the wire transfer reference/memo field.',
    },

    // Security
    security: {
      requireCode: true,
      accessPin: securityPin,
      passcodeHint: 'Enter the 6-digit access PIN provided by the consultant to unlock sensitive wire details.',
    },

    // Additional Notes & Disclaimers
    notes: 'Thank you for your business. In accordance with the Consulting Agreement, this invoice reflects professional services rendered for the specified service period.',
    agreementComplianceNote: 'Submitted in accordance with the Consulting Agreement. Payment required no later than the 15th day of the month.',
  };
}

export function createBlukersInvoiceTemplate() {
  const dates = getPreviousMonthPeriod();
  const invoiceId = 'BLK-' + new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + Math.floor(100 + Math.random() * 900);
  const securityPin = generateRandomPin();

  return {
    id: invoiceId,
    invoiceNumber: invoiceId,
    title: 'MONTHLY CONSULTING SERVICES INVOICE',
    currency: 'USD',
    currencySymbol: '$',
    status: 'draft',
    createdAt: new Date().toISOString(),

    // Dates matching Blukers requirements:
    // Submitted no later than 15th of the following month
    invoiceDate: dates.invoiceDate,
    dueDate: dates.dueDate,
    serviceStartDate: dates.serviceStartDate,
    serviceEndDate: dates.serviceEndDate,
    servicePeriod: dates.servicePeriodLabel,
    paymentTerms: 'Payment due on or before the 15th of following month (Consulting Agreement)',

    // Issuer (pre-filled with realistic placeholder ready to personalize)
    issuer: {
      name: 'Alexander Wright',
      businessName: 'Wright Advisory & Solutions LLC',
      titleOrRole: 'Principal Technology Consultant',
      email: 'alex@wrightsolutions.io',
      phone: '+1 (555) 234-5678',
      address: '100 Innovation Way, Suite 400',
      cityStateZip: 'San Francisco, CA 94105',
      country: 'United States',
      taxId: 'XX-XXX4920',
      logoUrl: '',
    },

    // Client (Blukers specific guidelines)
    client: {
      companyName: 'Blukers, Inc.',
      contactName: 'Accounting Department / Rosa',
      email: 'accounting@blukers.com',
      ccEmail: 'rosa@blukers.com',
      address: 'Blukers Corporate Headquarters',
      cityStateZip: 'Miami, FL 33131',
      country: 'United States',
      notes: 'Monthly Consulting Invoice for Blukers, Inc.',
    },

    // Line items per agreement
    items: [
      {
        id: 'item_1',
        description: 'Strategic Advisory & Technical Execution (Month of ' + dates.servicePeriodLabel.split('–')[0].trim() + ') - System architecture, integrations & support',
        category: 'consulting',
        quantity: 160,
        rate: 95.00,
        amount: 15200.00,
      }
    ],

    // Pre-approved additional charges
    additionalCharges: [
      {
        id: 'charge_1',
        description: 'Pre-Approved Project Infrastructure & API License Charges',
        amount: 320.00,
      }
    ],

    discountRate: 0,
    discountAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    subtotal: 15200.00,
    additionalChargesTotal: 320.00,
    total: 15520.00,

    // Sensitive Banking details (Blukers requirement)
    wireDetails: {
      accountHolderName: 'Wright Advisory & Solutions LLC',
      bankName: 'JPMorgan Chase Bank, N.A.',
      bankAddress: '270 Park Avenue, New York, NY 10017, USA',
      accountNumberOrIban: '984729104829',
      swiftBicCode: 'CHASUS33XXX',
      routingAba: '021000021 (Wire / Fedwire)',
      achRouting: '121000248 (ACH Direct Deposit)',
      intermediaryBank: '',
      wireReference: 'INV-BLK-' + new Date().getFullYear() + ' - Alexander Wright',
      paymentInstructions: 'Please route wire transfer to JPMorgan Chase Bank. Ensure the Wire Reference code is included in the transfer description for proper ledger crediting.',
    },

    security: {
      requireCode: true,
      accessPin: securityPin,
      passcodeHint: 'Enter your 6-digit access code to unlock confidential wire routing details.',
    },

    notes: 'Thank you for the opportunity to partner with Blukers. Services delivered in full compliance with our Consulting Agreement. All deliverable milestones were reviewed and accepted.',
    agreementComplianceNote: 'Submitted in accordance with the Blukers Consulting Agreement. Submitted before the 15th day of the following month to accounting@blukers.com (cc: rosa@blukers.com).',
  };
}

export function calculateInvoiceTotals(invoice) {
  const subtotal = (invoice.items || []).reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + (qty * rate);
  }, 0);

  const additionalChargesTotal = (invoice.additionalCharges || []).reduce((sum, chg) => {
    return sum + (parseFloat(chg.amount) || 0);
  }, 0);

  let discountAmount = 0;
  if (invoice.discountRate && invoice.discountRate > 0) {
    discountAmount = (subtotal * invoice.discountRate) / 100;
  } else if (invoice.discountAmount) {
    discountAmount = parseFloat(invoice.discountAmount) || 0;
  }

  const taxableBase = Math.max(0, subtotal - discountAmount);
  let taxAmount = 0;
  if (invoice.taxRate && invoice.taxRate > 0) {
    taxAmount = (taxableBase * invoice.taxRate) / 100;
  } else if (invoice.taxAmount) {
    taxAmount = parseFloat(invoice.taxAmount) || 0;
  }

  const total = taxableBase + additionalChargesTotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    additionalChargesTotal: Math.round(additionalChargesTotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function formatMoney(amount, currencyCode = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch (e) {
    return '$' + (amount || 0).toFixed(2);
  }
}
