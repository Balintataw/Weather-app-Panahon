import { Component, OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { LocationService } from '../services/location.service';
import { LoadingService } from '../services/loading.service';
import { AlertService } from '../services/alert.service';
import { WeatherService } from '../weather.service';

import * as _ from 'lodash';

export interface Address {
    address: {
        postcode: String
    }
};

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
    currentWeather: Number;
    currentIcon: String;
    zipCode: String;
    searching: Boolean = false;
    location: String;
    minTemp: Number;
    maxTemp: Number;
    precip: Number;
    humidity: Number;
    wind: Number;
    weatherResults: any;
    forcast: any[];

    constructor( 
        private weatherService: WeatherService, 
        private loadingService: LoadingService,
        private locationService: LocationService,
        private alertService: AlertService,
        private httpClient: HttpClient
    ) {}
    ngOnInit() {
        this.loadingService.present()
            .then(() => {
                this.getGeolocation();
            })
            .catch(err => {
                console.error("Loading service error", err);
            })
    };

    getGeolocation() {
        this.locationService.getGeolocation()
            .then((resp) => {
                let lat = resp.latitude;
                let long = resp.longitude;

                let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=AIzaSyCKsL0hAVI-OqB_XNfRLBcblkV07vylLAI`
                // let url = "http://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + long + "&addressdetails=1";
                this.httpClient.get(url).subscribe(
                    (resp: any) => {
                        let postCode = resp.results[0].address_components[6].long_name;
                        this.getWeather(postCode);
                    },
                    (error) => {
                        this.loadingService.dismiss();
                        console.error(error);
                    }
                )
            })
            .catch(err => {
                this.loadingService.dismiss();
                console.error("Get Location Error:", err);
                this.alertService.presentAlertConfirm(
                    'Oops!',  // title
                    'Please make sure location services are enabled.', // message
                    'Location Settings' // accept button text
                )
            })
    };

    getWeather(zipCode: String) {
        if(!this.loadingService.isLoading) {
            this.loadingService.present();
        }
        this.weatherService.getWeather(zipCode).subscribe(
            (resp: any) => {
                this.weatherResults = resp;
                this.currentWeather = resp.current.temp_f;
                this.currentIcon = resp.current.condition.icon;
                this.location = resp.location.name;
                this.precip = resp.current.precip_in;
                this.wind = resp.current.wind_mph;
                this.humidity = resp.current.humidity;

                _.each(resp.forecast, (data) => {
                    this.forcast = data;
                    this.minTemp = data[0].day.mintemp_f;
                    this.maxTemp = data[0].day.maxtemp_f;
                })
            },
            (error) => {
                this.loadingService.dismiss();
                console.error(error);
            },
            () => {
                this.loadingService.dismiss();
                this.zipCode = '';
            }
        );
    };

    toggleSearch() {
        this.searching = !this.searching;
        this.zipCode = '';
    };
};
