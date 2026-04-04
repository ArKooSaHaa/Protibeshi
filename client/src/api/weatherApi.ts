import { ENV } from '@/config/env';

const OPEN_WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const DEFAULT_CITY = 'Dhaka,BD';

type OpenWeatherCurrentResponse = {
  name: string;
  sys?: {
    country?: string;
  };
  weather?: Array<{
    description?: string;
    icon?: string;
  }>;
  main?: {
    temp?: number;
    feels_like?: number;
    humidity?: number;
  };
  wind?: {
    speed?: number;
  };
};

type OpenWeatherForecastResponse = {
  list?: Array<{
    dt: number;
    dt_txt?: string;
    main?: {
      temp?: number;
      temp_min?: number;
      temp_max?: number;
    };
    weather?: Array<{
      description?: string;
      icon?: string;
    }>;
  }>;
};

export type WeatherDailyForecast = {
  date: string;
  dayLabel: string;
  minTemp: number;
  maxTemp: number;
  icon: string;
  description: string;
};

export type WeatherHourlyForecast = {
  timeLabel: string;
  temperature: number;
};

export type WeatherOverview = {
  city: string;
  country: string;
  description: string;
  icon: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  dailyForecast: WeatherDailyForecast[];
  hourlyForecast: WeatherHourlyForecast[];
};

const roundTemperature = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.round(value);
};

const getDateKey = (epochSeconds: number) => {
  return new Date(epochSeconds * 1000).toISOString().split('T')[0];
};

const buildDailyForecast = (forecastList: NonNullable<OpenWeatherForecastResponse['list']>): WeatherDailyForecast[] => {
  const grouped = new Map<
    string,
    NonNullable<OpenWeatherForecastResponse['list']>
  >();

  forecastList.forEach((entry) => {
    const key = getDateKey(entry.dt);
    const existing = grouped.get(key) || [];
    grouped.set(key, [...existing, entry]);
  });

  return Array.from(grouped.entries())
    .slice(0, 8)
    .map(([date, items]) => {
      const noonSample = items.find((item) => item.dt_txt?.includes('12:00:00'));
      const representative = noonSample || items[Math.floor(items.length / 2)] || items[0];
      const temperatures = items
        .map((item) => [item.main?.temp_min, item.main?.temp_max])
        .flat()
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

      const minimum = temperatures.length ? Math.min(...temperatures) : representative.main?.temp_min ?? 0;
      const maximum = temperatures.length ? Math.max(...temperatures) : representative.main?.temp_max ?? 0;
      const localDate = new Date(representative.dt * 1000);

      return {
        date,
        dayLabel: localDate.toLocaleDateString(undefined, { weekday: 'short' }),
        minTemp: roundTemperature(minimum),
        maxTemp: roundTemperature(maximum),
        icon: representative.weather?.[0]?.icon || '01d',
        description: representative.weather?.[0]?.description || 'Clear sky',
      };
    });
};

const buildHourlyForecast = (forecastList: NonNullable<OpenWeatherForecastResponse['list']>): WeatherHourlyForecast[] => {
  return forecastList.slice(0, 8).map((entry) => {
    const localDate = new Date(entry.dt * 1000);

    return {
      timeLabel: localDate.toLocaleTimeString([], { hour: 'numeric' }),
      temperature: roundTemperature(entry.main?.temp),
    };
  });
};

const requestOpenWeather = async <T>(path: string, city: string, apiKey: string): Promise<T> => {
  const url = new URL(`${OPEN_WEATHER_BASE_URL}${path}`);
  url.searchParams.set('q', city);
  url.searchParams.set('appid', apiKey);
  url.searchParams.set('units', 'metric');

  const response = await fetch(url.toString());
  if (!response.ok) {
    const fallbackMessage = `Weather request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { message?: string };
      throw new Error(payload.message || fallbackMessage);
    } catch {
      throw new Error(fallbackMessage);
    }
  }

  return (await response.json()) as T;
};

export const fetchWeatherOverview = async (city = DEFAULT_CITY): Promise<WeatherOverview> => {
  const apiKey = ENV.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenWeather key missing. Set VITE_OPENWEATHER_API_KEY in .env.');
  }

  const [current, forecast] = await Promise.all([
    requestOpenWeather<OpenWeatherCurrentResponse>('/weather', city, apiKey),
    requestOpenWeather<OpenWeatherForecastResponse>('/forecast', city, apiKey),
  ]);

  const forecastList = Array.isArray(forecast.list) ? forecast.list : [];
  const dailyForecast = buildDailyForecast(forecastList);
  const hourlyForecast = buildHourlyForecast(forecastList);

  return {
    city: current.name || 'Dhaka',
    country: current.sys?.country || 'BD',
    description: current.weather?.[0]?.description || 'Partly sunny',
    icon: current.weather?.[0]?.icon || '02d',
    temperature: roundTemperature(current.main?.temp),
    feelsLike: roundTemperature(current.main?.feels_like),
    humidity: typeof current.main?.humidity === 'number' ? current.main.humidity : 0,
    windSpeed: typeof current.wind?.speed === 'number' ? current.wind.speed : 0,
    dailyForecast,
    hourlyForecast,
  };
};
