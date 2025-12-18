import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [CommonModule, IonIcon],
    template: `
    <div class="empty-state-container">
      <ion-icon [name]="icon"></ion-icon>
      <h3>{{ title }}</h3>
      <p *ngIf="description">{{ description }}</p>
    </div>
  `,
    styles: [`
    /* Styles are mostly inherited from global.scss .empty-state-container */
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class EmptyStateComponent {
    @Input() icon: string = 'help-outline';
    @Input() title: string = 'No data';
    @Input() description: string = '';
}
