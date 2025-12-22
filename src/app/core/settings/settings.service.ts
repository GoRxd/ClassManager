import { Injectable, computed, signal, effect, inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  currency: string;
}

const SETTINGS_KEY = 'app_settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  // Signals
  private state = signal<AppSettings>({
    theme: 'dark', // Default to dark as requested
    currency: ''   // Empty means "use language default"
  });

  readonly theme = computed(() => this.state().theme);
  readonly currency = computed(() => this.state().currency);

  constructor() {
    this.loadSettings();
    this.listenToSystemChanges();

    // Effect to apply Dark Mode class to body
    effect(() => {
      const theme = this.theme();
      this.applyTheme(theme);
    });
  }

  private loadSettings() {
    // Try to load from localStorage for instant synchronous apply (prevents flash)
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate old "darkMode" boolean if exists
        if ('darkMode' in parsed) {
          parsed.theme = parsed.darkMode ? 'dark' : 'light';
          delete parsed.darkMode;
        }
        this.state.set({ ...this.state(), ...parsed });
      } catch (e) {
        console.error('Error parsing settings', e);
      }
    }
  }

  async setTheme(theme: 'dark' | 'light' | 'auto') {
    this.state.update(s => ({ ...s, theme }));
    this.saveSettings();
  }

  async setCurrency(currency: string) {
    this.state.update(s => ({ ...s, currency }));
    this.saveSettings();
  }

  async checkOnboardingStatus(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'hasSeenOnboarding' });
    return value === 'true';
  }

  async completeOnboarding() {
    await Preferences.set({ key: 'hasSeenOnboarding', value: 'true' });
  }

  private saveSettings() {
    const data = JSON.stringify(this.state());
    localStorage.setItem(SETTINGS_KEY, data);
    // Also save to Preferences for native persistence if needed, but localStorage is fine for style preferences
    Preferences.set({ key: SETTINGS_KEY, value: data });
  }

  private applyTheme(theme: 'dark' | 'light' | 'auto') {
    let isDark = false;

    if (theme === 'auto') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = theme === 'dark';
    }

    document.body.classList.toggle('dark', isDark);
  }

  private listenToSystemChanges() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (this.theme() === 'auto') {
        this.applyTheme('auto');
      }
    });
  }
}
