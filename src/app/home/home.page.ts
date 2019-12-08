import { Component, OnInit } from "@angular/core";

import { HttpClient } from "@angular/common/http";

import { LocationService } from "../services/location.service";
import { LoadingService } from "../services/loading.service";
import { AlertService } from "../services/alert.service";
import { WeatherService, WeatherApiResponse } from "../weather.service";

import * as _ from "lodash";

export interface Address {
  address: {
    postcode: string;
  };
}

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"]
})
export class HomePage implements OnInit {
  currentTemp: number;
  currentDate: Date;
  currentConditionIcon: string;
  zipCode: string | number;
  searching: boolean = false;
  location: string;
  minTemp: number;
  maxTemp: number;
  precip: number;
  humidity: number;
  wind: number;
  weatherResults: any;
  forecast: any[];

  constructor(
    private weatherService: WeatherService,
    private loadingService: LoadingService,
    private locationService: LocationService,
    private alertService: AlertService,
    private httpClient: HttpClient
  ) {}
  ngOnInit() {
    this.loadingService
      .present()
      .then(() => {
        this.getGeolocation();
      })
      .catch(err => {
        console.error("Loading service error", err);
      });
  }

  getGeolocation() {
    this.locationService
      .getGeolocation()
      .then(resp => {
        const lat = resp.latitude;
        const long = resp.longitude;

        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=AIzaSyCKsL0hAVI-OqB_XNfRLBcblkV07vylLAI`;
        this.httpClient.get(url).subscribe(
          async (resp: any) => {
            console.log("RESP", resp);
            // const postCode = resp.results[0].address_components[6].long_name;
            this.zipCode = resp.results[0].address_components[6].long_name;
            this.getWeather();
          },
          error => {
            this.loadingService.dismiss();
            console.error(error);
          }
        );
      })
      .catch(err => {
        this.loadingService.dismiss();
        console.error("Get Location Error:", err);
        this.alertService.presentAlertConfirm(
          "Oops!", // title
          "Please make sure location services are enabled.", // message
          "Location Settings", // accept button text
          null
        );
      });
  }

  getWeather() {
    if (!this.loadingService.isLoading) {
      this.loadingService.present();
    }
    // this.loadingService.dismiss();
    // this.alertService.presentAlertConfirm(
    //   "Oops!", // title
    //   "Something went wrong getting the weather.", // message
    //   "Try Again", // accept button text
    //   this.getWeather
    // );
    console.log("ZIP", this.zipCode);
    this.weatherService.getWeather(this.zipCode).subscribe(
      (resp: WeatherApiResponse) => {
        this.weatherResults = resp;
        this.currentDate = new Date();
        this.currentTemp = Math.round(resp.main.temp);
        this.currentConditionIcon = `http://openweathermap.org/img/w/${resp.weather[0].icon}.png`;
        this.location = resp.name;
        this.precip = (resp.rain && resp.rain["1h"]) || 0;
        this.wind = resp.wind.speed || 0;
        this.humidity = resp.main.humidity || 0;
      },
      error => {
        this.loadingService.dismiss();
        console.error("Get Current weather error:", error);
        this.alertService.presentAlertConfirm(
          "Oops!", // title
          "Something went wrong getting the weather.", // message
          "Try Again", // accept button text
          this.getWeather()
        );
      },
      () => {
        this.getForecast();
        // this.loadingService.dismiss();
        // this.zipCode = "";
      }
    );
  }

  getForecast() {
    if (!this.loadingService.isLoading) {
      this.loadingService.present();
    }
    this.weatherService.getForecast(this.zipCode).subscribe(
      (resp: { list: WeatherApiResponse[] }) => {
        console.log("FORECSAT RESP", resp);
        this.forecast = _.uniqBy(
          _.map(resp.list, day => {
            return {
              ...day,
              dt_txt: day.dt_txt.split(" ")[0],
              temp: Math.round(day.main.temp),
              icon: `http://openweathermap.org/img/w/${day.weather[0].icon}.png`
            };
          }),
          "dt_txt"
        );
        console.log("AFTER", this.forecast);
        // this.weatherResults = resp;
        // this.currentTemp = resp.main.temp;
        // this.currentConditionIcon = `http://openweathermap.org/img/w/${resp.weather[0].icon}.png`;
        // this.location = resp.name;
        // this.precip = (resp.rain && resp.rain["1h"]) || 0;
        // this.wind = resp.wind.speed || 0;
        // this.humidity = resp.main.humidity || 0;

        // _.each(resp.forecast, data => {
        //   this.forcast = data;
        //   this.minTemp = data[0].day.mintemp_f;
        //   this.maxTemp = data[0].day.maxtemp_f;
        // });
      },
      error => {
        this.loadingService.dismiss();
        console.error(error);
      },
      () => {
        this.loadingService.dismiss();
        this.zipCode = "";
      }
    );
  }

  toggleSearch() {
    this.searching = !this.searching;
    this.zipCode = "";
  }
}
