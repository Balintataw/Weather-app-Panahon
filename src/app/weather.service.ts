import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

    constructor(private httpClient: HttpClient ) { }

    getWeather(zipCode: any) {
        let zipLocation = `http://api.apixu.com/v1/forecast.json?key=8ca3550e6ec5459d8ac224045170711&q=${zipCode}&days=5`;
        return this.httpClient.get(zipLocation);
    }
}
