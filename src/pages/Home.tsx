import { useEffect, useState } from "react";
import { Movie, TVShow } from "../types";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import {
  getTrending,
  getNowPlaying,
  getUpcoming,
  getTopRated,
} from "../api/movies";
import {
  getTVTrending,
  getTVPopular,
  getTVTopRated,
  getTVOnAir,
} from "../api/tv";
import { Link } from "react-router-dom";
import { MovieGridSkeleton } from "../components/Skeleton";
import { getUserList } from "../api/list";
import RecommendationRow from "../components/RecommendationRow";
import ContinueWatching from "../components/ContinueWatching";

// ── Movies ──────────────────────────────────────────────────────────────────
type MovieSection = "trending" | "now_playing" | "upcoming" | "top_rated";
const MOVIE_TABS: { value: MovieSection; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "now_playing", label: "Now Playing" },
  { value: "top_rated", label: "Top Rated" },
  { value: "upcoming", label: "Upcoming" },
];

// ── TV Shows ─────────────────────────────────────────────────────────────────
type TVSection = "tv_trending" | "tv_popular" | "tv_top_rated" | "tv_on_air";
const TV_TABS: { value: TVSection; label: string }[] = [
  { value: "tv_trending", label: "Trending" },
  { value: "tv_popular", label: "Popular" },
  { value: "tv_top_rated", label: "Top Rated" },
  { value: "tv_on_air", label: "On Air" },
];

type MediaCategory = "movies" | "tv";

export default function Home() {
  useScrollRestoration();
  const [mediaCategory, setMediaCategory] = useState<MediaCategory>("movies");

  // ── Movie state ──
  const [movieTab, setMovieTab] = useState<MovieSection>("trending");
  const [movies, setMovies] = useState<Record<MovieSection, Movie[]>>({
    trending: [],
    now_playing: [],
    upcoming: [],
    top_rated: [],
  });
  const [movieLoading, setMovieLoading] = useState<
    Record<MovieSection, boolean>
  >({
    trending: true,
    now_playing: false,
    upcoming: false,
    top_rated: false,
  });

  // ── TV state ──
  const [tvTab, setTVTab] = useState<TVSection>("tv_trending");
  const [shows, setShows] = useState<Record<TVSection, TVShow[]>>({
    tv_trending: [],
    tv_popular: [],
    tv_top_rated: [],
    tv_on_air: [],
  });
  const [tvLoading, setTVLoading] = useState<Record<TVSection, boolean>>({
    tv_trending: true,
    tv_popular: false,
    tv_top_rated: false,
    tv_on_air: false,
  });
  const [recoSources, setRecoSources] = useState<
    { id: number; title: string; media_type: "movie" | "tv" }[]
  >([]);
  const [myListIds, setMyListIds] = useState<Set<number>>(new Set());

  // ── Fetchers ──
  const fetchMovieSection = async (section: MovieSection) => {
    if (movies[section].length > 0) return;
    setMovieLoading((prev) => ({ ...prev, [section]: true }));
    try {
      let res;
      if (section === "trending") res = await getTrending();
      else if (section === "now_playing") res = await getNowPlaying();
      else if (section === "upcoming") res = await getUpcoming();
      else res = await getTopRated();
      setMovies((prev) => ({ ...prev, [section]: res.data.results ?? [] }));
    } finally {
      setMovieLoading((prev) => ({ ...prev, [section]: false }));
    }
  };

  const fetchTVSection = async (section: TVSection) => {
    if (shows[section].length > 0) return;
    setTVLoading((prev) => ({ ...prev, [section]: true }));
    try {
      let res;
      if (section === "tv_trending") res = await getTVTrending();
      else if (section === "tv_popular") res = await getTVPopular();
      else if (section === "tv_top_rated") res = await getTVTopRated();
      else res = await getTVOnAir();
      setShows((prev) => ({ ...prev, [section]: res.data.results ?? [] }));
    } finally {
      setTVLoading((prev) => ({ ...prev, [section]: false }));
    }
  };

  // Initial load
  useEffect(() => {
    fetchMovieSection("trending");
  }, []);

  // Movie tab change
  useEffect(() => {
    fetchMovieSection(movieTab);
  }, [movieTab]);

  // TV tab change (also pre-load tv_trending when switching to TV for the first time)
  useEffect(() => {
    if (mediaCategory === "tv") fetchTVSection(tvTab);
  }, [mediaCategory, tvTab]);

  // Recommendation sources from user's list
  useEffect(() => {
    getUserList()
      .then((res: { data: { items?: any[] } }) => {
        const list: any[] = res.data.items ?? [];
        setMyListIds(new Set(list.map((i) => i.tmdb_id)));
        const candidates = list
          .slice(0, 20)
          .filter((item) =>
            (item.media_type === "movie" || item.media_type === "tv") &&
            (item.status === "watched" || item.status === "watching")
          )
          .slice(0, 3);

        const sources = candidates
          .filter((item) => item.title)
          .map((item) => ({
            id:         item.tmdb_id,
            title:      item.title as string,
            media_type: item.media_type as "movie" | "tv",
          }));
        setRecoSources(sources);
      })
      .catch(() => {});
  }, []);

  // ── Movie render helpers ──
  const currentMovies = movies[movieTab];
  const featuredMovie = movieTab === "trending" ? currentMovies[0] : null;
  const movieGrid =
    movieTab === "trending" ? currentMovies.slice(1) : currentMovies;
  const isMovieLoading = movieLoading[movieTab];

  // ── TV render helpers ──
  const currentShows = shows[tvTab];
  const featuredShow = tvTab === "tv_trending" ? currentShows[0] : null;
  const tvGrid = tvTab === "tv_trending" ? currentShows.slice(1) : currentShows;
  const isTVLoading = tvLoading[tvTab];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Continue Watching */}
      <ContinueWatching />

      {/* ── Media category toggle ── */}
      <div className="flex gap-2">
        {(["movies", "tv"] as MediaCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setMediaCategory(cat)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
              mediaCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {cat === "movies" ? "🎬 Movies" : "📺 TV Shows"}
          </button>
        ))}
      </div>


      {/* ════════════════════════════════ MOVIES ════════════════════════════════ */}
      {mediaCategory === "movies" && (
        <>
          {/* Trending featured banner */}
          {movieTab === "trending" &&
            (isMovieLoading ? (
              <div className="w-full h-64 md:h-96 rounded-2xl bg-gray-800 animate-pulse" />
            ) : featuredMovie ? (
              <Link
                to={`/movie/${featuredMovie.id}`}
                className="relative block group rounded-2xl overflow-hidden"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w1280${featuredMovie.backdrop_path}`}
                  alt={featuredMovie.title}
                  className="w-full h-64 md:h-96 object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-1">
                    Trending This Week
                  </p>
                  <h2 className="text-white text-2xl md:text-4xl font-bold">
                    {featuredMovie.title}
                  </h2>
                  <p className="text-gray-300 text-sm mt-1 max-w-lg line-clamp-2">
                    {featuredMovie.overview}
                  </p>
                </div>
              </Link>
            ) : null)}

          {/* Upcoming banner */}
          {movieTab === "upcoming" &&
            !isMovieLoading &&
            currentMovies.length > 0 && (
              <Link
                to={`/movie/${currentMovies[0].id}`}
                className="relative block group rounded-2xl overflow-hidden"
              >
                {currentMovies[0].backdrop_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w1280${currentMovies[0].backdrop_path}`}
                    alt={currentMovies[0].title}
                    className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest mb-1">
                    Coming Soon
                  </p>
                  <h2 className="text-white text-2xl md:text-3xl font-bold">
                    {currentMovies[0].title}
                  </h2>
                  <p className="text-gray-300 text-sm mt-1">
                    {currentMovies[0].release_date
                      ? new Date(
                          currentMovies[0].release_date,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : ""}
                  </p>
                </div>
              </Link>
            )}

          {/* Movie tabs + browse link */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {MOVIE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setMovieTab(tab.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    movieTab === tab.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Link
              to="/movies"
              className="text-blue-400 text-sm hover:underline"
            >
              Browse all movies →
            </Link>
          </div>

          {/* Movie grid */}
          {isMovieLoading ? (
            <MovieGridSkeleton count={20} />
          ) : movieGrid.length === 0 ? (
            <div className="text-gray-500 text-center py-20">
              No movies found.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movieGrid.map((movie) => (
                <Link
                  to={`/movie/${movie.id}`}
                  key={movie.id}
                  className="group"
                >
                  <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">
                        No Image
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-white text-sm font-medium truncate">
                        {movie.title}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-gray-500 text-xs">
                          {movie.release_date?.slice(0, 4)}
                        </p>
                        {movie.vote_average > 0 && (
                          <span className="text-yellow-400 text-xs font-medium">
                            ★ {movie.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════ TV SHOWS ════════════════════════════════ */}
      {mediaCategory === "tv" && (
        <>
          {/* Trending TV featured banner */}
          {tvTab === "tv_trending" &&
            (isTVLoading ? (
              <div className="w-full h-64 md:h-96 rounded-2xl bg-gray-800 animate-pulse" />
            ) : featuredShow ? (
              <Link
                to={`/tv/${featuredShow.id}`}
                className="relative block group rounded-2xl overflow-hidden"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w1280${featuredShow.backdrop_path}`}
                  alt={featuredShow.name}
                  className="w-full h-64 md:h-96 object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-1">
                    Trending This Week
                  </p>
                  <h2 className="text-white text-2xl md:text-4xl font-bold">
                    {featuredShow.name}
                  </h2>
                  <p className="text-gray-300 text-sm mt-1 max-w-lg line-clamp-2">
                    {featuredShow.overview}
                  </p>
                </div>
              </Link>
            ) : null)}

          {/* On Air banner */}
          {tvTab === "tv_on_air" && !isTVLoading && currentShows.length > 0 && (
            <Link
              to={`/tv/${currentShows[0].id}`}
              className="relative block group rounded-2xl overflow-hidden"
            >
              {currentShows[0].backdrop_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w1280${currentShows[0].backdrop_path}`}
                  alt={currentShows[0].name}
                  className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">
                  Currently Airing
                </p>
                <h2 className="text-white text-2xl md:text-3xl font-bold">
                  {currentShows[0].name}
                </h2>
              </div>
            </Link>
          )}

          {/* TV tabs + browse link */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {TV_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setTVTab(tab.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    tvTab === tab.value
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Link to="/tv" className="text-purple-400 text-sm hover:underline">
              Browse all TV shows →
            </Link>
          </div>

          {/* TV grid */}
          {isTVLoading ? (
            <MovieGridSkeleton count={20} />
          ) : tvGrid.length === 0 ? (
            <div className="text-gray-500 text-center py-20">
              No shows found.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tvGrid.map((show) => (
                <Link to={`/tv/${show.id}`} key={show.id} className="group">
                  <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition">
                    {show.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${show.poster_path}`}
                        alt={show.name}
                        className="w-full aspect-[2/3] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">
                        No Image
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-white text-sm font-medium truncate">
                        {show.name}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-gray-500 text-xs">
                          {show.first_air_date?.slice(0, 4)}
                        </p>
                        {show.vote_average > 0 && (
                          <span className="text-yellow-400 text-xs font-medium">
                            ★ {show.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Because you watched... */}
      {recoSources.map((source) => (
        <RecommendationRow
          key={`${source.media_type}-${source.id}`}
          sourceId={source.id}
          sourceTitle={source.title}
          mediaType={source.media_type}
          excludeIds={myListIds}
        />
      ))}
    </div>
  );
}
