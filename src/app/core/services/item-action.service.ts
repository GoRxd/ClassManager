import { Injectable, inject } from '@angular/core';
import { IonItemSliding } from '@ionic/angular/standalone';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root'
})
export class ItemActionService {
  private uiService = inject(UiService);

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
    title: string = 'Confirm Delete',
    message: string = 'Are you sure you want to delete this item?',
    successMessage: string = 'Item deleted'
  ): Promise<void> {
    

    
    const confirmed = await this.uiService.showConfirm(title, message);

    // Close the slide regardless of choice
    if (slidingItem) {
      await slidingItem.close();
    }

    if (confirmed) {
      try {
        await deleteFn();
        if (successMessage) {
            this.uiService.showToast(successMessage, 'medium');
        }
      } catch (error) {
        // Error handling acts as a fallback if the deleteFn doesn't handle it
        console.error('Delete action failed', error);
        this.uiService.showToast('Failed to delete item', 'danger');
      }
    }
  }

  /**
   * Handles a generic edit action.
   * Executes the edit function (usually opening a modal) and closes the slide.
   * 
   * @param slidingItem The IonItemSliding component instance.
   * @param editFn A function that performs the edit action (e.g., opens a modal).
   */
  async handleEdit(
    slidingItem: IonItemSliding | undefined,
    editFn: () => Promise<void> | void
  ): Promise<void> {
    // We execute the action
    await editFn();

    // And close the slide. 
    // Note: If editFn opens a modal, the slide closing might happen while modal is opening.
    // This is usually desired so when modal closes, the list is back to normal state.
    if (slidingItem) {
      await slidingItem.close();
    }
  }
}
