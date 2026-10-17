import { Injectable, signal, effect, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'quikledgr_theme';
  
  // Angular Signal for reactive theme state
  theme = signal<'light' | 'dark'>(this.getInitialTheme());
  isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const current = this.theme();
      localStorage.setItem(this.THEME_KEY, current);
      if (current === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    });
  }

  toggleTheme(): void {
    this.theme.update(t => t === 'dark' ? 'light' : 'dark');
  }

  private getInitialTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
