import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormatService {

  formatMoney(amountInGrosze: number): string {
    return this.toPLN(amountInGrosze).toFixed(2);
  }

  toPLN(amountInGrosze: number): number {
    return (amountInGrosze || 0) / 100;
  }

  toGrosze(pln: number): number {
    return Math.round((pln || 0) * 100);
  }

  cleanPhone(phone: string): string {
    return (phone || '').replace(/[\s-]/g, '');
  }

  formatDate(timestamp: number | null): string {
    if (!timestamp) return 'No deadline';
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  toTimestamp(date: string | Date): number {
    return Math.floor(new Date(date).getTime() / 1000);
  }

  formatPhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
}
