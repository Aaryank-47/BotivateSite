// Tiny shared store so a page can report how many pending items it has and the sidebar can badge it.
// Keys look like "pending-tasks" or "checklist-pending:weekly" (the part after ":" lets one tab sum several lists).
const KEY = "botivate_sidebar_counts_v1";
const listeners = new Set();

let counts = (() => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
})();

export const publishCount = (key, n) => {
  const value = Number(n) || 0;
  if (counts[key] === value) return;
  counts = { ...counts, [key]: value };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(counts));
  } catch {
    /* storage unavailable - badge still updates in memory */
  }
  listeners.forEach((fn) => fn(counts));
};

export const subscribeCounts = (fn) => {
  listeners.add(fn);
  fn(counts);
  return () => listeners.delete(fn);
};

// Pages call this right after an action that changes a server-side count (e.g. a task completed),
// so the sidebar adjusts its badge at once ({ "pending-tasks": -1 }) and refetches instead of waiting for its poll.
// meta.pendingTaskOwner: user id the changed pending task belongs to, so a member who only sees their own
// tasks isn't bumped for someone else's.
const refreshListeners = new Set();

export const requestCountsRefresh = (delta = {}, meta = {}) => refreshListeners.forEach((fn) => fn(delta, meta));

export const onCountsRefresh = (fn) => {
  refreshListeners.add(fn);
  return () => refreshListeners.delete(fn);
};

/** Sum of every key belonging to a tab id ("tab" or "tab:suffix"). */
export const countForTab = (all, tabId) =>
  Object.entries(all).reduce((n, [k, v]) => (k === tabId || k.startsWith(tabId + ":") ? n + v : n), 0);
