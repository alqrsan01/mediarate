import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { getTVSeason, getTVDetails } from "../api/tv";
import { TVSeasonBasic } from "../types";
import { getEpisodeRatings, saveEpisodeRating, getMyList, saveToList } from "../api/list";
import { TVSeason, TVEpisode, UserMedia } from "../types";
import BackButton from "../components/BackButton";

type EpisodeState = {
  rating: number | null;
  watched: boolean;
};

type RatingsMap = Record<number, EpisodeState>;

function RatingPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap mt-1.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(value === n ? null : n)}
          className={`w-7 h-7 rounded-md text-xs font-bold transition ${
            value === n
              ? "bg-yellow-500 text-black"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function TVSeasonPage() {
  const { id, season } = useParams();
  const navigate = useNavigate();
  const showId   = Number(id);
  const seasonNum = Number(season);

  const [seasonData, setSeasonData] = useState<TVSeason | null>(null);
  const [showName, setShowName]     = useState("");
  const [allSeasons, setAllSeasons] = useState<TVSeasonBasic[]>([]);
  const [loading, setLoading]       = useState(true);

  const [ratings, setRatings]   = useState<RatingsMap>({});
  const [saving, setSaving]     = useState<Record<number, boolean>>({});
  const [expanded, setExpanded] = useState<number | null>(null);

  // Track whether this show is already in user_media
  const listEntryRef = useRef<UserMedia | null>(null);
  // Prevent adding to list multiple times in one session
  const autoAddedRef = useRef(false);

  useScrollRestoration();

  useEffect(() => {
    setLoading(true);
    setExpanded(null);
    autoAddedRef.current = false;
    Promise.all([
      getTVSeason(showId, seasonNum),
      getTVDetails(showId),
      getEpisodeRatings(showId, seasonNum),
      getMyList("tv"),
    ]).then(([seasonRes, showRes, ratingsRes, listRes]) => {
      setSeasonData(seasonRes.data);
      setShowName(showRes.data.name);
      setAllSeasons((showRes.data.seasons ?? []).filter((s: TVSeasonBasic) => s.season_number > 0));
      const fetchedRatings = ratingsRes.data.ratings ?? {};
      setRatings(fetchedRatings);
      const entry = (listRes.data.items as UserMedia[]).find((i) => i.tmdb_id === showId);
      listEntryRef.current = entry ?? null;

      // If the show has episode activity but was never added to user_media, auto-add it now
      if (!entry && Object.keys(fetchedRatings).length > 0) {
        autoAddedRef.current = true;
        saveToList({ tmdb_id: showId, media_type: "tv", status: "watching" }).then(() => {
          listEntryRef.current = { tmdb_id: showId, status: "watching" } as UserMedia;
        });
      }
    }).finally(() => setLoading(false));
  }, [id, season]);

  /**
   * If the show is not in user_media yet, auto-add it as "watching".
   * Called any time the user first marks an episode watched.
   */
  const ensureInList = useCallback(async () => {
    if (listEntryRef.current || autoAddedRef.current) return;
    autoAddedRef.current = true;
    await saveToList({ tmdb_id: showId, media_type: "tv", status: "watching" });
    // Store a dummy entry so we don't add again in this session
    listEntryRef.current = { tmdb_id: showId } as UserMedia;
  }, [showId]);

  const handleWatched = useCallback(async (ep: TVEpisode) => {
    const current = ratings[ep.episode_number] ?? { rating: null, watched: false };
    const next = !current.watched;

    setRatings((prev) => ({
      ...prev,
      [ep.episode_number]: { ...current, watched: next },
    }));

    setSaving((prev) => ({ ...prev, [ep.episode_number]: true }));
    await saveEpisodeRating({
      show_id: showId,
      season_number: seasonNum,
      episode_number: ep.episode_number,
      watched: next,
      rating: current.rating,
    });
    // Auto-add to list when first watched episode is marked
    if (next) await ensureInList();
    setSaving((prev) => ({ ...prev, [ep.episode_number]: false }));
  }, [ratings, showId, seasonNum, ensureInList]);

  const handleRating = useCallback(async (ep: TVEpisode, newRating: number | null) => {
    const current = ratings[ep.episode_number] ?? { rating: null, watched: false };

    setRatings((prev) => ({
      ...prev,
      [ep.episode_number]: { ...current, rating: newRating },
    }));

    setSaving((prev) => ({ ...prev, [ep.episode_number]: true }));
    await saveEpisodeRating({
      show_id: showId,
      season_number: seasonNum,
      episode_number: ep.episode_number,
      watched: current.watched,
      rating: newRating,
    });
    // Also auto-add to list if rating given
    if (newRating !== null) await ensureInList();
    setSaving((prev) => ({ ...prev, [ep.episode_number]: false }));
  }, [ratings, showId, seasonNum, ensureInList]);

  // Summary stats
  const watchedCount = Object.values(ratings).filter((r) => r.watched).length;
  const ratedEps     = Object.values(ratings).filter((r) => r.rating !== null);
  const avgRating    = ratedEps.length > 0
    ? (ratedEps.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratedEps.length).toFixed(1)
    : null;

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="h-6 bg-gray-800 rounded animate-pulse w-32" />
      <div className="h-8 bg-gray-800 rounded animate-pulse w-64" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (!seasonData) return <div className="text-gray-400 text-center py-20">Season not found.</div>;

  const totalEpisodes = seasonData.episodes.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      <BackButton to={`/tv/${id}`} label={`Back to ${showName}`} />

      {/* Season jump navigation */}
      {allSeasons.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-500 text-sm shrink-0">Jump to:</span>
          <div className="flex gap-1.5 flex-wrap">
            {allSeasons.map((s) => (
              <button
                key={s.season_number}
                onClick={() => navigate(`/tv/${id}/season/${s.season_number}`)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  s.season_number === seasonNum
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                S{s.season_number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex gap-6 items-start">
        {seasonData.poster_path && (
          <img
            src={`https://image.tmdb.org/t/p/w185${seasonData.poster_path}`}
            alt={seasonData.name}
            className="w-28 rounded-xl shrink-0"
          />
        )}
        <div className="flex-1">
          <p className="text-gray-400 text-sm mb-1">{showName}</p>
          <h1 className="text-white text-2xl font-bold">{seasonData.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {totalEpisodes} episodes
            {seasonData.air_date && ` · ${seasonData.air_date.slice(0, 4)}`}
          </p>
          {seasonData.overview && (
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">{seasonData.overview}</p>
          )}

          {/* Season progress */}
          {totalEpisodes > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{watchedCount} / {totalEpisodes} watched</span>
                {avgRating && (
                  <span className="text-yellow-400 font-semibold">★ {avgRating} avg</span>
                )}
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${(watchedCount / totalEpisodes) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* List status indicator */}
          {listEntryRef.current && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-400 bg-blue-600/10 px-2.5 py-1 rounded-full">
              <span>📺</span>
              <span className="capitalize">{listEntryRef.current.status ?? "In your list"}</span>
              <span className="text-gray-500">· <a href={`/tv/${showId}`} className="hover:underline">edit on show page</a></span>
            </div>
          )}
        </div>
      </div>

      {/* Mark all watched button */}
      {totalEpisodes > 0 && watchedCount < totalEpisodes && (
        <button
          onClick={async () => {
            const updates = seasonData.episodes.map((ep) => {
              const cur = ratings[ep.episode_number] ?? { rating: null, watched: false };
              return saveEpisodeRating({
                show_id: showId,
                season_number: seasonNum,
                episode_number: ep.episode_number,
                watched: true,
                rating: cur.rating,
              });
            });
            setRatings((prev) => {
              const next = { ...prev };
              seasonData.episodes.forEach((ep) => {
                next[ep.episode_number] = {
                  ...(prev[ep.episode_number] ?? { rating: null }),
                  watched: true,
                };
              });
              return next;
            });
            await Promise.all(updates);
            await ensureInList();
          }}
          className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-xl transition"
        >
          ✓ Mark All as Watched
        </button>
      )}

      {/* Episodes */}
      <div className="space-y-3">
        {seasonData.episodes.map((ep: TVEpisode) => {
          const epState  = ratings[ep.episode_number] ?? { rating: null, watched: false };
          const isOpen   = expanded === ep.episode_number;
          const isSaving = saving[ep.episode_number];

          return (
            <div
              key={ep.id}
              className={`bg-gray-900 rounded-xl overflow-hidden transition ${
                epState.watched ? "ring-1 ring-blue-600/40" : ""
              }`}
            >
              <div className="flex gap-4 p-3">

                {/* Still image */}
                {ep.still_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                    alt={ep.name}
                    className="w-32 h-20 object-cover rounded-lg shrink-0"
                  />
                ) : (
                  <div className="w-32 h-20 bg-gray-800 rounded-lg shrink-0 flex items-center justify-center text-gray-600 text-xs">
                    No Image
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-gray-500 text-xs">Episode {ep.episode_number}</span>
                      <h3 className="text-white font-semibold text-sm">{ep.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ep.vote_average > 0 && (
                        <span className="text-yellow-400 text-xs">★ {ep.vote_average.toFixed(1)}</span>
                      )}
                      {ep.runtime && (
                        <span className="text-gray-500 text-xs">{ep.runtime} min</span>
                      )}
                      {ep.air_date && (
                        <span className="text-gray-500 text-xs hidden sm:inline">{ep.air_date}</span>
                      )}
                    </div>
                  </div>

                  {ep.overview && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{ep.overview}</p>
                  )}

                  {/* Action row */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">

                    {/* Watched toggle */}
                    <button
                      onClick={() => handleWatched(ep)}
                      disabled={isSaving}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                        epState.watched
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
                      }`}
                    >
                      {epState.watched ? "✓ Watched" : "Mark Watched"}
                    </button>

                    {/* Rating button / display */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : ep.episode_number)}
                      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                        epState.rating !== null
                          ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
                      }`}
                    >
                      {epState.rating !== null ? `★ ${epState.rating}/10` : "Rate"}
                    </button>

                    {isSaving && (
                      <span className="text-gray-600 text-xs">saving…</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable rating picker */}
              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-gray-400 text-xs mb-1">Your rating</p>
                  <RatingPicker
                    value={epState.rating}
                    onChange={(n) => handleRating(ep, n)}
                  />
                  {epState.rating !== null && (
                    <button
                      onClick={() => handleRating(ep, null)}
                      className="mt-2 text-xs text-red-400 hover:underline"
                    >
                      Clear rating
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
