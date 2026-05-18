import { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { getMoviesByCompany, getTVByCompany } from "../api/search";
import { Movie, TVShow } from "../types";

type MediaTab = "movies" | "tv";

export default function CompanyDetail() {
  useScrollRestoration();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const companyId = Number(id);

  const [tab, setTab]             = useState<MediaTab>("movies");
  const [movies, setMovies]       = useState<Movie[]>([]);
  const [tvShows, setTVShows]     = useState<TVShow[]>([]);
  const [moviePage, setMoviePage] = useState(1);
  const [tvPage, setTVPage]       = useState(1);
  const [movieTotal, setMovieTotal] = useState(0);
  const [tvTotal, setTVTotal]     = useState(0);
  const [loading, setLoading]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [companyName, setCompanyName] = useState<string>((location.state as any)?.name ?? "");

  // Load movies
  const loadMovies = useCallback(async (page: number, append = false) => {
    if (!companyId) return;
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const res = await getMoviesByCompany(companyId, page);
      const data = res.data;
      setMovieTotal(data.total_results ?? 0);
      setMovies((prev) => append ? [...prev, ...(data.results ?? [])] : (data.results ?? []));
    } catch {
      // silent
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [companyId]);

  // Load TV
  const loadTV = useCallback(async (page: number, append = false) => {
    if (!companyId) return;
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const res = await getTVByCompany(companyId, page);
      const data = res.data;
      setTVTotal(data.total_results ?? 0);
      setTVShows((prev) => append ? [...prev, ...(data.results ?? [])] : (data.results ?? []));
    } catch {
      // silent
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [companyId]);

  // Initial load – both tabs
  useEffect(() => {
    setMovies([]);
    setTVShows([]);
    setMoviePage(1);
    setTVPage(1);
    loadMovies(1);
    loadTV(1);
  }, [companyId]);


  const handleLoadMoreMovies = () => {
    const next = moviePage + 1;
    setMoviePage(next);
    loadMovies(next, true);
  };

  const handleLoadMoreTV = () => {
    const next = tvPage + 1;
    setTVPage(next);
    loadTV(next, true);
  };

  const hasMoreMovies = movies.length < movieTotal;
  const hasMoreTV     = tvShows.length < tvTotal;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm mb-1">Production Company</p>
        <h1 className="text-white text-2xl font-bold">
          {companyName || `Company #${companyId}`}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {movieTotal} movie{movieTotal !== 1 ? "s" : ""} · {tvTotal} TV show{tvTotal !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("movies")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            tab === "movies" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          🎬 Movies <span className="ml-1 text-xs opacity-70">{movieTotal}</span>
        </button>
        <button
          onClick={() => setTab("tv")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            tab === "tv" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          📺 TV Shows <span className="ml-1 text-xs opacity-70">{tvTotal}</span>
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl aspect-[2/3] animate-pulse" />
          ))}
        </div>
      )}

      {/* Movies grid */}
      {!loading && tab === "movies" && (
        <>
          {movies.length === 0 ? (
            <p className="text-gray-500 text-center py-16">No movies found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map((m) => (
                <Link to={`/movie/${m.id}`} key={m.id}>
                  <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                    {m.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                        alt={m.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">No image</div>
                    )}
                    <div className="p-2">
                      <p className="text-white text-sm font-medium truncate">{m.title}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-gray-500 text-xs">{m.release_date?.slice(0, 4)}</p>
                        {m.vote_average > 0 && <span className="text-yellow-400 text-xs">★ {m.vote_average.toFixed(1)}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {hasMoreMovies && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMoreMovies}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
              >
                {loadingMore ? "Loading…" : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      {/* TV grid */}
      {!loading && tab === "tv" && (
        <>
          {tvShows.length === 0 ? (
            <p className="text-gray-500 text-center py-16">No TV shows found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tvShows.map((s) => (
                <Link to={`/tv/${s.id}`} key={s.id}>
                  <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition">
                    {s.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${s.poster_path}`}
                        alt={s.name}
                        className="w-full aspect-[2/3] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">No image</div>
                    )}
                    <div className="p-2">
                      <p className="text-white text-sm font-medium truncate">{s.name}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-gray-500 text-xs">{s.first_air_date?.slice(0, 4)}</p>
                        {s.vote_average > 0 && <span className="text-yellow-400 text-xs">★ {s.vote_average.toFixed(1)}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {hasMoreTV && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMoreTV}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
              >
                {loadingMore ? "Loading…" : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
