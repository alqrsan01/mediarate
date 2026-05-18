import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import BackButton from "../components/BackButton";
import { getMovieDetails } from "../api/movies";
import { MovieImage } from "../types";

type Tab = "backdrops" | "posters";

type MovieBasic = {
  id: number;
  title: string;
  images: {
    backdrops: MovieImage[];
    posters: MovieImage[];
  };
};

export default function MoviePhotos() {
  const { id } = useParams();
  const [movie, setMovie]     = useState<MovieBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("backdrops");
  const [lightbox, setLightbox]   = useState<string | null>(null);

  useScrollRestoration();

  useEffect(() => {
    setLoading(true);
    getMovieDetails(Number(id))
      .then((res) => setMovie(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  // Close lightbox on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="h-7 bg-gray-800 rounded animate-pulse w-48" />
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-gray-800 rounded-full animate-pulse" />
        <div className="h-8 w-24 bg-gray-800 rounded-full animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-video bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (!movie) return (
    <div className="text-gray-400 text-center py-20">Movie not found.</div>
  );

  const backdrops = movie.images?.backdrops ?? [];
  const posters   = movie.images?.posters ?? [];
  const current   = activeTab === "backdrops" ? backdrops : posters;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={`https://image.tmdb.org/t/p/original${lightbox}`}
            alt="Full size"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 bg-black/50 w-10 h-10 rounded-full flex items-center justify-center"
          >
            ✕
          </button>
          <a
            href={`https://image.tmdb.org/t/p/original${lightbox}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Open Original ↗
          </a>
        </div>
      )}

      {/* Header */}
      <div>
        <BackButton to={`/movie/${id}`} label={`Back to ${movie.title}`} />
        <h1 className="text-white text-2xl font-bold">{movie.title}</h1>
        <p className="text-gray-400 text-sm mt-1">Photos & Gallery</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("backdrops")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition ${
            activeTab === "backdrops"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Backdrops
          <span className="ml-1.5 text-xs opacity-70">{backdrops.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("posters")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition ${
            activeTab === "posters"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Posters
          <span className="ml-1.5 text-xs opacity-70">{posters.length}</span>
        </button>
      </div>

      {/* Grid */}
      {current.length === 0 ? (
        <div className="text-gray-500 text-center py-20">No images available.</div>
      ) : (
        <div className={
          activeTab === "backdrops"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
            : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        }>
          {current.map((img, i) => (
            <button
              key={i}
              onClick={() => setLightbox(img.file_path)}
              className="group relative overflow-hidden rounded-xl bg-gray-900 hover:ring-2 hover:ring-blue-500 transition"
            >
              <img
                src={`https://image.tmdb.org/t/p/${activeTab === "backdrops" ? "w780" : "w342"}${img.file_path}`}
                alt={`${activeTab} ${i + 1}`}
                className={`w-full object-cover group-hover:opacity-80 transition ${
                  activeTab === "backdrops" ? "aspect-video" : "aspect-[2/3]"
                }`}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <div className="bg-black/50 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
