import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { getTVDetails } from "../api/tv";
import { saveToList, removeFromList, getMyList } from "../api/list";
import { TVShow, MediaStatus, UserMedia, CastMember } from "../types";
import { MovieDetailSkeleton } from "../components/Skeleton";
import BackButton from "../components/BackButton";

const STATUSES: { value: MediaStatus; label: string }[] = [
  { value: "watched",  label: "Watched" },
  { value: "watching", label: "Watching" },
  { value: "wishlist", label: "Wishlist" },
  { value: "dropped",  label: "Dropped" },
];

const LANGUAGES: Record<string, string> = {
  en: "English", fr: "French", de: "German", ja: "Japanese",
  ko: "Korean", es: "Spanish", it: "Italian", zh: "Chinese",
  ar: "Arabic", pt: "Portuguese", ru: "Russian", hi: "Hindi",
};

function TrailerModal({ videoKey, onClose }: { videoKey: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="w-full max-w-3xl aspect-video rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <iframe
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
          allow="autoplay; fullscreen"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300">✕</button>
    </div>
  );
}

export default function TVDetail() {
  const { id } = useParams();
  const [show, setShow]       = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [entry, setEntry]     = useState<UserMedia | null>(null);
  const [status, setStatus]   = useState<MediaStatus>("wishlist");
  const [rating, setRating]   = useState<number | null>(null);
  const [review, setReview]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showAllCast, setShowAllCast] = useState(false);
  const [region, setRegion]   = useState("US");

  useScrollRestoration();

  useEffect(() => {
    setLoading(true);
    Promise.all([getTVDetails(Number(id)), getMyList("tv")]).then(([tvRes, listRes]) => {
      setShow(tvRes.data);
      const existing = listRes.data.items.find((i: UserMedia) => i.tmdb_id === Number(id));
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
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const avgEpRuntime = show?.episode_run_time?.[0] ?? 30;
    const totalRuntime = (show?.number_of_episodes ?? 0) * avgEpRuntime;
    const seasonCounts = show?.seasons
      ?.filter((s) => s.season_number > 0)
      .map((s) => s.episode_count) ?? [];
    await saveToList({
      tmdb_id: Number(id),
      media_type: "tv",
      status,
      rating,
      review,
      title: show?.name ?? null,
      poster_path: show?.poster_path ?? null,
      runtime: totalRuntime || null,
      season_counts: seasonCounts.length > 0 ? seasonCounts : null,
    });
    setSaved(true);
    setSaving(false);
    if (!entry) setEntry({ status, rating, review } as any);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemove = async () => {
    await removeFromList(Number(id), "tv");
    setEntry(null);
    setStatus("wishlist");
    setRating(null);
    setReview("");
  };

  if (loading) return <MovieDetailSkeleton />;
  if (!show)   return <div className="text-gray-400 text-center py-20">TV Show not found.</div>;

  const creators   = show.created_by ?? [];
  const keywords   = show.keywords?.results ?? [];
  const recommendations = show.recommendations?.results.slice(0, 10) ?? [];
  const ext        = show.external_ids;
  const trailer    = show.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official)
                  ?? show.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer");
  const watchProviders = show["watch/providers"]?.results ?? {};
  const availableRegions = Object.keys(watchProviders).sort();
  const regionData = watchProviders[region];
  const runtime    = show.episode_run_time?.[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {trailerKey && <TrailerModal videoKey={trailerKey} onClose={() => setTrailerKey(null)} />}

      <BackButton />

      {/* Backdrop */}
      {show.backdrop_path && (
        <div className="relative w-full h-56 md:h-80 rounded-2xl overflow-hidden group">
          <img src={`https://image.tmdb.org/t/p/w1280${show.backdrop_path}`} alt={show.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            {trailer && (
              <button
                onClick={() => setTrailerKey(trailer.key)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2 transition"
              >
                <span className="text-lg">▶</span> Watch Trailer
              </button>
            )}
            {show.images && (show.images.backdrops.length > 0 || show.images.posters.length > 0) && (
              <Link
                to={`/tv/${show.id}/photos`}
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
        {show.poster_path && (
          <img src={`https://image.tmdb.org/t/p/w300${show.poster_path}`} alt={show.name} className="w-40 rounded-xl shrink-0 self-start" />
        )}

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-white text-3xl font-bold">{show.name}</h1>
            {show.tagline && <p className="text-gray-500 italic text-sm mt-1">"{show.tagline}"</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-gray-400 text-sm">{show.first_air_date?.slice(0, 4)}</span>
              {runtime && <span className="text-gray-400 text-sm">· {runtime} min/ep</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                show.status === "Returning Series" ? "bg-green-600/20 text-green-400" :
                show.status === "Ended" ? "bg-gray-600/20 text-gray-400" :
                "bg-yellow-600/20 text-yellow-400"
              }`}>
                {show.status}
              </span>
              {show.genres?.map((g) => (
                <Link key={g.id} to={`/tv?genre=${g.id}`} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full transition">
                  {g.name}
                </Link>
              ))}
            </div>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed">{show.overview}</p>

          {/* Created by / Directors */}
          <div className="space-y-2 text-sm">
            {creators.length > 0 && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-20 shrink-0">Created by</span>
                <span className="text-white font-medium">
                  {creators.map((c, i) => (
                    <span key={c.id}>
                      <Link to={`/person/${c.id}`} className="hover:text-blue-400 transition">{c.name}</Link>
                      {i < creators.length - 1 && <span className="text-gray-600">, </span>}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>

          {/* Meta cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: "Language",   value: LANGUAGES[show.original_language] ?? show.original_language?.toUpperCase() },
              { label: "Seasons",    value: `${show.number_of_seasons} season${show.number_of_seasons !== 1 ? "s" : ""}` },
              { label: "Episodes",   value: show.number_of_episodes?.toLocaleString() },
              { label: "TMDB Score", value: show.vote_average ? `${show.vote_average.toFixed(1)} / 10` : "N/A" },
              { label: "Votes",      value: show.vote_count ? show.vote_count.toLocaleString() : "N/A" },
              { label: "Type",       value: show.type || "N/A" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-900 rounded-xl px-4 py-3">
                <p className="text-gray-500 text-xs mb-1">{item.label}</p>
                <p className="text-white font-medium text-xs leading-snug">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Networks */}
          {show.networks && show.networks.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {show.networks.map((n) => (
                <div key={n.id} className="bg-gray-900 rounded-xl px-4 py-2 flex items-center gap-2">
                  {n.logo_path ? (
                    <img src={`https://image.tmdb.org/t/p/w92${n.logo_path}`} alt={n.name} className="h-6 object-contain brightness-0 invert opacity-70" />
                  ) : (
                    <span className="text-gray-400 text-xs font-medium">{n.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Social */}
          {ext && (ext.imdb_id || ext.facebook_id || ext.instagram_id || ext.twitter_id) && (
            <div className="flex gap-3 flex-wrap pt-1">
              {ext.imdb_id && (
                <a href={`https://www.imdb.com/title/${ext.imdb_id}`} target="_blank" rel="noreferrer" className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition">IMDb</a>
              )}
              {ext.facebook_id && (
                <a href={`https://facebook.com/${ext.facebook_id}`} target="_blank" rel="noreferrer" className="bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">Facebook</a>
              )}
              {ext.instagram_id && (
                <a href={`https://instagram.com/${ext.instagram_id}`} target="_blank" rel="noreferrer" className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">Instagram</a>
              )}
              {ext.twitter_id && (
                <a href={`https://twitter.com/${ext.twitter_id}`} target="_blank" rel="noreferrer" className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">X / Twitter</a>
              )}
            </div>
          )}

          {/* Rating Section */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 space-y-3">
            <h3 className="text-white font-semibold">My Rating</h3>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    status === s.value ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1.5">Rating (1–10)</p>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(rating === n ? null : n)}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                      rating === n ? "bg-yellow-500 text-black" : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={2}
              placeholder="Write your thoughts... (optional)"
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition text-sm"
              >
                {saved ? "Saved!" : saving ? "Saving..." : entry ? "Update" : "Save to List"}
              </button>
              {entry && (
                <button onClick={handleRemove} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 font-semibold px-4 py-2 rounded-lg transition text-sm">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seasons */}
      {show.seasons && show.seasons.filter((s) => s.season_number > 0).length > 0 && (
        <div>
          <h2 className="text-white text-xl font-bold mb-4">Seasons</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {show.seasons.filter((s) => s.season_number > 0).map((season) => (
              <Link to={`/tv/${show.id}/season/${season.season_number}`} key={season.id}>
                <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                  {season.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${season.poster_path}`} alt={season.name} className="w-full aspect-[2/3] object-cover" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">No Image</div>
                  )}
                  <div className="p-2">
                    <p className="text-white text-xs font-semibold truncate">{season.name}</p>
                    <p className="text-gray-500 text-xs">{season.episode_count} episodes</p>
                    {season.air_date && <p className="text-gray-600 text-xs">{season.air_date.slice(0, 4)}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Cast */}
      {show.credits?.cast && show.credits.cast.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-bold">
              Cast
              <span className="text-gray-500 text-sm font-normal ml-2">{show.credits.cast.length} members</span>
            </h2>
            <Link to={`/tv/${show.id}/cast`} className="text-blue-400 text-sm hover:underline">Full Cast & Crew →</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {(showAllCast ? show.credits.cast : show.credits.cast.slice(0, 12)).map((member: CastMember) => (
              <Link to={`/person/${member.id}`} key={member.id}>
                <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                  {member.profile_path ? (
                    <img src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} className="w-full aspect-[2/3] object-cover object-top" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-xs">No Photo</div>
                  )}
                  <div className="p-2">
                    <p className="text-white text-xs font-semibold truncate">{member.name}</p>
                    <p className="text-gray-500 text-xs truncate">{member.character}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {(show.credits.cast.length ?? 0) > 12 && (
            <button
              onClick={() => setShowAllCast(!showAllCast)}
              className="mt-4 w-full bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white text-sm font-medium py-3 rounded-xl transition"
            >
              {showAllCast ? "Show Less" : `Show All ${show.credits.cast.length} Cast Members`}
            </button>
          )}
        </div>
      )}

      {/* Watch Providers */}
      {availableRegions.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-white font-semibold text-lg">Where to Watch</h3>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500">
              {availableRegions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {!regionData ? (
            <p className="text-gray-500 text-sm">Not available in {region}. Try another region.</p>
          ) : (
            <div className="space-y-4">
              {regionData.flatrate && regionData.flatrate.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Stream</p>
                  <div className="flex flex-wrap gap-3">
                    {regionData.flatrate.map((p) => (
                      <a key={p.provider_id} href={regionData.link} target="_blank" rel="noreferrer" title={p.provider_name} className="group flex flex-col items-center gap-1">
                        <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-xl group-hover:ring-2 ring-blue-500 transition" />
                        <span className="text-gray-500 text-xs text-center w-12 truncate">{p.provider_name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {regionData.rent && regionData.rent.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Rent</p>
                  <div className="flex flex-wrap gap-3">
                    {regionData.rent.map((p) => (
                      <a key={p.provider_id} href={regionData.link} target="_blank" rel="noreferrer" title={p.provider_name} className="group flex flex-col items-center gap-1">
                        <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-xl group-hover:ring-2 ring-blue-500 transition" />
                        <span className="text-gray-500 text-xs text-center w-12 truncate">{p.provider_name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {regionData.buy && regionData.buy.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Buy</p>
                  <div className="flex flex-wrap gap-3">
                    {regionData.buy.map((p) => (
                      <a key={p.provider_id} href={regionData.link} target="_blank" rel="noreferrer" title={p.provider_name} className="group flex flex-col items-center gap-1">
                        <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-xl group-hover:ring-2 ring-blue-500 transition" />
                        <span className="text-gray-500 text-xs text-center w-12 truncate">{p.provider_name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-gray-600 text-xs">Data provided by JustWatch via TMDB</p>
            </div>
          )}
        </div>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div>
          <h2 className="text-white text-xl font-bold mb-3">Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <Link key={k.id} to={`/tv?keyword=${k.id}`} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-full transition">
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
            If you liked <span className="text-blue-400">{show.name}</span>, you might also like...
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendations.map((rec) => (
              <Link to={`/tv/${rec.id}`} key={rec.id} className="group">
                <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                  {rec.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${rec.poster_path}`} alt={rec.name} className="w-full aspect-[2/3] object-cover" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">No Image</div>
                  )}
                  <div className="p-2">
                    <p className="text-white text-sm font-medium truncate">{rec.name}</p>
                    <p className="text-gray-500 text-xs">{rec.first_air_date?.slice(0, 4)}</p>
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
