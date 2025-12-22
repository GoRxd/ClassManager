import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { SettingsService } from '../../../core/settings/settings.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { IonContent, IonButton, IonIcon, IonFooter, IonToolbar, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-onboarding-modal',
  templateUrl: './onboarding-modal.component.html',
  styleUrls: ['./onboarding-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonButton, IonIcon, IonFooter, IonToolbar, IonButtons,
    TranslatePipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OnboardingModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private settingsService = inject(SettingsService);

  @Input() isFirstLaunch: boolean = false;
  @ViewChild('swiper') swiperRef: ElementRef | undefined;

  isEnd = false;

  constructor() {
    addIcons({ arrowForwardOutline, checkmarkOutline, closeOutline });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    if (this.swiperRef?.nativeElement) {
      const swiperEl = this.swiperRef.nativeElement;
      
      swiperEl.addEventListener('swiperslidechange', (e: any) => {
        const [swiper] = e.detail;
        this.isEnd = swiper.isEnd;
      });
    }
  }

  async close() {
    if (this.isFirstLaunch) {
      await this.settingsService.completeOnboarding();
    }
    await this.modalCtrl.dismiss();
  }

  next() {
    this.swiperRef?.nativeElement.swiper.slideNext();
  }
}
