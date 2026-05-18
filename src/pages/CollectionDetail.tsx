import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { getCollection } from "../api/movies";
import BackButton from "../components/BackButton";

type CollectionMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
};

type Collection = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: CollectionMovie[];
};

export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useScrollRestoration();

  useEffect(() => {
    setLoading(true);
    getCollection(Number(id))
      .then((res) => setCollection(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return <div className="text-gray-400 text-center py-20">Loading...</div>;
  if (!collection)
    return (
      <div className="text-gray-400 text-center py-20">
        Collection not found.
      </div>
    );

  const sorted = [...collection.parts].sort((a, b) =>
    (a.release_date ?? "").localeCompare(b.release_date ?? ""),
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <BackButton />
      {/* Backdrop */}
      {collection.backdrop_path && (
        <div className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden">
          <img
            src={`https://image.tmdb.org/t/p/w1280${collection.backdrop_path}`}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <h1 className="text-white text-3xl font-bold">{collection.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{sorted.length} movies</p>
          </div>
        </div>
      )}

      {!collection.backdrop_path && (
        <div>
          <h1 className="text-white text-3xl font-bold">{collection.name}</h1>
          <p className="text-gray-400 text-sm mt-1">{sorted.length} movies</p>
        </div>
      )}

      {/* Overview */}
      {collection.overview && (
        <p className="text-gray-400 text-sm leading-relaxed">
          {collection.overview}
        </p>
      )}

      {/* Movies */}
      <div className="space-y-6">
        {sorted.map((movie, index) => (
          <Link to={`/movie/${movie.id}`} key={movie.id} className="block mb-4">
            <div className="flex gap-4 bg-gray-900 rounded-2xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition p-3">
              {/* Number */}
              <div className="shrink-0 w-8 flex items-center justify-center text-gray-600 font-bold text-lg">
                {index + 1}
              </div>

              {/* Poster */}
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                  alt={movie.title}
                  className="w-14 rounded-lg shrink-0 object-cover"
                />
              ) : (
                <div className="w-14 h-20 bg-gray-800 rounded-lg shrink-0 flex items-center justify-center text-gray-600 text-xs">
                  N/A
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-white font-semibold">{movie.title}</h3>
                  <span className="text-gray-500 text-sm">
                    {movie.release_date?.slice(0, 4)}
                  </span>
                  {movie.vote_average > 0 && (
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full font-medium">
                      ★ {movie.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                {movie.overview && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                    {movie.overview}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
