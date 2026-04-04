export const formatLog = (message, meta) => {
  const timestamp = new Date().toISOString();
  if (!meta) return `[${timestamp}] ${message}`;
  try {
    const metaString = typeof meta === 'string' ? meta : JSON.stringify(meta);
    return `[${timestamp}] ${message} | ${metaString}`;
  } catch {
    return `[${timestamp}] ${message}`;
  }
};
