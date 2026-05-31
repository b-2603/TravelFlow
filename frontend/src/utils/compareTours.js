const STORAGE_KEY = 'travel_management_compare_tours';
const MAX_COMPARE = 3;

function readCompareTours() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeCompareTours(tours) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tours.slice(0, MAX_COMPARE)));
}

export function getCompareTours() {
  return readCompareTours();
}

export function saveCompareTours(tours) {
  writeCompareTours(tours);
  window.dispatchEvent(new CustomEvent('compare:tours-updated'));
}

export function toggleCompareTour(tour) {
  const tours = readCompareTours();
  const exists = tours.some((item) => item.id === tour.id);

  const next = exists
    ? tours.filter((item) => item.id !== tour.id)
    : [...tours, tour].slice(0, MAX_COMPARE);

  writeCompareTours(next);
  window.dispatchEvent(new CustomEvent('compare:tours-updated'));

  return next;
}

export function clearCompareTours() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('compare:tours-updated'));
}

export function isTourCompared(tourId) {
  return readCompareTours().some((item) => item.id === tourId);
}
