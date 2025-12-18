import { Pipe, PipeTransform, inject } from '@angular/core';
import { SettingsService } from '../settings/settings.service';

@Pipe({
    name: 'money',
    standalone: true
})
export class MoneyPipe implements PipeTransform {
    private settingsService = inject(SettingsService);

    transform(value: number | undefined | null): string {
        const amount = (value || 0) / 100;

        const formattedAmount = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);

        return `${formattedAmount} ${this.settingsService.currency()}`;
    }
}
