import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getContinueWatching } from "../api/list";

type ContinueItem = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  watched_episodes: number;
  last_season: number | null;
  last_episode: number | null;
  next_season: number;
  next_episode: number;
};

export default function ContinueWatching() {
  const [items, setItems] = useState<ContinueItem[]>([]);

  useEffect(() => {
    getContinueWatching()
      .then((res) => setItems(res.data.items ?? []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white text-lg font-semibold">Continue Watching</h2>
        <Link to="/my-list?type=tv&status=watching" className="text-purple-400 text-sm hover:underline">
          See all →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {items.map((item) => (
          <Link
            to={`/tv/${item.tmdb_id}`}
            key={item.tmdb_id}
            className="shrink-0 w-32 group"
          >
            <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition relative">
              {item.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                  alt={item.title}
                  className="w-full aspect-[2/3] object-cover"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-xs text-center p-2">
                  {item.title}
                </div>
              )}

              {/* Next episode badge */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent px-2 py-2">
                <p className="text-white text-xs font-semibold truncate">{item.title}</p>
                <p className="text-purple-300 text-xs mt-0.5">
                  {item.last_season
                    ? `Next S${item.next_season}E${item.next_episode}`
                    : item.watched_episodes > 0
                    ? `${item.watched_episodes} ep watched`
                    : "Start watching"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
