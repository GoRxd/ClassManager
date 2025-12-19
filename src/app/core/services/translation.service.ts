import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from '../settings/settings.service';

// We import the JSON to get the structure for typing
// Note: You might need "resolveJsonModule": true in tsconfig.json
import * as plDictionary from '../../../assets/i18n/pl.json';

export type TranslationDictionary = typeof plDictionary;

// Helper to get nested keys as a union type: "COMMON.SAVE" | "STUDENTS.TITLE" | ...
type Join<K, P> = K extends string | number ?
    P extends string | number ?
    `${K}${"" extends P ? "" : "."}${P}`
    : never : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];

type Paths<T, D extends number = 10> = [D] extends [never] ? never : T extends object ?
    { [K in keyof T]-?: K extends string | number ?
        `${K}` | Join<K, Paths<T[K], Prev[D]>>
        : never
    }[keyof T] : "";

export type TranslationKey = Paths<TranslationDictionary>;

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private http = inject(HttpClient);

    private settingsService = inject(SettingsService);

    private dictionary = signal<any>({});
    public currentLang = signal<'pl' | 'en'>('pl');
    public currency = computed(() => {
        const manual = this.settingsService.currency();
        if (manual) return manual;
        return this.dictionary()?.COMMON?.CURRENCY || 'PLN';
    });

    // Helper signal to know when translations are loaded
    public isLoaded = signal<boolean>(false);

    constructor() {
        this.initLanguage();
    }

    private async initLanguage() {
        const { value } = await Preferences.get({ key: 'language' });
        const lang = (value as 'pl' | 'en') || 'pl';
        await this.setLanguage(lang);
    }

    async setLanguage(lang: 'pl' | 'en') {
        try {
            const data = await firstValueFrom(this.http.get(`assets/i18n/${lang}.json`));
            this.dictionary.set(data);
            this.currentLang.set(lang);
            this.isLoaded.set(true);
            await Preferences.set({ key: 'language', value: lang });
        } catch (error) {
            console.error('Failed to load translations', error);
        }
    }

    translate(key: TranslationKey, params?: Record<string, any>): string {
        const dict = this.dictionary();
        if (!dict || Object.keys(dict).length === 0) return key;

        if (key === 'COMMON.CURRENCY') {
            return this.currency();
        }

        let value = this.getNestedValue(dict, key);

        if (!value) {
            console.warn(`Translation key not found: ${key}`);
            return key;
        }

        if (params) {
            Object.keys(params).forEach(p => {
                value = value.replace(new RegExp(`{{${p}}}`, 'g'), params[p]);
            });
        }

        return value;
    }

    private getNestedValue(obj: any, path: string): string {
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : null;
        }, obj);
    }

    // Reactive translation for signals
    public get(key: TranslationKey, params?: Record<string, any>) {
        return computed(() => this.translate(key, params));
    }
}
