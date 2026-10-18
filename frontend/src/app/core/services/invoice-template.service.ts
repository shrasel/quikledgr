import { Injectable, signal, computed } from '@angular/core';

export type InvoiceTemplateId = 'modern' | 'executive' | 'creative';

export interface InvoiceTemplateOption {
  id: InvoiceTemplateId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  accentColor: string;
  recommendedFor: string;
  highlights: string[];
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceTemplateService {
  private readonly STORAGE_KEY = 'quikledgr_invoice_template';

  readonly templates: InvoiceTemplateOption[] = [
    {
      id: 'modern',
      name: 'Modern Minimalist',
      tagline: 'Stripe & Linear Inspired Precision',
      description: 'Clean Swiss typography, generous whitespace, subtle borders, and razor-sharp financial figures. The global gold standard for modern tech and SaaS.',
      badge: 'Most Popular',
      accentColor: '#3C50E0',
      recommendedFor: 'Software, IT consulting, digital services & high-growth startups',
      highlights: [
        'Minimalist high-contrast Swiss grid layout',
        'Tabular font-mono alignment for numbers',
        'Clean metadata pills and quick-settlement wire card',
        'Ultra-fast print & PDF rendering'
      ]
    },
    {
      id: 'executive',
      name: 'Executive Enterprise',
      tagline: 'QuickBooks & Big-4 Corporate Standard',
      description: 'Formal corporate ledger styling with branded header band, tax ID / VAT registration blocks, official remittance slip, and authorized signatory line.',
      badge: 'Corporate Standard',
      accentColor: '#1C2434',
      recommendedFor: 'Enterprise vendors, accounting firms, legal & consulting corporations',
      highlights: [
        'Deep navy/slate executive brand header bar',
        'Formal 2-column legal entity & client tax boxes',
        'Structured zebra line items with explicit quantity & unit rates',
        'Authorized corporate signatory & remittance slip'
      ]
    },
    {
      id: 'creative',
      name: 'Creative Studio',
      tagline: 'Figma & Editorial Agency Aesthetic',
      description: 'Contemporary asymmetric styling with vivid accents, prominent Amount Due hero banner, milestone deliverable pills, and designer client appreciation note.',
      badge: 'Design Favorite',
      accentColor: '#10B981',
      recommendedFor: 'Creative agencies, design studios, media production & marketing partners',
      highlights: [
        'Dynamic Amount Due hero callout card',
        'Vibrant modern typography with editorial accents',
        'Service deliverable badges & project engagement period',
        'Client appreciation note & direct portal checkout badge'
      ]
    }
  ];

  // Default template signal (persisted in localStorage)
  defaultTemplate = signal<InvoiceTemplateId>(this.getInitialTemplate());

  // Active template signal for live viewing (can be toggled temporarily when inspecting an invoice)
  activeTemplate = signal<InvoiceTemplateId>(this.defaultTemplate());

  selectedTemplateOption = computed(() => {
    return this.templates.find(t => t.id === this.defaultTemplate()) || this.templates[0];
  });

  constructor() {
    this.activeTemplate.set(this.defaultTemplate());
  }

  setDefaultTemplate(id: InvoiceTemplateId): void {
    if (this.templates.some(t => t.id === id)) {
      this.defaultTemplate.set(id);
      this.activeTemplate.set(id);
      try {
        localStorage.setItem(this.STORAGE_KEY, id);
      } catch (e) {
        console.warn('Could not persist default template to localStorage:', e);
      }
    }
  }

  setActiveTemplate(id: InvoiceTemplateId): void {
    if (this.templates.some(t => t.id === id)) {
      this.activeTemplate.set(id);
    }
  }

  resetToDefault(): void {
    this.activeTemplate.set(this.defaultTemplate());
  }

  private getInitialTemplate(): InvoiceTemplateId {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as InvoiceTemplateId;
      if (saved && (saved === 'modern' || saved === 'executive' || saved === 'creative')) {
        return saved;
      }
    } catch {}
    // Default world-class template is 'modern'
    return 'modern';
  }
}
