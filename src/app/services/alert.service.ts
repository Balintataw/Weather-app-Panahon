import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { OpenNativeSettings } from '@ionic-native/open-native-settings/ngx';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

    constructor(
        private openNativeSettings: OpenNativeSettings,
        public alertController: AlertController) {}

    async presentAlertConfirm(title, message, okButtonText) {
        const alert = await this.alertController.create({
          header: title,
          message: message,
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary',
              handler: (blah) => {
                console.log('Confirm Cancel: blah');
              }
            }, 
            {
              text: okButtonText,
              handler: () => {
                console.log('Confirm Okay');
                this.openNativeSettings.open('location');
              }
            }
          ]
        });
    
        await alert.present();
    }
}
