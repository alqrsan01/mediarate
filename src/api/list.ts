import api from "./auth";

export const getMyList = (media_type = 'movie') =>
  api.get('/user/list.php', { params: { media_type } })

export const getUserList = () =>
  api.get('/user/list.php')

export const getYearReview = (year: number) =>
  api.get('/user/year_review.php', { params: { year } })

export const getContinueWatching = () =>
  api.get('/user/continue_watching.php')

export const saveToList = (payload: {
  tmdb_id: number
  media_type: string
  status: string
  rating?: number | null
  review?: string | null
  title?: string | null
  poster_path?: string | null
  runtime?: number | null
  season_counts?: number[] | null
}) => api.post('/user/list.php', payload)

export const removeFromList = (tmdb_id: number, media_type = 'movie') =>
  api.delete('/user/list.php', { data: { tmdb_id, media_type } })

export const getStats = () => api.get('/user/stats.php')

export const getEpisodeRatings = (show_id: number, season: number) =>
  api.get('/user/episode_rating.php', { params: { show_id, season } })

export const saveEpisodeRating = (payload: {
  show_id: number
  season_number: number
  episode_number: number
  rating?: number | null
  watched?: boolean
}) => api.post('/user/episode_rating.php', payload)

export const removeEpisodeRating = (show_id: number, season_number: number, episode_number: number) =>
  api.delete('/user/episode_rating.php', { data: { show_id, season_number, episode_number } })

