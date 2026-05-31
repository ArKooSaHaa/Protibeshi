import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getBearerTokenHeader } from '@/features/auth/utils/tokenStorage';

let echoInstance: Echo<'pusher'> | null = null;

const getEchoConfig = () => {
  const browserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const wsHost = import.meta.env.VITE_WS_HOST || browserHost || 'localhost';
  const wsPort = Number(import.meta.env.VITE_WS_PORT || 6001);
  const wssPort = Number(import.meta.env.VITE_WSS_PORT || wsPort);
  const wsScheme = import.meta.env.VITE_WS_SCHEME || 'ws';

  return {
    wsHost,
    wsPort,
    wssPort,
    forceTLS: wsScheme === 'wss',
  };
};

export const getEcho = (): Echo<'pusher'> | null => {
  if (echoInstance) {
    return echoInstance;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const win = window as Window & { Pusher?: typeof Pusher };
    win.Pusher = Pusher;
    const config = getEchoConfig();

    const bearer = getBearerTokenHeader();
    const createEcho = (cfg: ReturnType<typeof getEchoConfig>) => {
      // In development it's useful to see Pusher logs
      if (import.meta.env.DEV) {
        // @ts-ignore
        if (typeof window !== 'undefined' && (window as any).Pusher) {
          // enable client-side pusher logs
          // @ts-ignore
          (window as any).Pusher.logToConsole = true;
        }
      }

      return new Echo({
        broadcaster: 'pusher',
        key: 'localkey',
        cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'mt1',
        wsHost: cfg.wsHost,
        wsPort: cfg.wsPort,
        wssPort: cfg.wssPort,
        forceTLS: cfg.forceTLS,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        auth: {
          headers: {
            ...(bearer ? { Authorization: bearer } : {}),
          },
        },
      });
    };

    try {
      echoInstance = createEcho(config);
      return echoInstance;
    } catch (err) {
      // Try a conservative fallback useful for local development: ws on port 6001 without TLS
      try {
        const fallback = {
          ...config,
          wsPort: 6001,
          wssPort: 6001,
          forceTLS: false,
        } as ReturnType<typeof getEchoConfig>;

        echoInstance = createEcho(fallback);
        // eslint-disable-next-line no-console
        console.warn('Echo: initialized with fallback websocket config');
        return echoInstance;
      } catch (err2) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize Echo', err2);
        return null;
      }
    }

  } catch (error) {
    console.error('Failed to initialize Echo', error);
    return null;
  }
};
