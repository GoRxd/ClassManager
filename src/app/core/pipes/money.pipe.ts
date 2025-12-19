import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
    name: 'money',
    standalone: true,
    pure: false
})
export class MoneyPipe implements PipeTransform {
    private translationService = inject(TranslationService);

    transform(value: number | undefined | null): string {
        const amount = (value || 0) / 100;

        const formattedAmount = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);

        const currency = this.translationService.translate('COMMON.CURRENCY');
        return `${formattedAmount} ${currency}`;
    }
}
