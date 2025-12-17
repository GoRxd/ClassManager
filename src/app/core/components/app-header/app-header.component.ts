import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonMenuButton, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonMenuButton, IonTitle, CommonModule]
})
export class AppHeaderComponent {
  @Input() title!: string;
  @Input() isRoot: boolean = false;
  @Input() backDefaultHref: string = '/home';
}
