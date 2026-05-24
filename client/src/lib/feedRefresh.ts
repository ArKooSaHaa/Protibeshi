const FEED_REFRESH_KEY = 'protibeshi:feed-refresh';

export const broadcastFeedRefreshSignal = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(FEED_REFRESH_KEY, String(Date.now()));
};

export const isFeedRefreshSignalKey = (key: string | null): boolean => {
  return key === FEED_REFRESH_KEY;
};
