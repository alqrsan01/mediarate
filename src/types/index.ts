export type MediaStatus = "watched" | "wishlist" | "watching" | "dropped";

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

export type CrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
};

export type Movie = {
  id: number;
  title: string;
  tagline: string | null;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  original_language: string;
  budget: number;
  revenue: number;
  runtime?: number;
  status: string;
  genres?: { id: number; name: string }[];
  production_companies?: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  recommendations?: { results: Movie[] };
  keywords?: { keywords: { id: number; name: string }[] };
  external_ids?: {
    imdb_id: string | null;
    facebook_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
  };
  videos?: {
    results: {
      id: string;
      key: string;
      site: string;
      type: string;
      official: boolean;
    }[];
  };
  "watch/providers"?: {
    results: Record<string, WatchProviderRegion>;
  };
  images?: {
    backdrops: MovieImage[];
    posters: MovieImage[];
    logos: MovieImage[];
  };
};

export type MovieImage = {
  file_path: string;
  width: number;
  height: number;
  vote_average: number;
  vote_count: number;
};

export type UserMedia = {
  id: number;
  user_id: number;
  media_type: string;
  tmdb_id: number;
  status: MediaStatus;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
};

export type Person = {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  gender: number;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  movie_credits: {
    crew: {
      id: number;
      title: string;
      poster_path: string | null;
      release_date: string;
      job: string;
    }[];
    cast: {
      id: number;
      title: string;
      poster_path: string | null;
      release_date: string;
      character: string;
    }[];
  };
  external_ids: {
    imdb_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
  };
  tv_credits: {
    crew: {
      id: number;
      name: string;
      poster_path: string | null;
      first_air_date: string;
      job: string;
    }[];
    cast: {
      id: number;
      name: string;
      poster_path: string | null;
      first_air_date: string;
      character: string;
    }[];
  };
};

export type WatchProvider = {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
};

export type WatchProviderRegion = {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

export type TVShow = {
  id: number;
  name: string;
  tagline: string | null;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string | null;
  vote_average: number;
  vote_count: number;
  original_language: string;
  status: string;
  type: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  genres?: { id: number; name: string }[];
  networks?: { id: number; name: string; logo_path: string | null }[];
  production_companies?: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  created_by?: { id: number; name: string; profile_path: string | null }[];
  seasons?: TVSeasonBasic[];
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  recommendations?: { results: TVShow[] };
  keywords?: { results: { id: number; name: string }[] };
  external_ids?: {
    imdb_id: string | null;
    facebook_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
  };
  videos?: {
    results: {
      id: string;
      key: string;
      site: string;
      type: string;
      official: boolean;
    }[];
  };
  "watch/providers"?: {
    results: Record<string, WatchProviderRegion>;
  };
  images?: {
    backdrops: MovieImage[];
    posters: MovieImage[];
    logos: MovieImage[];
  };
};

export type TVSeasonBasic = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview: string;
};

export type TVSeason = {
  id: number;
  name: string;
  season_number: number;
  air_date: string | null;
  poster_path: string | null;
  overview: string;
  episodes: TVEpisode[];
};

export type TVEpisode = {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  runtime: number | null;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
};
