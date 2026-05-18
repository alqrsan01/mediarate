import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getYearReview } from "../api/list";
import BackButton from "../components/BackButton";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type MonthData = { movie: number; tv: number };

type ReviewData = {
  year: number;
  total: number;
  movie: { total: number; rated_count: number; avg_rating: string | null; watch_time_minutes: number };
  tv:    { total: number; rated_count: number; avg_rating: string | null; watch_time_minutes: number };
  monthly: MonthData[];
  items: { tmdb_id: number; media_type: string; title: string; poster_path: string | null; rating: number | null; updated_at: string }[];
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

export default function YearInReview() {
  const currentYear = new Date().getFullYear();
  const [year, setYear]     = useState(currentYear);
  const [data, setData]     = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<"all" | "movie" | "tv">("all");

  useEffect(() => {
    setLoading(true);
    getYearReview(year)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [year]);

  const maxMonthly = data
    ? Math.max(...data.monthly.map((m) => m.movie + m.tv), 1)
    : 1;

  const filteredItems = data?.items.filter((i) =>
    mediaFilter === "all" ? true : i.media_type === mediaFilter
  ) ?? [];

  // Group filtered items by month (1-based)
  const byMonth: Record<number, typeof filteredItems> = {};
  for (const item of filteredItems) {
    const m = new Date(item.updated_at).getMonth() + 1;
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(item);
  }
  const monthKeys = Object.keys(byMonth).map(Number).sort((a, b) => b - a);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <BackButton />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold">{year} in Review</h1>
          <p className="text-gray-400 text-sm mt-1">Everything you finished this year</p>
        </div>
        <div className="flex gap-2">
          {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                year === y ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !data || data.total === 0 ? (
        <div className="text-gray-500 text-center py-20">
          Nothing finished in {year} yet.
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Finished", value: data.total,        color: "text-white"        },
              { label: "🎬 Movies",      value: data.movie.total,  color: "text-blue-400"     },
              { label: "📺 TV Shows",    value: data.tv.total,     color: "text-purple-400"   },
              { label: "Watch Time",     value: formatWatchTime(data.movie.watch_time_minutes + data.tv.watch_time_minutes), color: "text-yellow-400" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 rounded-2xl px-5 py-4 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-gray-400 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Ratings */}
          {(data.movie.rated_count > 0 || data.tv.rated_count > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.movie.rated_count > 0 && (
                <div className="bg-gray-900 rounded-2xl px-5 py-4 flex items-center gap-4">
                  <span className="text-2xl">🎬</span>
                  <div>
                    <p className="text-yellow-400 text-2xl font-bold">{data.movie.avg_rating}</p>
                    <p className="text-gray-400 text-sm">Avg movie rating · {data.movie.rated_count} rated</p>
                  </div>
                </div>
              )}
              {data.tv.rated_count > 0 && (
                <div className="bg-gray-900 rounded-2xl px-5 py-4 flex items-center gap-4">
                  <span className="text-2xl">📺</span>
                  <div>
                    <p className="text-yellow-400 text-2xl font-bold">{data.tv.avg_rating}</p>
                    <p className="text-gray-400 text-sm">Avg TV rating · {data.tv.rated_count} rated</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Monthly bar chart */}
          <div className="bg-gray-900 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Activity by Month</h2>
            <div className="flex items-end gap-1.5 h-28">
              {data.monthly.map((m, i) => {
                const total = m.movie + m.tv;
                const heightPct = total / maxMonthly;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end rounded-t overflow-hidden" style={{ height: "80px" }}>
                      <div
                        className="w-full bg-purple-500 rounded-t"
                        style={{ height: `${(m.tv / maxMonthly) * 80}px` }}
                      />
                      <div
                        className="w-full bg-blue-500"
                        style={{ height: `${(m.movie / maxMonthly) * 80}px` }}
                      />
                    </div>
                    <span className="text-gray-500 text-xs">{MONTHS[i]}</span>
                    {total > 0 && <span className="text-gray-400 text-xs font-medium">{total}</span>}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />Movies</span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />TV Shows</span>
            </div>
          </div>

          {/* Items by month */}
          <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-white text-xl font-bold">Everything You Watched</h2>
              <div className="flex gap-2">
                {(["all", "movie", "tv"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setMediaFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      mediaFilter === f ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {f === "all" ? `All (${data.total})` : f === "movie" ? `🎬 ${data.movie.total}` : `📺 ${data.tv.total}`}
                  </button>
                ))}
              </div>
            </div>

            {monthKeys.length === 0 && (
              <p className="text-gray-500 text-center py-10">No items match this filter.</p>
            )}

            {monthKeys.map((m) => (
              <div key={m}>
                {/* Month header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-white font-semibold text-lg">
                    {MONTHS[m - 1]} <span className="text-gray-500 font-normal text-base">{year}</span>
                  </h3>
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-gray-500 text-sm">{byMonth[m].length} title{byMonth[m].length !== 1 ? "s" : ""}</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {byMonth[m].map((item) => (
                    <Link
                      to={`/${item.media_type === "movie" ? "movie" : "tv"}/${item.tmdb_id}`}
                      key={`${item.media_type}-${item.tmdb_id}`}
                    >
                      <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition relative">
                        {item.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                            alt={item.title}
                            className="w-full aspect-[2/3] object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-xs text-center p-1">
                            {item.title}
                          </div>
                        )}
                        {item.rating && (
                          <div className="absolute top-1 left-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                            {item.rating}
                          </div>
                        )}
                        <div className={`absolute top-1 right-1 text-xs px-1 py-0.5 rounded font-semibold ${
                          item.media_type === "tv" ? "bg-purple-600/80 text-white" : "bg-blue-600/80 text-white"
                        }`}>
                          {item.media_type === "tv" ? "TV" : "M"}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
