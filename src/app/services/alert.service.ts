import { Injectable } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { OpenNativeSettings } from "@ionic-native/open-native-settings/ngx";

@Injectable({
  providedIn: "root"
})
export class AlertService {
  constructor(
    private openNativeSettings: OpenNativeSettings,
    public alertController: AlertController
  ) {}

  presentAlertConfirm = async (title, message, okButtonText, cb) => {
    const alert = await this.alertController.create({
      header: title,
      message,
      buttons: [
        {
          text: "Cancel",
          role: "cancel",
          cssClass: "secondary",
          handler: event => {
            console.log("Confirm Cancel:", event);
          }
        },
        {
          text: okButtonText,
          handler: () => {
            if (okButtonText === "Location Settings") {
              this.openNativeSettings.open("location");
            } else {
              cb();
            }
          }
        }
      ]
    });

    await alert.present();
  };
}
