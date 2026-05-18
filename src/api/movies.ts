import api from "./auth";

export const searchMovies = (query: string) =>
  api.get("/movies/search.php", { params: { q: query } });

export const getMovieDetails = (id: number) =>
  api.get("/movies/details.php", { params: { id } });

export const getTrending = () => api.get("/movies/trending.php");

export const discoverMovies = (params: {
  sort_by?: string;
  page?: number;
  genre?: string;
  year?: string;
}) => api.get("/movies/discover.php", { params });

export const getGenres = () => api.get("/movies/genres.php");

export const getCollection = (id: number) =>
  api.get("/movies/collection.php", { params: { id } });

export const getNowPlaying = (page = 1) =>
  api.get("/movies/now_playing.php", { params: { page } });

export const getUpcoming = (page = 1) =>
  api.get("/movies/upcoming.php", { params: { page } });

export const getTopRated = (page = 1) =>
  api.get("/movies/top_rated.php", { params: { page } });

export const getMovieRecommendations = (id: number) =>
  api.get('/movies/recommendations.php', { params: { id } })