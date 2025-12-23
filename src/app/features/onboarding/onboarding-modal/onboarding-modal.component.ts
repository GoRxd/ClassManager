import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { SettingsService } from '../../../core/settings/settings.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { IonContent, IonButton, IonIcon, IonFooter, IonToolbar, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

export interface OnboardingSlide {
  title: string;
  desc: string;
  images: string[];
}

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

  // Define the slides data
  slides: OnboardingSlide[] = [
    {
      title: 'ONBOARDING.SLIDE_1_TITLE',
      desc: 'ONBOARDING.SLIDE_1_DESC',
      images: ['assets/icon/icon-512.png'] 
    },
    {
      title: 'ONBOARDING.SLIDE_GESTURES_TITLE',
      desc: 'ONBOARDING.SLIDE_GESTURES_DESC',
      images: [
        'assets/onboarding/slide_swipe_edit.png',
        'assets/onboarding/slide_swipe_delete.png'
      ]
    },
    {
      title: 'ONBOARDING.SLIDE_2_TITLE',
      desc: 'ONBOARDING.SLIDE_2_DESC',
      images: [
        'assets/onboarding/slide_students_list.png',
        'assets/onboarding/slide_students_add.png',
        'assets/onboarding/slide_student_details.png'
      ]
    },
    {
      title: 'ONBOARDING.SLIDE_3_TITLE',
      desc: 'ONBOARDING.SLIDE_3_DESC',
      images: [
        'assets/onboarding/slide_collections_list.png',
        'assets/onboarding/slide_collections_add.png'
      ]
    },
    {
      title: 'ONBOARDING.SLIDE_4_TITLE',
      desc: 'ONBOARDING.SLIDE_4_DESC',
      images: [
        'assets/onboarding/slide_expenses_list.png',
        'assets/onboarding/slide_expenses_add.png'
      ]
    }
  ];

  // Track the current internal image index for each slide
  // key: slide index, value: image index
  internalSlideState: { [key: number]: number } = {};

  constructor() {
    addIcons({ arrowForwardOutline, checkmarkOutline, closeOutline });
    // Initialize state
    this.slides.forEach((_, index) => {
      this.internalSlideState[index] = 0;
    });
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

  nextInternalImage(slideIndex: number) {
    if (this.internalSlideState[slideIndex] < this.slides[slideIndex].images.length - 1) {
      this.internalSlideState[slideIndex]++;
    } else {
      // Loop back or do nothing? Loop back is friendly.
      this.internalSlideState[slideIndex] = 0;
    }
  }
}
