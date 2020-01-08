import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../environments/environment";

export interface WeatherApiResponse {
  error: { cod: string; message: string };
  coord: {
    lon: number;
    lat: number;
  };
  weather: [
    {
      id: number;
      main: string;
      description: string;
      icon: string;
    }
  ];
  base: string;
  main: {
    temp: number;
    pressure: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  rain: {
    "1h": number;
    "3h": number;
  };
  snow: {
    "1h": number;
    "3h": number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    message: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

@Injectable({
  providedIn: "root"
})
export class WeatherService {
  constructor(private httpClient: HttpClient) {}

  qeuryType = searchTerm => (isNaN(searchTerm) ? "q" : "zip");

  getWeather(searchParam: string | number) {
    const url = `${environment.api_baseurl}/weather?${this.qeuryType(
      searchParam
    )}=${searchParam},us&APPID=${environment.api_key}&units=imperial`;
    return this.httpClient.get(url);
  }

  getForecast(searchParam: string | number) {
    const url = `${environment.api_baseurl}/forecast?${this.qeuryType(
      searchParam
    )}=${searchParam},us&APPID=${environment.api_key}&units=imperial`;
    return this.httpClient.get(url);
  }

  getWeekForecast(searchParam: string | number) {
    // a paid account feature only of api
    const url = `${environment.api_baseurl}/forecast/daily?${this.qeuryType(
      searchParam
    )}=${searchParam},us&cnt=7&APPID=${environment.api_key}&units=imperial`;

    return this.httpClient.get(url);
  }
}
