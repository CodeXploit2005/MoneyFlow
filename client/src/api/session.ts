export const tokenNeedsRefresh = (token: string, now = Date.now()): boolean => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === 'number' && exp * 1000 <= now + 30_000;
  } catch {
    // Malformed tokens must still be checked by the server.
    return false;
  }
};

// One refresh for all concurrent requests; clear it on success and failure.
export const singleFlight = <T>(run: () => Promise<T>) => {
  let pending: Promise<T> | null = null;
  return () => {
    if (!pending) pending = Promise.resolve().then(run).finally(() => { pending = null; });
    return pending;
  };
};
