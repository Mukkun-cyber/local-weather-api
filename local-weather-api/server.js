// Import dependencies
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Cache for storing weather data to reduce API calls
const cache = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Default city for Phase 1
const DEFAULT_CITY = 'Bayombong';

// Third-party weather API configurations
const WEATHER_API_URL = 'http://api.weatherapi.com/v1/current.json';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

if (!WEATHER_API_KEY) {
  console.error('Error: WEATHER_API_KEY is not set in the .env file.');
  process.exit(1);
}

// Utility function to fetch weather data
async function fetchWeather(city) {
  const now = Date.now();

  // Check cache
  if (cache[city] && now - cache[city].timestamp < CACHE_DURATION) {
    console.log(`Cache hit for city: ${city}`);
    return cache[city].data;
  }

  try {
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        key: WEATHER_API_KEY,
        q: city,
      },
    });

    // Parse the weather data
    const weatherData = {
      city: response.data.location.name,
      temperature: response.data.current.temp_c,
      windSpeed: response.data.current.wind_kph,
      weatherCode: response.data.current.condition.text,
    };

    // Update cache
    cache[city] = { data: weatherData, timestamp: now };

    return weatherData;
  } catch (error) {
    console.error(`Failed to fetch weather data for city: ${city}`, error.message);
    throw new Error('Unable to retrieve weather data.');
  }
}

// Root endpoint - Phase 1
// Root endpoint - Handle multiple cities
app.get('/weather', async (req, res) => {
    try {
      // Get the 'cities' query parameter; split into an array. Default to the DEFAULT_CITY if none is provided.
      const cities = req.query.cities ? req.query.cities.split(',') : [DEFAULT_CITY];
  
      // Fetch weather data for all cities concurrently
      const weatherPromises = cities.map((city) => fetchWeather(city.trim()));
      const weatherDataArray = await Promise.all(weatherPromises);
  
      res.json(weatherDataArray); // Return an array of weather data
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
