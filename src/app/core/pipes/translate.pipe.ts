import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService, TranslationKey } from '../services/translation.service';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: false // Necessary for signal reactivity within the pipe
})
export class TranslatePipe implements PipeTransform {
    private translationService = inject(TranslationService);

    transform(key: string, params?: Record<string, any>): string {
        // If it's a valid key, translate it. If not, return as is.
        // Using 'any' for key here because the string might not be a TranslationKey type in the template
        return this.translationService.translate(key as any, params);
    }
}
