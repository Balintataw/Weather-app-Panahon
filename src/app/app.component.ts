import { Component } from "@angular/core";
import { CacheService } from "ionic-cache";

import { Platform } from "@ionic/angular";
import { Plugins, SplashScreenPlugin, StatusBarBackgroundColorOptions, StatusBarStyle } from "@capacitor/core";

const { SplashScreen, StatusBar } = Plugins;

@Component({
  selector: "app-root",
  templateUrl: "app.component.html"
})
export class AppComponent {
  constructor(
    private platform: Platform,
    // private splashScreen: SplashScreenPlugin,
    // private statusBar: StatusBarPlugin,
    cache: CacheService
  ) {
    cache.setDefaultTTL(60 * 60);
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      StatusBar.setStyle({
        style: StatusBarStyle.Light,
      });
      StatusBar.setBackgroundColor({
        color: "rgb(248, 248, 248)"
      });
      SplashScreen.hide();
    });
  }
}
