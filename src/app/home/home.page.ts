import { Component, OnInit, SimpleChanges, Input } from "@angular/core";

import { HttpClient } from "@angular/common/http";

import { CacheService } from "ionic-cache";
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
  _searchTerm: string | number;
  searching = false;
  forecast: any[];
  coords: { lat: number; long: number };
  ignoreCache = true;
  error = false;

  constructor(
    private weatherService: WeatherService,
    private loadingService: LoadingService,
    private locationService: LocationService,
    private alertService: AlertService,
    private httpClient: HttpClient,
    private cache: CacheService
  ) { }

  @Input() set searchTerm(value) {
    if (!this.ignoreCache) this.ignoreCache = true;
    this.error = false;
    this._searchTerm = value;
  }

  get searchTerm() {
    return this._searchTerm;
  }

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
            this._searchTerm =
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

  async getWeather() {
    if (!this._searchTerm) {
      this.error = true;
      // this.alertService.presentAlertConfirm(
      //   "Field Required", // title
      //   "Search cannot be blank.", // message
      //   "Ok", // accept button text
      //   null
      // );
      return;
    }

    if (!this.loadingService.isLoading) {
      this.loadingService.present();
    }
    // if weve typed into the search bar at all, allow for hitting the api again
    if (this.ignoreCache) {
      this.weatherService.getWeather(this._searchTerm).subscribe(
        async (resp: WeatherApiResponse) => {
          await this.cache.getOrSetItem("local-weather", () =>
            Promise.resolve(resp)
          );

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

          if (error.error.message === "city not found") {
            this.alertService.presentAlertConfirm(
              "Sorry!", // title
              `We could not find weather for the city '${this._searchTerm}'.`, // message
              "Try Again", // accept button text
              () => (this._searchTerm = "")
            );
          } else {
            this.alertService.presentAlertConfirm(
              "Oops!", // title
              "Something went wrong getting the weather.", // message
              "Try Again", // accept button text
              () => this.getWeather() // confirm button press callback
            );
          }
        },
        () => {
          this.getForecast();
        }
      );
    } else {
      // else check cache for current weather data. expires hourly
      const exists = await this.cache.itemExists("local-weather");
      const cachedData = await this.cache.getItem("local-weather").catch(() => {
        this.cache.clearExpired();
        return null;
      });

      if (exists && cachedData) {
        this.currentWeather = {
          date: new Date(),
          temp: Math.round(cachedData.main.temp),
          icon: `https://openweathermap.org/img/w/${cachedData.weather[0].icon}.png`,
          localeName: cachedData.name,
          precip: (cachedData.rain && cachedData.rain["1h"]) || 0,
          wind: {
            speed: cachedData.wind.speed || 0,
            direction: this.parseWindDirection(cachedData.wind.deg)
          },
          humidity: cachedData.main.humidity || 0
        };
        this.getForecast();
        return;
      } else {
        // if we ignored cache but cache was empty/expired, start again hitting api
        this.ignoreCache = true;
        this.getWeather();
      }
    }
  }

  async getForecast() {
    if (!this.loadingService.isLoading) {
      this.loadingService.present();
    }

    // check cache for forecast data. resets hourly
    const exists = await this.cache.itemExists("forecast-weather");
    const cachedData = await this.cache
      .getItem("forecast-weather")
      .catch(() => {
        return null;
      });

    if (this.ignoreCache) {
      this.weatherService.getForecast(this._searchTerm).subscribe(
        async (resp: { list: WeatherApiResponse[] }) => {
          await this.cache.getOrSetItem("forecast-weather", () =>
            // set response in cache
            Promise.resolve(resp)
          );
          const allTemps = this.minMaxTemps(resp.list);
          this.forecast = _.uniqBy(
            _.map(resp.list, day => {
              return {
                ...day,
                dt_txt: day.dt_txt.split(" ")[0],
                temp: Math.round(day.main.temp),
                temp_min: Math.round(Math.min(...allTemps[day.dt_txt.split(" ")[0]].temps)),
                temp_max: Math.round(Math.max(...allTemps[day.dt_txt.split(" ")[0]].temps)),
                precip: (day.rain && day.rain["3hr"]) || 0,
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
          this._searchTerm = "";
          this.ignoreCache = false;
        }
      );
    } else {
      if (exists && cachedData) {
        this.forecast = _.uniqBy(
          _.map(cachedData.list, day => {
            return {
              ...day,
              dt_txt: day.dt_txt.split(" ")[0],
              temp: Math.round(day.main.temp),
              precip: (day.rain && day.rain["3hr"]) || 0,
              wind: {
                speed: +day.wind.speed.toFixed(0) || 0,
                direction: this.parseWindDirection(day.wind.deg)
              },
              icon: `https://openweathermap.org/img/w/${day.weather[0].icon}.png`
            };
          }),
          "dt_txt"
        );

        this.loadingService.dismiss();
        this._searchTerm = "";

      }
    }

  }

  minMaxTemps(daySegments) {
    // the api returns measurements for each day in 3 hour increments, it won't just give us a min max daily temp
    return daySegments.reduce((p, d) => {
      const date = d.dt_txt.split(" ")[0]; // get the date ex 2042-07-24
      if (p[date]) {
        p[date].temps = [...p[date].temps, d.main.temp];
      } else {
        p[date] = {
          temps: [d.main.temp]
        };
      }
      return p;
    }, {});
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

  toggleSearch() {
    this.searching = !this.searching;
    this._searchTerm = "";
  }
}
