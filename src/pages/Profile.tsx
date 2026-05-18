import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { UserMedia } from "../types";
import { getMyList, getStats } from "../api/list";
import { Link } from "react-router-dom";
import { ProfileSkeleton } from "../components/Skeleton";
import BackButton from "../components/BackButton";

type TypeStats = {
  total: number;
  watched: number;
  watching: number;
  wishlist: number;
  dropped: number;
  avg_rating: string | null;
  rated_count: number;
  watch_time_minutes: number;
};

function formatWatchTime(minutes: number): string {
  if (!minutes) return "0h";
  const days  = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins  = minutes % 60;
  if (days > 0)  return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

type StatsResponse = {
  stats: TypeStats;
  movie: TypeStats;
  tv: TypeStats;
};

type EnrichedItem = UserMedia & {
  title: string;
  poster_path: string | null;
  media_type: "movie" | "tv";
};

export default function Profile() {
  useScrollRestoration();
  const { user } = useAuth();
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [recentItems, setRecentItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillDone, setBackfillDone] = useState(false);

  const handleBackfill = async () => {
    setBackfilling(true);
    await fetch("http://localhost/mediarate-api/user/backfill_runtime.php", { credentials: "include" });
    setBackfillDone(true);
    setBackfilling(false);
    // Reload stats
    getStats().then((res) => setStatsData(res.data));
  };

  useEffect(() => {
    Promise.allSettled([getStats(), getMyList("movie"), getMyList("tv")])
      .then(async ([statsResult, moviesResult, tvResult]) => {
        if (statsResult.status === "fulfilled") {
          setStatsData(statsResult.value.data);
        }

        const movieItems: UserMedia[] =
          moviesResult.status === "fulfilled" ? moviesResult.value.data.items : [];
        const tvItems: UserMedia[] =
          tvResult.status === "fulfilled" ? tvResult.value.data.items : [];

        // Merge, sort by updated_at, take 6
        const all = [
          ...movieItems.map((i) => ({ ...i, media_type: "movie" as const })),
          ...tvItems.map((i) => ({ ...i, media_type: "tv" as const })),
        ].sort(
          (a, b) =>
            new Date(b.updated_at ?? b.created_at).getTime() -
            new Date(a.updated_at ?? a.created_at).getTime(),
        ).slice(0, 6);

        // Use stored title/poster instantly; enrich old items in background
        const initial: EnrichedItem[] = all.map((item: any) => ({
          ...item,
          title:       item.title || "",
          poster_path: item.poster_path ?? null,
        }));
        setRecentItems(initial);

        const toEnrich = all.filter((item: any) => !item.title);
        await Promise.all(
          toEnrich.map(async (item: any) => {
            try {
              const endpoint =
                item.media_type === "movie"
                  ? `http://localhost/mediarate-api/movies/details.php?id=${item.tmdb_id}`
                  : `http://localhost/mediarate-api/tv/details.php?id=${item.tmdb_id}`;
              const r = await fetch(endpoint, { credentials: "include" });
              const d = await r.json();
              const enriched = {
                ...item,
                title:       (item.media_type === "movie" ? d.title : d.name) ?? "Unknown",
                poster_path: d.poster_path ?? null,
              };
              setRecentItems((prev) =>
                prev.map((i) => i.tmdb_id === enriched.tmdb_id && i.media_type === enriched.media_type ? enriched : i)
              );
            } catch {}
          })
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const combined = statsData?.stats;
  const movieStats = statsData?.movie;
  const tvStats = statsData?.tv;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <BackButton />

      {/* Avatar + username */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {user?.username[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-white text-2xl font-bold">{user?.username}</h1>
          <p className="text-gray-400 text-sm">{user?.email}</p>
        </div>
      </div>

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <>
          {/* Combined status stats */}
          {combined && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Watched",  value: combined.watched,  color: "text-green-400"  },
                { label: "Watching", value: combined.watching, color: "text-blue-400"   },
                { label: "Wishlist", value: combined.wishlist, color: "text-purple-400" },
                { label: "Dropped",  value: combined.dropped,  color: "text-red-400"    },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 rounded-2xl px-5 py-4 text-center">
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value ?? 0}</p>
                  <p className="text-gray-400 text-sm mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Backfill watch time for old items */}
          {!backfillDone && combined && combined.watch_time_minutes === 0 && combined.watched > 0 && (
            <button
              onClick={handleBackfill}
              disabled={backfilling}
              className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm py-3 rounded-2xl transition"
            >
              {backfilling ? "Calculating watch time... (this may take a moment)" : "⏱ Calculate your watch time"}
            </button>
          )}

          {/* Watch time */}
          {combined && combined.watch_time_minutes > 0 && (
            <div className="bg-gray-900 rounded-2xl px-6 py-5 flex items-center gap-4 flex-wrap">
              <span className="text-2xl">⏱</span>
              <div>
                <p className="text-white text-2xl font-bold">{formatWatchTime(combined.watch_time_minutes)}</p>
                <p className="text-gray-400 text-sm">Total Watch Time</p>
              </div>
              <div className="ml-auto flex gap-6">
                {movieStats && movieStats.watch_time_minutes > 0 && (
                  <div className="text-center">
                    <p className="text-blue-400 font-semibold">{formatWatchTime(movieStats.watch_time_minutes)}</p>
                    <p className="text-gray-500 text-xs mt-0.5">🎬 Movies</p>
                  </div>
                )}
                {tvStats && tvStats.watch_time_minutes > 0 && (
                  <div className="text-center">
                    <p className="text-purple-400 font-semibold">{formatWatchTime(tvStats.watch_time_minutes)}</p>
                    <p className="text-gray-500 text-xs mt-0.5">📺 TV Shows</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Avg rating + totals */}
          {combined && combined.rated_count > 0 && (
            <div className="bg-gray-900 rounded-2xl px-6 py-5 flex items-center gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-yellow-400 text-4xl font-bold">{combined.avg_rating}</p>
                <p className="text-gray-400 text-sm mt-1">Average Rating</p>
              </div>
              <div className="h-12 w-px bg-gray-700" />
              <div className="text-center">
                <p className="text-white text-4xl font-bold">{combined.rated_count}</p>
                <p className="text-gray-400 text-sm mt-1">Items Rated</p>
              </div>
              <div className="h-12 w-px bg-gray-700" />
              <div className="text-center">
                <p className="text-white text-4xl font-bold">{combined.total}</p>
                <p className="text-gray-400 text-sm mt-1">Total in List</p>
              </div>
            </div>
          )}

          {/* Per-type breakdown */}
          {(movieStats || tvStats) && combined && combined.total > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Movies */}
              <div className="bg-gray-900 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🎬</span>
                  <h2 className="text-white font-bold">Movies</h2>
                  <span className="ml-auto text-gray-500 text-sm">{movieStats?.total ?? 0} total</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Watched",  value: movieStats?.watched,  color: "text-green-400"  },
                    { label: "Watching", value: movieStats?.watching, color: "text-blue-400"   },
                    { label: "Wishlist", value: movieStats?.wishlist, color: "text-purple-400" },
                    { label: "Dropped",  value: movieStats?.dropped,  color: "text-red-400"    },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-800 rounded-xl px-3 py-2 text-center">
                      <p className={`text-xl font-bold ${s.color}`}>{s.value ?? 0}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                {movieStats && movieStats.rated_count > 0 && (
                  <p className="text-gray-500 text-xs mt-3 text-center">
                    Avg rating: <span className="text-yellow-400 font-semibold">{movieStats.avg_rating}</span>
                    {" "}· {movieStats.rated_count} rated
                  </p>
                )}
              </div>

              {/* TV Shows */}
              <div className="bg-gray-900 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📺</span>
                  <h2 className="text-white font-bold">TV Shows</h2>
                  <span className="ml-auto text-gray-500 text-sm">{tvStats?.total ?? 0} total</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Watched",  value: tvStats?.watched,  color: "text-green-400"  },
                    { label: "Watching", value: tvStats?.watching, color: "text-blue-400"   },
                    { label: "Wishlist", value: tvStats?.wishlist, color: "text-purple-400" },
                    { label: "Dropped",  value: tvStats?.dropped,  color: "text-red-400"    },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-800 rounded-xl px-3 py-2 text-center">
                      <p className={`text-xl font-bold ${s.color}`}>{s.value ?? 0}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                {tvStats && tvStats.rated_count > 0 && (
                  <p className="text-gray-500 text-xs mt-3 text-center">
                    Avg rating: <span className="text-yellow-400 font-semibold">{tvStats.avg_rating}</span>
                    {" "}· {tvStats.rated_count} rated
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Year in Review link */}
          <Link
            to="/year-in-review"
            className="flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-2xl px-6 py-4 transition group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-white font-semibold">{new Date().getFullYear()} in Review</p>
                <p className="text-gray-400 text-sm">Movies & shows you finished this year</p>
              </div>
            </div>
            <span className="text-gray-500 group-hover:text-white transition text-lg">→</span>
          </Link>

          {/* Recently Added */}
          {recentItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-xl font-bold">Recently Added</h2>
                <Link to="/my-list" className="text-blue-400 text-sm hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {recentItems.map((item) => (
                  <Link
                    to={`/${item.media_type === "movie" ? "movie" : "tv"}/${item.tmdb_id}`}
                    key={`${item.media_type}-${item.id}`}
                  >
                    <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition relative">
                      {item.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                          alt={item.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-xs">
                          No Image
                        </div>
                      )}
                      {/* type badge */}
                      <div className={`absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded font-semibold ${
                        item.media_type === "tv" ? "bg-purple-600/80 text-white" : "bg-blue-600/80 text-white"
                      }`}>
                        {item.media_type === "tv" ? "TV" : "M"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
