import { Injectable, inject } from '@angular/core';
import { IonItemSliding } from '@ionic/angular/standalone';
import { UiService } from './ui.service';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class ItemActionService {
  private uiService = inject(UiService);
  private translationService = inject(TranslationService);

  /**
   * Handles a generic delete action with confirmation.
   * Closes the sliding item regardless of the outcome.
   * 
   * @param slidingItem The IonItemSliding component instance.
   * @param deleteFn A function that returns a Promise, performing the actual delete operation.
   * @param title Title for the confirmation dialog.
   * @param message Message for the confirmation dialog.
   * @param successMessage Toast message to show on success.
   */
  async handleDelete(
    slidingItem: IonItemSliding | undefined,
    deleteFn: () => Promise<void>,
    title?: string,
    message?: string,
    successMessage?: string
  ): Promise<void> {
    const tTitle = title || this.translationService.translate('COMMON.DELETE_CONFIRM_TITLE');
    const tMessage = message || 'Are you sure?'; // Specific message should ideally be provided
    const tSuccess = successMessage || this.translationService.translate('COMMON.ITEM_DELETED');

    const confirmed = await this.uiService.showConfirm({
      header: tTitle,
      message: tMessage,
      confirmText: this.translationService.translate('COMMON.DELETE'),
      role: 'destructive'
    });

    // Close the slide regardless of choice
    if (slidingItem) {
      await slidingItem.close();
    }

    if (confirmed) {
      try {
        await deleteFn();
        if (tSuccess) {
          this.uiService.showToast(tSuccess, 'medium');
        }
      } catch (error) {
        console.error('Delete action failed', error);
        this.uiService.showToast(this.translationService.translate('COMMON.ERROR_DELETE'), 'danger');
      }
    }
  }

  /**
   * Handles a generic edit action.
   */
  async handleEdit(
    slidingItem: IonItemSliding | undefined,
    editFn: () => Promise<void> | void
  ): Promise<void> {
    await editFn();
    if (slidingItem) {
      await slidingItem.close();
    }
  }
}
