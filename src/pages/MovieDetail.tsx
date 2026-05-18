import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { getMovieDetails } from "../api/movies";
import { saveToList, removeFromList, getMyList } from "../api/list";
import { Movie, MediaStatus, UserMedia, CastMember } from "../types";
import { MovieDetailSkeleton } from "../components/Skeleton";

const STATUSES: { value: MediaStatus; label: string }[] = [
  { value: "watched", label: "Watched" },
  { value: "watching", label: "Watching" },
  { value: "wishlist", label: "Wishlist" },
  { value: "dropped", label: "Dropped" },
];

const LANGUAGES: Record<string, string> = {
  en: "English",
  fr: "French",
  de: "German",
  ja: "Japanese",
  ko: "Korean",
  es: "Spanish",
  it: "Italian",
  zh: "Chinese",
  ar: "Arabic",
  pt: "Portuguese",
  ru: "Russian",
  hi: "Hindi",
};

function formatMoney(n: number) {
  if (!n) return "N/A";
  return "$" + n.toLocaleString();
}

function TrailerModal({
  videoKey,
  onClose,
}: {
  videoKey: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl aspect-video rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
          allow="autoplay; fullscreen"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
      >
        ✕
      </button>
    </div>
  );
}

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<UserMedia | null>(null);
  const [status, setStatus] = useState<MediaStatus>("wishlist");
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showAllCast, setShowAllCast] = useState(false);
  const [region, setRegion] = useState("US");

  useScrollRestoration();

  useEffect(() => {
    setLoading(true);
    Promise.all([getMovieDetails(Number(id)), getMyList("movie")])
      .then(([movieRes, listRes]) => {
        setMovie(movieRes.data);
        const existing = listRes.data.items.find(
          (i: UserMedia) => i.tmdb_id === Number(id),
        );
        if (existing) {
          setEntry(existing);
          setStatus(existing.status);
          setRating(existing.rating);
          setReview(existing.review || "");
        } else {
          setEntry(null);
          setStatus("wishlist");
          setRating(null);
          setReview("");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await saveToList({
      tmdb_id: Number(id),
      media_type: "movie",
      status,
      rating,
      review,
      title: movie?.title ?? null,
      poster_path: movie?.poster_path ?? null,
      runtime: movie?.runtime ?? null,
    });
    setSaved(true);
    setSaving(false);
    if (!entry) setEntry({ status, rating, review } as any);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemove = async () => {
    await removeFromList(Number(id), "movie");
    setEntry(null);
    setStatus("wishlist");
    setRating(null);
    setReview("");
  };

  if (loading) return <MovieDetailSkeleton />;
  if (!movie)
    return (
      <div className="text-gray-400 text-center py-20">Movie not found.</div>
    );

  const director = movie.credits?.crew.find((c) => c.job === "Director");
  const writers =
    movie.credits?.crew.filter((c) =>
      ["Writer", "Screenplay", "Story"].includes(c.job),
    ) ?? [];
  const topCast = movie.credits?.cast.slice(0, 12) ?? [];
  const keywords = movie.keywords?.keywords ?? [];
  const recommendations = movie.recommendations?.results.slice(0, 10) ?? [];
  const ext = movie.external_ids;
  const watchProviders = movie["watch/providers"]?.results ?? {};
  const availableRegions = Object.keys(watchProviders).sort();
  const regionData = watchProviders[region];
  const trailer =
    movie.videos?.results.find(
      (v) => v.site === "YouTube" && v.type === "Trailer" && v.official,
    ) ??
    movie.videos?.results.find(
      (v) => v.site === "YouTube" && v.type === "Trailer",
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <BackButton />
      {trailerKey && (
        <TrailerModal
          videoKey={trailerKey}
          onClose={() => setTrailerKey(null)}
        />
      )}

      {/* Backdrop */}
      {movie.backdrop_path && (
        <div className="relative w-full h-56 md:h-80 rounded-2xl overflow-hidden group">
          <img
            src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            {trailer && (
              <button
                onClick={() => setTrailerKey(trailer.key)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2 transition"
              >
                <span className="text-lg">▶</span> Watch Trailer
              </button>
            )}
            {movie.images && (movie.images.backdrops.length > 0 || movie.images.posters.length > 0) && (
              <Link
                to={`/movie/${movie.id}/photos`}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2 transition"
              >
                🖼 Photos
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8">
        {movie.poster_path && (
          <img
            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
            alt={movie.title}
            className="w-40 rounded-xl shrink-0 self-start"
          />
        )}

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-white text-3xl font-bold">{movie.title}</h1>
            {movie.tagline && (
              <p className="text-gray-500 italic text-sm mt-1">
                "{movie.tagline}"
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-gray-400 text-sm">
                {movie.release_date?.slice(0, 4)}
              </span>
              {movie.runtime && (
                <span className="text-gray-400 text-sm">
                  · {movie.runtime} min
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  movie.status === "Released"
                    ? "bg-green-600/20 text-green-400"
                    : "bg-yellow-600/20 text-yellow-400"
                }`}
              >
                {movie.status}
              </span>
              {movie.genres?.map((g) => (
                <Link
                  key={g.id}
                  to={`/movies?genre=${g.id}`}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full transition"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed">
            {movie.overview}
          </p>

          {/* Director / Writer */}
          <div className="space-y-2 text-sm">
            {director && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-16 shrink-0">Director</span>
                <Link
                  to={`/person/${director.id}`}
                  className="text-white font-medium hover:text-blue-400 transition"
                >
                  {director.name}
                </Link>
              </div>
            )}
            {writers.length > 0 && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-16 shrink-0">Writer</span>
                <span className="text-white font-medium">
                  {writers.map((w, i) => (
                    <span key={w.id}>
                      <Link
                        to={`/person/${w.id}`}
                        className="hover:text-blue-400 transition"
                      >
                        {w.name}
                      </Link>
                      {i < writers.length - 1 && (
                        <span className="text-gray-600">, </span>
                      )}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>

          {/* Meta cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              {
                label: "Language",
                value:
                  LANGUAGES[movie.original_language] ??
                  movie.original_language?.toUpperCase(),
              },
              { label: "Budget", value: formatMoney(movie.budget) },
              { label: "Revenue", value: formatMoney(movie.revenue) },
              {
                label: "TMDB Score",
                value: movie.vote_average
                  ? `${movie.vote_average.toFixed(1)} / 10`
                  : "N/A",
              },
              {
                label: "Votes",
                value: movie.vote_count
                  ? movie.vote_count.toLocaleString()
                  : "N/A",
              },
              {
                label: "Countries",
                value:
                  movie.production_countries?.map((c) => c.name).join(", ") ||
                  "N/A",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-900 rounded-xl px-4 py-3"
              >
                <p className="text-gray-500 text-xs mb-1">{item.label}</p>
                <p className="text-white font-medium text-xs leading-snug">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Social */}
          {ext &&
            (ext.imdb_id ||
              ext.facebook_id ||
              ext.instagram_id ||
              ext.twitter_id) && (
              <div className="flex gap-3 flex-wrap pt-1">
                {ext.imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${ext.imdb_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    IMDb
                  </a>
                )}
                {ext.facebook_id && (
                  <a
                    href={`https://facebook.com/${ext.facebook_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    Facebook
                  </a>
                )}
                {ext.instagram_id && (
                  <a
                    href={`https://instagram.com/${ext.instagram_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    Instagram
                  </a>
                )}
                {ext.twitter_id && (
                  <a
                    href={`https://twitter.com/${ext.twitter_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    X / Twitter
                  </a>
                )}
              </div>
            )}

          {/* ── Add to List (inline, top of page) ── */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 space-y-3">
            <h3 className="text-white font-semibold">My Rating</h3>

            {/* Status */}
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    status === s.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Rating */}
            <div>
              <p className="text-gray-400 text-xs mb-1.5">Rating (1–10)</p>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(rating === n ? null : n)}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                      rating === n
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Review */}
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={2}
              placeholder="Write your thoughts... (optional)"
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-500"
            />

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition text-sm"
              >
                {saved ? "Saved!" : saving ? "Saving..." : entry ? "Update" : "Save to List"}
              </button>
              {entry && (
                <button
                  onClick={handleRemove}
                  className="bg-red-600/20 hover:bg-red-600/40 text-red-400 font-semibold px-4 py-2 rounded-lg transition text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Watch Providers */}
      {availableRegions.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-white font-semibold text-lg">Where to Watch</h3>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {!regionData ? (
            <p className="text-gray-500 text-sm">
              Not available in {region}. Try another region.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Streaming */}
              {regionData.flatrate && regionData.flatrate.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">
                    Stream
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {regionData.flatrate.map((p) => (
                      <a
                        key={p.provider_id}
                        href={regionData.link}
                        target="_blank"
                        rel="noreferrer"
                        title={p.provider_name}
                        className="group flex flex-col items-center gap-1"
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-10 h-10 rounded-xl group-hover:ring-2 ring-blue-500 transition"
                        />
                        <span className="text-gray-500 text-xs text-center w-12 truncate">
                          {p.provider_name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Rent */}
              {regionData.rent && regionData.rent.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">
                    Rent
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {regionData.rent.map((p) => (
                      <a
                        key={p.provider_id}
                        href={regionData.link}
                        target="_blank"
                        rel="noreferrer"
                        title={p.provider_name}
                        className="group flex flex-col items-center gap-1"
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-10 h-10 rounded-xl group-hover:ring-2 ring-blue-500 transition"
                        />
                        <span className="text-gray-500 text-xs text-center w-12 truncate">
                          {p.provider_name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Buy */}
              {regionData.buy && regionData.buy.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">
                    Buy
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {regionData.buy.map((p) => (
                      <a
                        key={p.provider_id}
                        href={regionData.link}
                        target="_blank"
                        rel="noreferrer"
                        title={p.provider_name}
                        className="group flex flex-col items-center gap-1"
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-10 h-10 rounded-xl group-hover:ring-2 ring-blue-500 transition"
                        />
                        <span className="text-gray-500 text-xs text-center w-12 truncate">
                          {p.provider_name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-gray-600 text-xs">
                Data provided by JustWatch via TMDB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Collection */}
      {movie.belongs_to_collection && (
        <Link to={`/collection/${movie.belongs_to_collection.id}`}>
          <div
            className="relative rounded-2xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
            style={{ background: "linear-gradient(135deg, #1e3a5f, #0f172a)" }}
          >
            {movie.belongs_to_collection.backdrop_path && (
              <img
                src={`https://image.tmdb.org/t/p/w780${movie.belongs_to_collection.backdrop_path}`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            )}
            <div className="relative flex items-center gap-5 px-6 py-5">
              {movie.belongs_to_collection.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w92${movie.belongs_to_collection.poster_path}`}
                  alt={movie.belongs_to_collection.name}
                  className="w-14 rounded-lg shrink-0"
                />
              )}
              <div>
                <p className="text-gray-400 text-xs mb-1">Part of</p>
                <p className="text-white font-bold text-lg">
                  {movie.belongs_to_collection.name}
                </p>
                <p className="text-blue-400 text-xs mt-1">View collection →</p>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Top Billed Cast */}
      {topCast.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-bold">
              Cast
              <span className="text-gray-500 text-sm font-normal ml-2">
                {movie.credits?.cast.length} members
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {(showAllCast
              ? (movie.credits?.cast ?? [])
              : (movie.credits?.cast.slice(0, 12) ?? [])
            ).map((member: CastMember) => (
              <Link to={`/person/${member.id}`} key={member.id}>
                <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                  {member.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                      alt={member.name}
                      className="w-full aspect-[2/3] object-cover object-top"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-xs">
                      No Photo
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-white text-xs font-semibold truncate">
                      {member.name}
                    </p>
                    <p className="text-gray-500 text-xs truncate">
                      {member.character}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {(movie.credits?.cast.length ?? 0) > 12 && (
            <button
              onClick={() => setShowAllCast(!showAllCast)}
              className="mt-4 w-full bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white text-sm font-medium py-3 rounded-xl transition"
            >
              {showAllCast
                ? "Show Less"
                : `Show All ${movie.credits?.cast.length} Cast Members`}
            </button>
          )}
        </div>
      )}

      {/* Production Companies */}
      {movie.production_companies && movie.production_companies.length > 0 && (
        <div>
          <h2 className="text-white text-xl font-bold mb-4">
            Production Companies
          </h2>
          <div className="flex flex-wrap gap-4">
            {movie.production_companies.map((company) => (
              <div
                key={company.id}
                className="bg-gray-900 rounded-xl px-5 py-4 flex items-center gap-3"
              >
                {company.logo_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${company.logo_path}`}
                    alt={company.name}
                    className="h-8 object-contain brightness-0 invert opacity-70"
                  />
                ) : (
                  <span className="text-gray-400 text-sm font-medium">
                    {company.name}
                  </span>
                )}
                {company.logo_path && (
                  <span className="text-gray-500 text-xs">{company.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div>
          <h2 className="text-white text-xl font-bold mb-3">Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <Link
                key={k.id}
                to={`/movies?keyword=${k.id}`}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-full transition"
              >
                {k.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h2 className="text-white text-xl font-bold mb-4">
            If you liked <span className="text-blue-400">{movie.title}</span>,
            you might also like...
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendations.map((rec) => (
              <Link to={`/movie/${rec.id}`} key={rec.id} className="group">
                <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                  {rec.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${rec.poster_path}`}
                      alt={rec.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">
                      No Image
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-white text-sm font-medium truncate">
                      {rec.title}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {rec.release_date?.slice(0, 4)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
