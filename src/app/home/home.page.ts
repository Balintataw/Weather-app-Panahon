import { Component, OnInit } from "@angular/core";

import { HttpClient } from "@angular/common/http";

import { LocationService } from "../services/location.service";
import { LoadingService } from "../services/loading.service";
import { AlertService } from "../services/alert.service";
import { WeatherService, WeatherApiResponse } from "../weather.service";
import { environment } from "../../environments/environment";

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
  currentWeather: {
    temp: number;
    date: Date;
    icon: string;
    localeName: string;
    precip: number;
    humidity: number;
    wind: {
      speed: number;
      direction: string;
    };
  };
  searchTerm: string | number;
  searching: boolean = false;
  forecast: any[];
  coords: { lat: number; long: number };

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
        this.coords = { lat, long };

        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${this.coords.lat},${this.coords.long}&key=${environment.google_api_key}`;
        this.httpClient.get(url).subscribe(
          (response: any) => {
            console.log("SEARCH TERM", response.results[0].address_components);
            this.searchTerm =
              response.results[0].address_components[6].long_name;
            this.getWeather();
          },
          error => {
            this.loadingService.dismiss();
            console.error("GeoLocation error:", error);
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

  parseWindDirection(degrees) {
    if (degrees < 90) {
      return "NE";
    } else if (degrees < 180) {
      return "SE";
    } else if (degrees < 270) {
      return "SW";
    } else {
      return "NW";
    }
  }

  getWeather() {
    if (!this.loadingService.isLoading) {
      this.loadingService.present();
    }

    this.weatherService.getWeather(this.searchTerm).subscribe(
      (resp: WeatherApiResponse) => {
        this.currentWeather = {
          date: new Date(),
          temp: Math.round(resp.main.temp),
          icon: `https://openweathermap.org/img/w/${resp.weather[0].icon}.png`,
          localeName: resp.name,
          precip: (resp.rain && resp.rain["1h"]) || 0,
          wind: {
            speed: resp.wind.speed || 0,
            direction: this.parseWindDirection(resp.wind.deg)
          },
          humidity: resp.main.humidity || 0
        };
      },
      error => {
        this.loadingService.dismiss();
        console.error("Get Current weather error:", error);
        this.alertService.presentAlertConfirm(
          "Oops!", // title
          "Something went wrong getting the weather.", // message
          "Try Again", // accept button text
          () => this.getWeather() // confirm button press callback
        );
      },
      () => {
        this.getForecast();
      }
    );
  }

  getForecast() {
    if (!this.loadingService.isLoading) {
      this.loadingService.present();
    }
    this.weatherService.getForecast(this.searchTerm).subscribe(
      (resp: { list: WeatherApiResponse[] }) => {
        this.forecast = _.uniqBy(
          _.map(resp.list, day => {
            return {
              ...day,
              dt_txt: day.dt_txt.split(" ")[0],
              temp: Math.round(day.main.temp),
              wind: {
                speed: +day.wind.speed.toFixed(0) || 0,
                direction: this.parseWindDirection(day.wind.deg)
              },
              icon: `https://openweathermap.org/img/w/${day.weather[0].icon}.png`
            };
          }),
          "dt_txt"
        );
      },
      error => {
        this.loadingService.dismiss();
        console.error("Error in weatherService:", error);
      },
      () => {
        this.loadingService.dismiss();
        this.searchTerm = "";
      }
    );
  }

  toggleSearch() {
    this.searching = !this.searching;
    this.searchTerm = "";
  }
}
