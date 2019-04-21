import { Component, OnInit } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderOptions } from '@ionic-native/native-geocoder/ngx';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

import { WeatherService } from '../weather.service';
import { LoadingService } from '../loading.service';

export interface Address {
    address: {
        postcode: String
    }
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
    currentWeather: Number;
    zipCode: String;
    searching: Boolean = false;
    location: String;
    minTemp: Number;
    maxTemp: Number;
    precip: Number;
    wind: Number;
    weatherResults: any;
    forcast: any[];
    isApp: Boolean = false;

    constructor( 
        private weatherService: WeatherService, 
        private loadingService: LoadingService,
        private geolocation: Geolocation,
        private nativeGeocoder: NativeGeocoder,
        private httpClient: HttpClient
    ) {}
    ngOnInit() {
        this.isApp = !document.URL.startsWith('http');
        this.loadingService.present();
        this.getGeolocation()
    }

    getGeolocation() {
        this.geolocation.getCurrentPosition().then((resp) => {
            console.log("Coords", resp)
            let lat = resp.coords.latitude
            let long = resp.coords.longitude
            if(this.isApp) {

                let options: NativeGeocoderOptions = {
                    useLocale: true,
                    maxResults: 5
                };
                this.nativeGeocoder.reverseGeocode(lat, long, options)
                    .then((result: any[]) => console.log(JSON.stringify('F', result[0])))
                    .catch((error: any) => console.log(error));

                let watch = this.geolocation.watchPosition();
                watch.subscribe((data) => {
                    console.log("Sub", data)
                    // data can be a set of coordinates, or an error (if an error occurred).
                    // data.coords.latitude
                    // data.coords.longitude
                });
            } else {
                let url = "http://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + long + "&addressdetails=1";
                this.httpClient.get(url).subscribe((resp: Address) => {
                    console.log("API", resp)
                    let postcode = resp.address.postcode
                    this.getWeather(postcode);
                })
            }
        });
    }

    getWeather(zipCode: String) {
        this.weatherService.getWeather(zipCode).subscribe(
            (resp: any) => {
                console.log("resp", resp);
                this.weatherResults = resp;
                this.currentWeather = resp.current.temp_f;
                this.location = resp.location.name;
                this.precip = resp.current.precip_in;
                this.wind = resp.current.wind_mph

                _.each(resp.forecast, (data) => {
                    console.log("DATA", data)
                    this.forcast = data;
                    this.minTemp = data[0].day.mintemp_f;
                    this.maxTemp = data[0].day.maxtemp_f;
                })
            }
        );
        this.loadingService.dismiss()
    }

    toggleSearch() {
        this.searching = !this.searching;
        this.zipCode = '';
    }
}
