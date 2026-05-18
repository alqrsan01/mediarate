import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { discoverTV, getTVGenres } from "../api/tv";
import { TVShow } from "../types";
import { BrowseSkeleton } from "../components/Skeleton";
import BackButton from "../components/BackButton";

const SORT_OPTIONS = [
  { value: "popularity.desc",      label: "Most Popular" },
  { value: "popularity.asc",       label: "Least Popular" },
  { value: "vote_average.desc",    label: "Highest Rated" },
  { value: "vote_average.asc",     label: "Lowest Rated" },
  { value: "first_air_date.desc",  label: "Newest First" },
  { value: "first_air_date.asc",   label: "Oldest First" },
  { value: "name.asc",             label: "Title A–Z" },
  { value: "name.desc",            label: "Title Z–A" },
];

type Genre = { id: number; name: string };

const SHOWS_PER_LOAD = 50;
const TMDB_PAGE_SIZE = 20;

let cache: {
  shows: TVShow[];
  scroll: number;
  sort: string;
  genre: string;
  year: string;
  tmdbPage: number;
  buffer: TVShow[];
  totalResults: number;
} | null = null;

export default function BrowseTV() {
  const [searchParams, setSearchParams] = useSearchParams();

  const sort  = searchParams.get("sort_by") ?? "popularity.desc";
  const genre = searchParams.get("genre") ?? "";
  const year  = searchParams.get("year") ?? "";

  const cacheHit = cache && cache.sort === sort && cache.genre === genre && cache.year === year;

  const [shows, setShows]             = useState<TVShow[]>(cacheHit ? cache!.shows : []);
  const [genres, setGenres]           = useState<Genre[]>([]);
  const [loading, setLoading]         = useState(!cacheHit);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalResults, setTotalResults] = useState(cacheHit ? cache!.totalResults : 0);
  const [canLoadMore, setCanLoadMore]   = useState(true);

  const tmdbPageRef  = useRef(cacheHit ? cache!.tmdbPage : 1);
  const bufferRef    = useRef<TVShow[]>(cacheHit ? cache!.buffer : []);
  const sentinelRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cacheHit && cache!.scroll > 0) {
      const s = cache!.scroll;
      setTimeout(() => window.scrollTo(0, s), 50);
      setTimeout(() => window.scrollTo(0, s), 150);
      setTimeout(() => window.scrollTo(0, s), 400);
    }
  }, []);

  useEffect(() => {
    return () => { if (cache) cache.scroll = window.scrollY; };
  }, []);

  useEffect(() => {
    getTVGenres().then((res) => setGenres(res.data.genres ?? []));
  }, []);

  useEffect(() => {
    if (cacheHit) return;
    cache = null;
    tmdbPageRef.current = 1;
    bufferRef.current   = [];
    setShows([]);
    setLoading(true);
    fetchUntilEnough(true);
  }, [sort, genre, year]);

  async function fetchUntilEnough(initial: boolean) {
    let buffer = initial ? [] : [...bufferRef.current];

    while (buffer.length < SHOWS_PER_LOAD) {
      const res  = await discoverTV({ sort_by: sort, page: tmdbPageRef.current, genre, year });
      const data = res.data;
      if (initial) setTotalResults(data.total_results ?? 0);
      buffer = [...buffer, ...(data.results ?? [])];
      tmdbPageRef.current++;
      if (tmdbPageRef.current > (data.total_pages ?? 1)) break;
    }

    const toShow   = buffer.slice(0, SHOWS_PER_LOAD);
    const leftover = buffer.slice(SHOWS_PER_LOAD);
    bufferRef.current = leftover;

    setShows((prev) => {
      const next = initial ? toShow : [...prev, ...toShow];
      cache = {
        shows: next,
        scroll: 0,
        sort, genre, year,
        tmdbPage: tmdbPageRef.current,
        buffer: leftover,
        totalResults: initial ? 0 : totalResults,
      };
      return next;
    });

    setCanLoadMore(leftover.length > 0 || tmdbPageRef.current <= 500);
    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    if (cache && cache.sort === sort) cache.totalResults = totalResults;
  }, [totalResults]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && canLoadMore && !loadingMore && !loading) {
          setLoadingMore(true);
          fetchUntilEnough(false);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [canLoadMore, loadingMore, loading]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackButton />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">All TV Shows</h1>
          {!loading && (
            <p className="text-gray-500 text-sm mt-0.5">{totalResults.toLocaleString()} shows found</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={sort}
          onChange={(e) => setFilter("sort_by", e.target.value)}
          className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={genre}
          onChange={(e) => setFilter("genre", e.target.value)}
          className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Genres</option>
          {genres.map((g) => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
        </select>

        <select
          value={year}
          onChange={(e) => setFilter("year", e.target.value)}
          className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Years</option>
          {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>

        {(genre || year || sort !== "popularity.desc") && (
          <button onClick={() => setSearchParams({})} className="text-red-400 text-sm hover:underline px-2">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <BrowseSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shows.map((show) => (
              <Link to={`/tv/${show.id}`} key={show.id} className="group">
                <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                  {show.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${show.poster_path}`} alt={show.name} className="w-full aspect-[2/3] object-cover" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">No Image</div>
                  )}
                  <div className="p-2">
                    <p className="text-white text-sm font-medium truncate">{show.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-gray-500 text-xs">{show.first_air_date?.slice(0, 4)}</p>
                      {show.vote_average > 0 && (
                        <span className="text-yellow-400 text-xs font-medium">★ {show.vote_average.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div ref={sentinelRef} className="h-10 mt-6 flex items-center justify-center">
            {loadingMore && <span className="text-gray-500 text-sm">Loading...</span>}
          </div>
        </>
      )}
    </div>
  );
}
