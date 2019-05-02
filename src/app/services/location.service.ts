import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

    constructor(
        private geolocation: Geolocation,
    ) { }

    getGeolocation() {
        let options = {timeout: 15000, enableHighAccuracy: false, maximumAge: 5000};
        return this.geolocation.getCurrentPosition(options)
            .then((resp) => {
                return resp.coords;
                // let lat = resp.coords.latitude;
                // let long = resp.coords.longitude;
            })
    };
}
