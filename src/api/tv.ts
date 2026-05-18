import api from './auth'

export const searchTV = (query: string) => 
  api.get('/tv/search.php', { params: { q: query } })

export const getTVDetails = (id: number) => 
  api.get('/tv/details.php', { params: { id } })

export const getTVTrending = () =>
  api.get('/tv/trending.php')

export const getTVTopRated = (page = 1) => 
  api.get('/tv/top_rated.php', { params: { page } })

export const getTVPopular = (page = 1) =>
  api.get('/tv/popular.php', { params: { page } })

export const getTVOnAir = (page = 1) =>
  api.get('/tv/on_air.php', { params: { page } })

export const discoverTV = (params: {
  sort_by?: string
  page?: number
  genre?: string
  year?: string
}) => api.get('/tv/discover.php', { params })

export const getTVGenres = () =>
  api.get('/tv/genres.php')

export const getTVSeason = (id: number, season: number) =>
  api.get('/tv/season.php', { params: { id, season } })

export const getTVRecommendations = (id: number) =>
  api.get('/tv/recommendation.php', { params: { id } })