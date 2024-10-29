import Anthropic from '@anthropic-ai/sdk';
import type { WeatherForecastItem } from './types';
import dotenv from 'dotenv'

dotenv.config({ path: '/mnt/secrets/.env' });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getClothingRecommendation(weatherData: WeatherForecastItem[]): Promise<string> {
  // Format weather data for the prompt, using Sydney timezone
  const weatherSummary = weatherData.map(item => {
    const sydneyTime = new Date(item.dt * 1000).toLocaleTimeString('en-AU', {
      timeZone: 'Australia/Sydney',
      hour: '2-digit',
      minute: '2-digit'
    });
    const tempC = Math.round(item.main.temp);
    const feelsLikeC = Math.round(item.main.feels_like);  
    return `Time: ${sydneyTime}
Temperature: ${tempC}°C
Feels like: ${feelsLikeC}°C
Weather: ${item.weather[0].description}
Humidity: ${item.main.humidity}%`;
  }).join('\n\n');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Based on this Sydney weather forecast:
${weatherSummary}

Please provide two haiku's:
1. A weather description haiku of the day ahead
2. A clothing recommendation haiku (include emojis) (tailor this for a cute girl in her early thirties in Sydney)

Requirements:
- Focus on practical clothing choices for Sydney's climate
- Suggest sun protection (hat, sunscreen) if UV is high
- ONLY suggest an umbrella if the weather description includes 'rain', 'shower', or 'drizzle'
- Include any weather warnings (rain, humidity, extreme heat)
- Choose ONE of these emojis for each line of clothing recommendations: 👗 👚 👕 👖 🩳 🧥 👒 🕶️ 🧴 ☂️

Structure your response like this:

Weather haiku line 1
Weather haiku line 2
Weather haiku line 3

👚 Clothing haiku line 1
👖 Clothing haiku line 2
🧴 Clothing haiku line 3

Your output should only be the Haikus, exactly as structured above, with no additional text or emojis.`
      }]
    });
    console.log(response.content[0].text)
    return response.content[0].text;
  } catch (error) {
    console.error('Error getting clothing recommendation:', error);
    throw error;
  }
}

export { getClothingRecommendation };



