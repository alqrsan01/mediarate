import { useEffect, useState } from "react";
import { getMovieRecommendations } from "../api/movies";
import { getTVRecommendations } from "../api/tv";
import { Link } from "react-router-dom";

interface Props {
  sourceId: number;
  sourceTitle: string;
  mediaType: 'movie' | 'tv';
  excludeIds?: Set<number>;
}

interface Item {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
}

export default function RecommendationRow({ sourceId, sourceTitle, mediaType, excludeIds }: Props) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const fn = mediaType === 'movie' ? getMovieRecommendations : getTVRecommendations;
    fn(sourceId)
     .then((response) => {
      const results: Item[] = response.data.results ?? [];
      const filtered = excludeIds
        ? results.filter((item) => !excludeIds.has(item.id))
        : results;
      setItems(filtered.slice(0, 12));
     })
     .catch(() => setItems([]));
  }, [sourceId, mediaType]);

  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-white text-lg font-semibold mb-3">
        Because you watched{" "}
        <span className={mediaType === "tv" ? "text-purple-400" : "text-blue-400"}>{sourceTitle}</span>
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => {
          const title = item.title || item.name || "";
          const href  = mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
          return (
            <Link to={href} key={item.id} className="shrink-0 w-32">
              <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                    alt={title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-xs">
                    No image
                  </div>
                )}
                <div className="p-1.5">
                  <p className="text-white text-xs font-medium truncate">{title}</p>
                  {item.vote_average > 0 && (
                    <p className="text-yellow-400 text-xs">★ {item.vote_average.toFixed(1)}</p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  )
}