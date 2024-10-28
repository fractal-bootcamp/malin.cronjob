import nodemailer from 'nodemailer';
import axios from 'axios';
import type { WeatherForecastItem } from './types';
import { getClothingRecommendation } from './whattowear';
import dotenv from 'dotenv'

dotenv.config({ path: '/mnt/secrets/.env' });

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
    const clothingRecommendation = await getClothingRecommendation(forecast);
    
    const weatherHTML = forecast.map((item: WeatherForecastItem) => {
      const date = new Date(item.dt * 1000);
      const tempF = Math.round(item.main.temp);
      const feelsLikeF = Math.round(item.main.feels_like);
      const tempC = Math.round((tempF - 32) * 5/9);
      const feelsLikeC = Math.round((feelsLikeF - 32) * 5/9);
      return `
        <div style="margin-bottom: 20px; padding: 10px; background-color: #fff; border-radius: 5px;">
          <h3 style="color: #333;">${date.toLocaleTimeString()}</h3>
          <p>Temperature: ${tempF}°F / ${tempC}°C</p>
          <p>Feels like: ${feelsLikeF}°F / ${feelsLikeC}°C</p>
          <p>Weather: ${item.weather[0].description}</p>
          <p>Humidity: ${item.main.humidity}%</p>
        </div>
      `;
    }).join('');

    const result = await transporter.sendMail({
      from: '"Weather Update" <malink027@gmail.com>',
      to: to,
      subject: "Brooklyn Weather Today",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; border-radius: 10px;">
          <h1 style="color: #4a90e2;">🌤️ Brooklyn Weather Forecast</h1>
          <div style="margin-bottom: 20px; padding: 15px; background-color: #fff; border-radius: 5px;">
            <h2 style="color: #333;">🧥 What to Wear Today</h2>
            <p style="white-space: pre-line; font-style: italic;">${clothingRecommendation}</p>
          </div>
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
    const emailAddresses = [
      "example@gmail.com",
    ];
    
    await sendWeatherEmail(emailAddresses.join(", "));
    console.log('Weather forecast email sent successfully!');
  } catch (error) {
    console.error('Failed to send weather forecast:', error);
  }
}

main().catch(console.error);
