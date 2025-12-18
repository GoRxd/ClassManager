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

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showConfirm(options: {
    header: string,
    message: string,
    confirmText?: string,
    cancelText?: string,
    role?: 'destructive' | 'confirm'
  }): Promise<boolean> {
    return new Promise(async (resolve) => {
      let isResolved = false;
      const alert = await this.alertCtrl.create({
        header: options.header,
        message: options.message,
        backdropDismiss: false,
        buttons: [
          {
            text: options.cancelText || 'Cancel',
            role: 'cancel',
            handler: () => {
              if (!isResolved) {
                isResolved = true;
                resolve(false);
              }
            }
          },
          {
            text: options.confirmText || 'Confirm',
            role: options.role || 'confirm',
            handler: () => {
              if (!isResolved) {
                isResolved = true;
                resolve(true);
              }
            }
          }
        ]
      });
      await alert.present();

      // Safety net: resolve false if dismissed by other means (though backdropDismiss is false)
      alert.onDidDismiss().then(() => {
        if (!isResolved) {
          isResolved = true;
          resolve(false);
        }
      });
    });
  }
}
