import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormatService {

  formatMoney(amountInGrosze: number): string {
    return (amountInGrosze / 100).toFixed(2);
  }

  formatDate(timestamp: number | null): string {
    if (!timestamp) return 'No deadline';
    return new Date(timestamp * 1000).toLocaleDateString();
  }
}
