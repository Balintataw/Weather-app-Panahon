import { Injectable } from "@angular/core";
import { Plugins } from "@capacitor/core";

const { Geolocation } = Plugins;

@Injectable({
  providedIn: "root"
})
export class LocationService {
  // constructor(private geolocation: Geolocation) { }

  async getGeolocation() {
    const options = {
      timeout: 15000,
      enableHighAccuracy: false,
      maximumAge: 5000
    };
    const { coords } = await Geolocation.getCurrentPosition(options);
    return coords;
  }
}
