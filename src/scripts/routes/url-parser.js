function getActivePath() {
  const hash = window.location.hash.slice(1).toLowerCase() || '/';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

export function getActiveRoute() {
  return getActivePath();
}

export default {
  getActiveRoute,
};
