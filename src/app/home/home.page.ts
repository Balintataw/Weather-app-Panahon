import { Component, OnInit } from "@angular/core";

import { HttpClient } from "@angular/common/http";
import { Map, latLng, tileLayer, Layer, marker } from "leaflet";

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
  zipCode: string | number;
  searching: boolean = false;
  forecast: any[];
  map: Map;
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
            this.zipCode = response.results[0].address_components[6].long_name;
            // this.loadmap();
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

    this.weatherService.getWeather(this.zipCode).subscribe(
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
        // this.currentDate = new Date();
        // this.currentTemp = Math.round(resp.main.temp);
        // this.currentConditionIcon = `https://openweathermap.org/img/w/${resp.weather[0].icon}.png`;
        // this.location = resp.name;
        // this.precip = (resp.rain && resp.rain["1h"]) || 0;
        // this.wind = resp.wind.speed || 0;
        // this.humidity = resp.main.humidity || 0;
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
              icon: `https://openweathermap.org/img/w/${day.weather[0].icon}.png`
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

  loadmap() {
    setTimeout(() => {
      this.map = new Map("map").setView([this.coords.lat, this.coords.long], 8);

      tileLayer(
        `http://tile.openweathermap.org/map/precipitation_new/${1}/${20}/${20}.png?appid=${
          environment.api_key
        }`,
        {
          // tslint:disable-next-line
          attribution: "Map data &copy",
          maxZoom: 18
        }
      ).addTo(this.map);
    }, 50);
  }
}
