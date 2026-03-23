import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance: Echo<'pusher'> | null = null;

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

    echoInstance = new Echo({
      broadcaster: 'pusher',
      key: 'localkey',
      wsHost: '127.0.0.1',
      wsPort: 6001,
      forceTLS: false,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
    });

    return echoInstance;
  } catch (error) {
    console.error('Failed to initialize Echo', error);
    return null;
  }
};
