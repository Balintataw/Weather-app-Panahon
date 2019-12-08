import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../environments/environment";

export interface WeatherApiResponse {
  // request: {
  //   type: string;
  //   query: string;
  //   language: string;
  //   unit: string;
  // };
  // location: {
  //   name: string;
  //   country: string;
  //   region: string;
  //   lat: string;
  //   lon: string;
  //   timezone_id: string;
  //   localtime: string;
  //   localtime_epoch: number;
  //   utc_offset: string;
  // };
  // current: {
  //   observation_time: string;
  //   temperature: number;
  //   weather_code: number;
  //   weather_icons: string[];
  //   weather_descriptions: string[];
  //   wind_speed: number;
  //   wind_degree: number;
  //   wind_dir: string;
  //   pressure: number;
  //   precip: number;
  //   humidity: number;
  //   cloudcover: number;
  //   feelslike: number;
  //   uv_index: number;
  //   visibility: number;
  // };
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

  getWeather(searchParam: string | number) {
    // const zipLocation = `${environment.api_baseurl}?access_key=007c271ac5bacdf3fb5b3670ab5b30f7&query=${zipCode}&forecast_days=5&units=f`;
    const url = `${environment.api_baseurl}/weather?zip=${searchParam},us&APPID=${environment.api_key}&units=imperial`;
    return this.httpClient.get(url);
  }

  getForecast(searchParam: string | number) {
    const url = `${environment.api_baseurl}/forecast?zip=${searchParam},us&APPID=${environment.api_key}&units=imperial`;
    return this.httpClient.get(url);
  }
}
