import api from "./auth";

// ── Text searches ───────────────────────────────────────────────────────────
export const searchPeople = (query: string) =>
  api.get("/people/search.php", { params: { q: query } });

export const searchCompany = (query: string) =>
  api.get("/search/company.php", { params: { q: query } });

export const searchKeyword = (query: string) =>
  api.get("/search/keyword.php", { params: { q: query } });

// ── Discover by company ─────────────────────────────────────────────────────
export const getMoviesByCompany = (company_id: number, page = 1) =>
  api.get("/movies/by_company.php", { params: { company_id, page } });

export const getTVByCompany = (company_id: number, page = 1) =>
  api.get("/tv/by_company.php", { params: { company_id, page } });

// ── Discover by keyword ─────────────────────────────────────────────────────
export const getMoviesByKeyword = (keyword_id: number, page = 1) =>
  api.get("/movies/by_keyword.php", { params: { keyword_id, page } });

export const getTVByKeyword = (keyword_id: number, page = 1) =>
  api.get("/tv/by_keyword.php", { params: { keyword_id, page } });
