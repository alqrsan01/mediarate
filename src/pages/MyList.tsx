import { useEffect, useState, useMemo } from "react";
import { MediaStatus, UserMedia } from "../types";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { getMyList, removeFromList, getContinueWatching } from "../api/list";
import { Link, useSearchParams } from "react-router-dom";
import { MyListSkeleton } from "../components/Skeleton";
import BackButton from "../components/BackButton";

const STATUS_TABS: { value: MediaStatus | "all"; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "watched",  label: "Watched" },
  { value: "watching", label: "Watching" },
  { value: "wishlist", label: "Wishlist" },
  { value: "dropped",  label: "Dropped" },
];

const SORT_OPTIONS = [
  { value: "date_added_desc", label: "Date Added (Newest)" },
  { value: "date_added_asc",  label: "Date Added (Oldest)" },
  { value: "rating_desc",     label: "My Rating (High → Low)" },
  { value: "rating_asc",      label: "My Rating (Low → High)" },
  { value: "title_asc",       label: "Title (A → Z)" },
  { value: "title_desc",      label: "Title (Z → A)" },
  { value: "year_desc",       label: "Release Year (Newest)" },
  { value: "year_asc",        label: "Release Year (Oldest)" },
];

type EnrichedItem = UserMedia & {
  title: string;
  poster_path: string | null;
  release_date: string;
};

type MediaCategory = "movie" | "tv";

const detailsCache = new Map<string, { title: string; poster_path: string | null; release_date: string }>();

async function enrichItem(item: UserMedia & { title?: string; poster_path?: string | null }, type: MediaCategory): Promise<EnrichedItem> {
  if (item.title && item.poster_path !== undefined) {
    return { ...item, title: item.title, poster_path: item.poster_path ?? null, release_date: (item as any).release_date ?? "" };
  }
  const cacheKey = `${type}-${item.tmdb_id}`;
  const cached = detailsCache.get(cacheKey);
  if (cached) return { ...item, ...cached };
  try {
    const endpoint =
      type === "movie"
        ? `http://localhost/mediarate-api/movies/details.php?id=${item.tmdb_id}`
        : `http://localhost/mediarate-api/tv/details.php?id=${item.tmdb_id}`;
    const r = await fetch(endpoint, { credentials: "include" });
    const d = await r.json();
    const enriched = {
      title:        (type === "movie" ? d.title : d.name) ?? "Unknown",
      poster_path:  d.poster_path ?? null,
      release_date: type === "movie" ? (d.release_date ?? "") : (d.first_air_date ?? ""),
    };
    detailsCache.set(cacheKey, enriched);
    return { ...item, ...enriched };
  } catch {
    return { ...item, title: "Unknown", poster_path: null, release_date: "" };
  }
}

export default function MyList() {
  useScrollRestoration();
  const [searchParams, setSearchParams] = useSearchParams();
  const mediaType = (searchParams.get("type") === "tv" ? "tv" : "movie") as MediaCategory;
  const activeTab = (searchParams.get("status") ?? "all") as MediaStatus | "all";

  const setMediaType = (t: MediaCategory) =>
    setSearchParams((p) => { const n = new URLSearchParams(p); n.set("type", t); return n; }, { replace: true });
  const setActiveTab = (s: MediaStatus | "all") =>
    setSearchParams((p) => { const n = new URLSearchParams(p); n.set("status", s); return n; }, { replace: true });

  const [items, setItems]           = useState<EnrichedItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [sortBy, setSortBy]         = useState("date_added_desc");
  const [search, setSearch]         = useState("");
  const [nextEpMap, setNextEpMap]   = useState<Map<number, { next_season: number; next_episode: number }>>(new Map());

  useEffect(() => {
    if (mediaType !== "tv") return;
    getContinueWatching()
      .then((res) => {
        const map = new Map<number, { next_season: number; next_episode: number }>();
        for (const item of res.data.items ?? []) {
          map.set(item.tmdb_id, { next_season: item.next_season, next_episode: item.next_episode });
        }
        setNextEpMap(map);
      })
      .catch(() => {});
  }, [mediaType]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setItems([]);
    getMyList(mediaType)
      .then(async (res) => {
        if (cancelled) return;
        const raw: any[] = res.data.items ?? [];

        // Show items with stored data immediately — no waiting
        const initial: EnrichedItem[] = raw.map((item) => ({
          ...item,
          title:        item.title || "",
          poster_path:  item.poster_path ?? null,
          release_date: item.release_date ?? "",
        }));
        if (!cancelled) { setItems(initial); setLoading(false); }

        // Enrich only items that are still missing a title (old items)
        const toEnrich = raw.filter((item) => !item.title);
        await Promise.all(
          toEnrich.map(async (item) => {
            const enriched = await enrichItem(item, mediaType);
            if (cancelled) return;
            setItems((prev) =>
              prev.map((i) => i.tmdb_id === enriched.tmdb_id ? enriched : i)
            );
          })
        );
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mediaType]);

  const handleRemove = async (tmdb_id: number) => {
    await removeFromList(tmdb_id, mediaType);
    setItems((prev) => prev.filter((i) => i.tmdb_id !== tmdb_id));
  };

  const filtered = useMemo(() => {
    let result =
      activeTab === "all" ? [...items] : items.filter((i) => i.status === activeTab);

    if (search.trim()) {
      result = result.filter((i) =>
        i.title.toLowerCase().includes(search.trim().toLowerCase()),
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date_added_desc": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date_added_asc":  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "rating_desc":     return (b.rating ?? 0) - (a.rating ?? 0);
        case "rating_asc":      return (a.rating ?? 0) - (b.rating ?? 0);
        case "title_asc":       return a.title.localeCompare(b.title);
        case "title_desc":      return b.title.localeCompare(a.title);
        case "year_desc":       return (b.release_date ?? "").localeCompare(a.release_date ?? "");
        case "year_asc":        return (a.release_date ?? "").localeCompare(b.release_date ?? "");
        default:                return 0;
      }
    });

    return result;
  }, [items, activeTab, sortBy, search]);

  const itemLabel = mediaType === "movie" ? "movie" : "show";
  const itemLabelPlural = mediaType === "movie" ? "movies" : "shows";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackButton />

      <h1 className="text-white text-2xl font-bold mt-4 mb-6">My List</h1>

      {/* Media type toggle */}
      <div className="flex gap-2 mb-6">
        {(["movie", "tv"] as MediaCategory[]).map((t) => (
          <button
            key={t}
            onClick={() => setMediaType(t)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
              mediaType === t
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {t === "movie" ? "🎬 Movies" : "📺 TV Shows"}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              activeTab === tab.value
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-70">
              {tab.value === "all"
                ? items.length
                : items.filter((i) => i.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search your ${itemLabelPlural}...`}
          className="flex-1 min-w-48 bg-gray-800 text-white rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading && <MyListSkeleton />}

      {!loading && filtered.length === 0 && (
        <div className="text-gray-500 text-center py-20">
          {search ? (
            <>No results for "<span className="text-white">{search}</span>"</>
          ) : (
            <>
              Nothing here yet.{" "}
              <Link
                to={mediaType === "movie" ? "/movies" : "/tv"}
                className="text-blue-400 hover:underline"
              >
                Browse {itemLabelPlural}
              </Link>
            </>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-gray-500 text-sm mb-4">
          {filtered.length} {filtered.length === 1 ? itemLabel : itemLabelPlural}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="group relative bg-gray-900 rounded-xl overflow-hidden">
            <Link to={`/${mediaType === "movie" ? "movie" : "tv"}/${item.tmdb_id}`}>
              {item.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                  alt={item.title}
                  className="w-full aspect-[2/3] object-cover group-hover:opacity-80 transition"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">
                  No Image
                </div>
              )}
            </Link>

            {item.rating && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-md">
                {item.rating}/10
              </div>
            )}

            <button
              onClick={() => handleRemove(item.tmdb_id)}
              className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>

            <div className="p-2">
              <p className="text-white text-sm font-medium truncate">{item.title}</p>
              <p className="text-gray-500 text-xs">{item.release_date?.slice(0, 4)}</p>
              <span
                className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
                  item.status === "watched"
                    ? "bg-green-600/20 text-green-400"
                    : item.status === "watching"
                    ? "bg-blue-600/20 text-blue-400"
                    : item.status === "wishlist"
                    ? "bg-purple-600/20 text-purple-400"
                    : "bg-red-600/20 text-red-400"
                }`}
              >
                {item.status}
              </span>
              {mediaType === "tv" && item.status === "watching" && nextEpMap.has(item.tmdb_id) && (
                <p className="text-purple-400 text-xs mt-1">
                  Next S{nextEpMap.get(item.tmdb_id)!.next_season}E{nextEpMap.get(item.tmdb_id)!.next_episode}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
