import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSearchbar } from '@ionic/angular/standalone';
import { SearchService } from '../../services/search.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, IonSearchbar, TranslatePipe],
  template: `
    <ion-searchbar 
      (ionInput)="onInput($event)" 
      (ionClear)="onClear()"
      [placeholder]=" 'COMMON.SEARCH' | translate "
      animated="true"
      class="custom-search">
    </ion-searchbar>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      padding: 16px 20px 0 20px;
    }
    ion-searchbar {
      --box-shadow: none;
      --border-radius: var(--app-border-radius);
      --background: var(--ion-color-light);
      padding-top: 0;
      padding-bottom: 8px;
    }
  `]
})
export class AppSearchComponent {
  private searchService = inject(SearchService);

  onInput(event: any) {
    const value = event.target.value;
    this.searchService.setQuery(value || '');
  }

  onClear() {
    this.searchService.clearQuery();
  }
}
