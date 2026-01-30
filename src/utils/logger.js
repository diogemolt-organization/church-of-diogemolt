export function setupErrorLogging() {
  window.addEventListener('error', (event) => {
    logError({
      type: 'error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString()
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError({
      type: 'unhandledrejection',
      reason: event.reason,
      timestamp: new Date().toISOString()
    });
  });

  // Override console.error to capture logs
  const originalError = console.error;
  console.error = function(...args) {
    logError({
      type: 'console.error',
      args: args.map(arg => String(arg)),
      timestamp: new Date().toISOString()
    });
    originalError.apply(console, args);
  };
}

export function logError(errorData) {
  console.log('[LOGGED ERROR]', errorData);
  // TODO: send to backend api endpoint
}
