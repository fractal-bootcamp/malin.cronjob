import nodemailer from 'nodemailer';
import axios from 'axios';
import type { WeatherForecastItem } from './types';
import { getClothingRecommendation } from './whattowear-sydney';
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
  const SYDNEY_LAT = "-33.8688";
  const SYDNEY_LON = "151.2093";
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${SYDNEY_LAT}&lon=${SYDNEY_LON}&appid=${process.env.WEATHER_API_KEY}&units=metric&timezone=Australia/Sydney`;
  
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
      const sydneyDate = new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Sydney',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }).format(date);
      const tempC = Math.round(item.main.temp);
      const feelsLikeC = Math.round(item.main.feels_like);
      const tempF = Math.round((tempC * 9/5) + 32);
      const feelsLikeF = Math.round((feelsLikeC * 9/5) + 32);
      return `
        <div style="margin-bottom: 20px; padding: 10px; background-color: #fff; border-radius: 5px;">
          <h3 style="color: #333;">${sydneyDate}</h3>
          <p>Temperature: ${tempC}°C / ${tempF}°F</p>
          <p>Feels like: ${feelsLikeC}°C / ${feelsLikeF}°F</p>
          <p>Weather: ${item.weather[0].description}</p>
          <p>Humidity: ${item.main.humidity}%</p>
        </div>
      `;
    }).join('');

    const result = await transporter.sendMail({
      from: '"Weather Update" <malink027@gmail.com>',
      to: to,
      subject: "Good Morning Duan ❤️",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; border-radius: 10px;">
          <h2 style="color: #4a90e2;">☀️ Sydney Weather 🌿</h2>
          <div style="margin-bottom: 20px; padding: 15px; background-color: #fff; border-radius: 5px;">
            <h2 style="color: #333;">🧥 What to Wear Today 👚</h2>
            <p style="white-space: pre-line; font-style: italic; line-height: 1.8; font-size: 1.1em; margin: 15px 0; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">${clothingRecommendation}</p>
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
      "example@gmail.com"
    ];
    
    await sendWeatherEmail(emailAddresses.join(", "));
    console.log('Weather forecast email sent successfully!');
  } catch (error) {
    console.error('Failed to send weather forecast:', error);
  }
}

main().catch(console.error);
