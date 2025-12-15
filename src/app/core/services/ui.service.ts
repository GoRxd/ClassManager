import { Injectable, inject } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular/standalone';

@Injectable({ providedIn: 'root' })
export class UiService {
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  async showToast(msg: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  async showConfirm(header: string, message: string, confirmText: string = 'Delete'): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header,
        message,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: confirmText,
            role: 'destructive',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }
}
