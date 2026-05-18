import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { Person } from "../types";
import { getPersonDetails } from "../api/people";
import { PersonDetailSkeleton } from "../components/Skeleton";
import BackButton from "../components/BackButton";

const GENDERS: Record<number, string> = {
  0: "Not specified",
  1: "Female",
  2: "Male",
  3: "Non-binary",
};

function formatDate(date: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PersonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullBio, setShowFullBio] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useScrollRestoration();

  useEffect(() => {
    setLoading(true);
    getPersonDetails(Number(id))
      .then((response) => setPerson(response.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PersonDetailSkeleton />;
  if (!person)
    return (
      <div className="text-gray-400 text-center py-20">Person not found.</div>
    );

  const ext = person.external_ids;

  // Build unified known-for list (movies + TV shows)
  type KnownItem = {
    id: number;
    title: string;
    poster_path: string | null;
    date: string;
    type: "movie" | "tv";
  };

  const isDirector = person.movie_credits.crew.some((c) => c.job === "Director")
    || person.tv_credits?.crew?.some((c) => c.job === "Director");

  const movieItems: KnownItem[] = (
    isDirector
      ? person.movie_credits.crew.filter((c) => c.job === "Director")
      : person.movie_credits.cast
  ).map((c) => ({
    id:          c.id,
    title:       c.title,
    poster_path: c.poster_path,
    date:        c.release_date ?? "",
    type:        "movie",
  }));

  const tvItems: KnownItem[] = (
    isDirector
      ? (person.tv_credits?.crew ?? []).filter((c) => c.job === "Director")
      : (person.tv_credits?.cast ?? [])
  ).map((c) => ({
    id:          c.id,
    title:       c.name,
    poster_path: c.poster_path,
    date:        c.first_air_date ?? "",
    type:        "tv",
  }));

  // Merge, de-duplicate by type+id, sort newest first
  const seen = new Set<string>();
  const knownFor = [...movieItems, ...tvItems]
    .filter((item) => {
      const key = `${item.type}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const movieCount = knownFor.filter((k) => k.type === "movie").length;
  const tvCount    = knownFor.filter((k) => k.type === "tv").length;

  const bioPreview = person.biography?.slice(0, 500);
  const bioLong = person.biography?.length > 500;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <BackButton />
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="shrink-0">
          {person.profile_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
              alt={person.name}
              className="w-44 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-44 h-64 bg-gray-800 rounded-2xl flex items-center justify-center text-gray-600 text-sm">
              No Photo
            </div>
          )}

          {ext && (ext.imdb_id || ext.instagram_id || ext.twitter_id) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {ext.imdb_id && (
                <a
                  href={`https://www.imdb.com/name/${ext.imdb_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  IMDb
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
        </div>

        <div className="flex-1 space-y-5">
          <div>
            <h1 className="text-white text-3xl font-bold">{person.name}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {person.known_for_department}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-900 rounded-xl px-4 py-3">
              <p className="text-gray-500 text-xs mb-1">Gender</p>
              <p className="text-white font-medium">{GENDERS[person.gender]}</p>
            </div>
            <div className="bg-gray-900 rounded-xl px-4 py-3">
              <p className="text-gray-500 text-xs mb-1">Birthday</p>
              <p className="text-white font-medium">
                {formatDate(person.birthday)}
              </p>
            </div>
            {person.deathday && (
              <div className="bg-gray-900 rounded-xl px-4 py-3">
                <p className="text-gray-500 text-xs mb-1">Died</p>
                <p className="text-white font-medium">
                  {formatDate(person.deathday)}
                </p>
              </div>
            )}
            <div className="bg-gray-900 rounded-xl px-4 py-3">
              <p className="text-gray-500 text-xs mb-1">Place of Birth</p>
              <p className="text-white font-medium">
                {person.place_of_birth ?? "N/A"}
              </p>
            </div>
          </div>

          {person.biography ? (
            <div>
              <h2 className="text-white font-semibold mb-2">Biography</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {showFullBio ? person.biography : bioPreview}
                {bioLong && !showFullBio && "..."}
              </p>
              {bioLong && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="text-blue-400 text-sm mt-2 hover:underline"
                >
                  {showFullBio ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No biography available.</p>
          )}
        </div>
      </div>

      {knownFor.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h2 className="text-white text-xl font-bold">Known For</h2>
            {movieCount > 0 && (
              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                🎬 {movieCount} {movieCount === 1 ? "movie" : "movies"}
              </span>
            )}
            {tvCount > 0 && (
              <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">
                📺 {tvCount} {tvCount === 1 ? "show" : "shows"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {(showAll ? knownFor : knownFor.slice(0, 10)).map((item, idx) => (
              <Link
                to={`/${item.type === "movie" ? "movie" : "tv"}/${item.id}`}
                key={`${item.type}-${item.id}-${idx}`}
                className="group"
              >
                <div className={`bg-gray-900 rounded-xl overflow-hidden transition relative ${
                  item.type === "tv"
                    ? "hover:ring-2 hover:ring-purple-500"
                    : "hover:ring-2 hover:ring-blue-500"
                }`}>
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                      alt={item.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">
                      No Image
                    </div>
                  )}
                  {/* type badge */}
                  <div className={`absolute top-1.5 right-1.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                    item.type === "tv"
                      ? "bg-purple-600/80 text-white"
                      : "bg-blue-600/80 text-white"
                  }`}>
                    {item.type === "tv" ? "TV" : "M"}
                  </div>
                  <div className="p-2">
                    <p className="text-white text-xs font-medium truncate">{item.title}</p>
                    <p className="text-gray-500 text-xs">{item.date?.slice(0, 4)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {knownFor.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 w-full bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white text-sm font-medium py-3 rounded-xl transition"
            >
              {showAll ? "Show Less" : `Show All ${knownFor.length} Credits`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
