import { useCallback, useEffect, useMemo, useState } from 'react';
import { CloudSun, Droplets, Loader2, RefreshCw, Wind } from 'lucide-react';
import { WeatherOverview, fetchWeatherOverview } from '@/api/weatherApi';
import styles from './WeatherNewsPanel.module.css';

const toFahrenheit = (valueInCelsius: number) => {
  return Math.round((valueInCelsius * 9) / 5 + 32);
};

const capitalize = (value: string) => {
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
};

export const WeatherNewsPanel = () => {
  const [weather, setWeather] = useState<WeatherOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchWeatherOverview();
      setWeather(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load weather updates right now.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWeather();
  }, [loadWeather]);

  const summaryText = useMemo(() => {
    if (!weather) {
      return '';
    }

    const condition = weather.description.toLowerCase();
    if (weather.windSpeed >= 7) {
      return `Breezy through the day with ${condition}.`;
    }

    return `${capitalize(weather.description)} through most of the day.`;
  }, [weather]);

  return (
    <aside className={styles.card} aria-label="Weather news">
      <header className={styles.headerRow}>
        <div>
          <p className={styles.location}>{weather ? `${weather.city}, ${weather.country}` : 'Local weather'}</p>
          <h3 className={styles.title}>Weather News</h3>
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void loadWeather()}
          disabled={loading}
          aria-label="Refresh weather"
        >
          <RefreshCw size={16} className={loading ? styles.spin : undefined} />
        </button>
      </header>

      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 size={16} className={styles.spin} />
          Loading weather...
        </div>
      ) : null}

      {!loading && error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button type="button" onClick={() => void loadWeather()}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && weather ? (
        <>
          <section className={styles.currentSection}>
            <div>
              <p className={styles.temperature}>{weather.temperature}°</p>
              <p className={styles.tempUnits}>C / {toFahrenheit(weather.temperature)}F</p>
              <p className={styles.feelsLike}>Feels like {weather.feelsLike}°</p>
            </div>
            <CloudSun className={styles.currentIcon} size={34} />
          </section>

          <p className={styles.summary}>{summaryText}</p>

          <section className={styles.dailySection}>
            {weather.dailyForecast.slice(0, 4).map((day) => (
              <article key={day.date} className={styles.dayItem}>
                <span className={styles.dayLabel}>{day.dayLabel}</span>
                <img
                  src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                  alt={day.description}
                  className={styles.dayIcon}
                />
                <span className={styles.dayHigh}>{day.maxTemp}°</span>
                <span className={styles.dayLow}>{day.minTemp}°</span>
              </article>
            ))}
          </section>

          <section className={styles.metricsRow}>
            <div className={styles.metricItem}>
              <Droplets size={14} />
              <span>{weather.humidity}% humidity</span>
            </div>
            <div className={styles.metricItem}>
              <Wind size={14} />
              <span>{weather.windSpeed.toFixed(1)} m/s wind</span>
            </div>
          </section>
        </>
      ) : null}
    </aside>
  );
};
