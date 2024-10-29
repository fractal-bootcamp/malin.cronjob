import Anthropic from '@anthropic-ai/sdk';
import type { WeatherForecastItem } from './types';
//import dotenv from 'dotenv'

//dotenv.config({ path: '/mnt/secrets/.env' });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getClothingRecommendation(weatherData: WeatherForecastItem[]): Promise<string> {
  // Format weather data for the prompt
  const weatherSummary = weatherData.map(item => {
    return `Time: ${new Date(item.dt * 1000).toLocaleTimeString()}
Temperature: ${Math.round(item.main.temp)}°F
Feels like: ${Math.round(item.main.feels_like)}°F
Weather: ${item.weather[0].description}
Humidity: ${item.main.humidity}%`;
  }).join('\n\n');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Based on this weather forecast:
${weatherSummary}

Please provide two haiku-style recommendations for what to wear today:
1. A weather description haiku
2. A clothing recommendation haiku (include emojis)

Requirements:
- Focus on practical clothing choices
- Suggest a scarf if temperature is cold
- Include any weather warnings (rain, snow, cold, heatwave)
- Begin each clothing recommendation line with an appropriate emoji

Structure your response like this:

line 1
line 2
line 3
<line break>
🧥 line 1
👖 line 2
☂️ line3

Always include an emoji at the beginning of each line of Haiku 2

Your output should only be the Haikus, no headings. 
`
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



