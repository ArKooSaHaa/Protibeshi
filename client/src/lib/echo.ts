import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

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
    wsPath: '/app',
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

    echoInstance = new Echo({
      broadcaster: 'pusher',
      key: 'localkey',
      wsHost: config.wsHost,
      wsPort: config.wsPort,
      wssPort: config.wssPort,
      wsPath: config.wsPath,
      forceTLS: config.forceTLS,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
    });

    return echoInstance;
  } catch (error) {
    console.error('Failed to initialize Echo', error);
    return null;
  }
};
