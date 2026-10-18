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
    // Ensure document reflects current initial theme immediately on boot
    const initial = this.theme();
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }

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
    // Default website theme is ALWAYS light as default
    return 'light';
  }
}
