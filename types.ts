export type WeatherForecastItem = {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: [{
    description: string;
  }];
};