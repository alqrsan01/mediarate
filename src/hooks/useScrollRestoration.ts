import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Saves scroll position per navigation entry (location.key).
 * - Forward navigation  → new key → no saved position → scrolls to top
 * - Back/forward navigation → same key → restores exact position
 *
 * Retries the scroll at 50ms, 150ms, and 400ms to handle pages
 * where content loads asynchronously (the page may not be tall
 * enough on the first frame to actually reach the saved position).
 */
export function useScrollRestoration() {
  const { key } = useLocation();

  useEffect(() => {
    const saved = sessionStorage.getItem(`scroll:${key}`);

    if (saved !== null) {
      const target = parseInt(saved, 10);

      const t1 = setTimeout(() => window.scrollTo(0, target), 50);
      const t2 = setTimeout(() => window.scrollTo(0, target), 150);
      const t3 = setTimeout(() => window.scrollTo(0, target), 400);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        sessionStorage.setItem(`scroll:${key}`, String(window.scrollY));
      };
    } else {
      window.scrollTo(0, 0);
      return () => {
        sessionStorage.setItem(`scroll:${key}`, String(window.scrollY));
      };
    }
  }, [key]);
}
