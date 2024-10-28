import nodemailer from 'nodemailer';
import axios from 'axios';

type WeatherForecastItem = {
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

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function getWeatherForecast(): Promise<WeatherForecastItem[]> {
  const BROOKLYN_LAT = "40.6782";
  const BROOKLYN_LON = "-73.9442";
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${BROOKLYN_LAT}&lon=${BROOKLYN_LON}&appid=${process.env.WEATHER_API_KEY}&units=imperial`;
  
  try {
    const response = await axios.get<{ list: WeatherForecastItem[] }>(url);
    return response.data.list.slice(0, 3);
  } catch (error: any) {
    console.error('Error fetching weather:', error);
    throw error;
  }
}

async function sendWeatherEmail(to: string): Promise<nodemailer.SentMessageInfo> {
  try {
    const forecast: WeatherForecastItem[] = await getWeatherForecast();
    
    const weatherHTML = forecast.map((item: WeatherForecastItem) => {
      const date = new Date(item.dt * 1000);
      return `
        <div style="margin-bottom: 20px; padding: 10px; background-color: #fff; border-radius: 5px;">
          <h3 style="color: #333;">${date.toLocaleTimeString()}</h3>
          <p>Temperature: ${Math.round(item.main.temp)}°F</p>
          <p>Feels like: ${Math.round(item.main.feels_like)}°F</p>
          <p>Weather: ${item.weather[0].description}</p>
          <p>Humidity: ${item.main.humidity}%</p>
        </div>
      `;
    }).join('');

    const result = await transporter.sendMail({
      from: '"Weather Update" <malink027@gmail.com>',
      to: to,
      subject: "Brooklyn Weather Forecast",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; border-radius: 10px;">
          <h1 style="color: #4a90e2;">🌤️ Brooklyn Weather Forecast</h1>
          ${weatherHTML}
          <p style="font-size: 12px; color: #888; text-align: center;">
            Generated at ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });
    return result;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

// Example usage
async function main() {
  try {
    await sendWeatherEmail("malin.kankanamge@gmail.com");
    console.log('Weather forecast email sent successfully!');
  } catch (error) {
    console.error('Failed to send weather forecast:', error);
  }
}

main().catch(console.error);
