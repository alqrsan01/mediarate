import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { Movie, TVShow } from "../types";
import { searchMovies } from "../api/movies";
import { searchTV } from "../api/tv";
import { searchPeople, searchCompany, searchKeyword } from "../api/search";
import { SearchSkeleton } from "../components/Skeleton";

type Tab = "all" | "movies" | "tv" | "people" | "companies" | "keywords";

type MediaResult =
  | { type: "movie"; data: Movie }
  | { type: "tv";    data: TVShow };

interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: { title?: string; name?: string }[];
}

interface Company {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

interface Keyword {
  id: number;
  name: string;
}

export default function Search() {
  useScrollRestoration();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [tab, setTab]               = useState<Tab>("all");
  const [loading, setLoading]       = useState(false);

  const [mediaResults, setMediaResults]     = useState<MediaResult[]>([]);
  const [people, setPeople]                 = useState<Person[]>([]);
  const [companies, setCompanies]           = useState<Company[]>([]);
  const [keywords, setKeywords]             = useState<Keyword[]>([]);

  useEffect(() => {
    if (!query) return;
    setTab("all");
    setLoading(true);

    Promise.all([
      searchMovies(query),
      searchTV(query),
      searchPeople(query),
      searchCompany(query),
      searchKeyword(query),
    ])
      .then(([movieRes, tvRes, peopleRes, companyRes, keywordRes]) => {
        const movies: MediaResult[] = (movieRes.data.results ?? []).map((m: Movie) => ({
          type: "movie" as const,
          data: m,
        }));
        const shows: MediaResult[] = (tvRes.data.results ?? []).map((s: TVShow) => ({
          type: "tv" as const,
          data: s,
        }));
        const merged: MediaResult[] = [];
        const max = Math.max(movies.length, shows.length);
        for (let i = 0; i < max; i++) {
          if (movies[i]) merged.push(movies[i]);
          if (shows[i])  merged.push(shows[i]);
        }
        setMediaResults(merged);
        setPeople(peopleRes.data.results ?? []);
        setCompanies(companyRes.data.results ?? []);
        setKeywords(keywordRes.data.results ?? []);
      })
      .catch(() => {
        setMediaResults([]);
        setPeople([]);
        setCompanies([]);
        setKeywords([]);
      })
      .finally(() => setLoading(false));
  }, [query]);

  const movieResults = mediaResults.filter((r) => r.type === "movie");
  const tvResults    = mediaResults.filter((r) => r.type === "tv");

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: "all",      label: "All",       count: mediaResults.length + people.length + companies.length + keywords.length },
    { value: "movies",   label: "Movies",    count: movieResults.length },
    { value: "tv",       label: "TV Shows",  count: tvResults.length },
    { value: "people",   label: "People",    count: people.length },
    { value: "companies",label: "Companies", count: companies.length },
    { value: "keywords", label: "Keywords",  count: keywords.length },
  ];

  const showMedia    = tab === "all" || tab === "movies" || tab === "tv";
  const showPeople   = tab === "all" || tab === "people";
  const showCompanies= tab === "all" || tab === "companies";
  const showKeywords = tab === "all" || tab === "keywords";

  const visibleMedia =
    tab === "movies" ? movieResults :
    tab === "tv"     ? tvResults :
    mediaResults;

  const totalResults = tabs[0].count;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-white text-xl font-semibold mb-4">
        Results for <span className="text-blue-400">"{query}"</span>
      </h2>

      {/* Tabs */}
      {!loading && totalResults > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                tab === t.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-70">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {loading && <SearchSkeleton />}

      {!loading && totalResults === 0 && query && (
        <div className="text-gray-500 text-center py-20">No results found.</div>
      )}

      {/* ── Movies + TV grid ── */}
      {!loading && showMedia && visibleMedia.length > 0 && (
        <section className="mb-10">
          {(tab === "all") && (
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">
              Movies &amp; TV Shows
            </h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visibleMedia.map((result) => {
              if (result.type === "movie") {
                const m = result.data;
                return (
                  <Link to={`/movie/${m.id}`} key={`movie-${m.id}`}>
                    <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition relative">
                      {m.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                          alt={m.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">No image</div>
                      )}
                      <div className="absolute top-1 right-1 bg-blue-600/80 text-white text-xs font-semibold px-1.5 py-0.5 rounded">Movie</div>
                      <div className="p-2">
                        <p className="text-white text-sm font-medium truncate">{m.title}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-gray-500 text-xs">{m.release_date?.slice(0, 4)}</p>
                          {m.vote_average > 0 && <span className="text-yellow-400 text-xs font-medium">★ {m.vote_average.toFixed(1)}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              } else {
                const s = result.data;
                return (
                  <Link to={`/tv/${s.id}`} key={`tv-${s.id}`}>
                    <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition relative">
                      {s.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${s.poster_path}`}
                          alt={s.name}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-sm">No image</div>
                      )}
                      <div className="absolute top-1 right-1 bg-purple-600/80 text-white text-xs font-semibold px-1.5 py-0.5 rounded">TV</div>
                      <div className="p-2">
                        <p className="text-white text-sm font-medium truncate">{s.name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-gray-500 text-xs">{s.first_air_date?.slice(0, 4)}</p>
                          {s.vote_average > 0 && <span className="text-yellow-400 text-xs font-medium">★ {s.vote_average.toFixed(1)}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }
            })}
          </div>
        </section>
      )}

      {/* ── People ── */}
      {!loading && showPeople && people.length > 0 && (
        <section className="mb-10">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">People</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {people.map((person) => (
              <Link to={`/person/${person.id}`} key={`person-${person.id}`}>
                <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-yellow-500 transition">
                  {person.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
                      alt={person.name}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center">
                      <span className="text-4xl">👤</span>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-white text-sm font-medium truncate">{person.name}</p>
                    <p className="text-gray-500 text-xs truncate">{person.known_for_department}</p>
                    {person.known_for?.length > 0 && (
                      <p className="text-gray-600 text-xs truncate mt-0.5">
                        {person.known_for.slice(0, 2).map(k => k.title || k.name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Companies ── */}
      {!loading && showCompanies && companies.length > 0 && (
        <section className="mb-10">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">Production Companies</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {companies.map((company) => (
              <button
                key={`company-${company.id}`}
                onClick={() => navigate(`/company/${company.id}`, { state: { name: company.name } })}
                className="text-left"
              >
                <div className="bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-3 hover:ring-2 hover:ring-green-500 transition min-h-[120px] justify-center">
                  {company.logo_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                      alt={company.name}
                      className="max-h-12 object-contain filter invert opacity-90"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">🏢</div>
                  )}
                  <div className="text-center">
                    <p className="text-white text-sm font-medium">{company.name}</p>
                    {company.origin_country && (
                      <p className="text-gray-500 text-xs">{company.origin_country}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Keywords ── */}
      {!loading && showKeywords && keywords.length > 0 && (
        <section className="mb-10">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <button
                key={`kw-${kw.id}`}
                onClick={() => navigate(`/keyword/${kw.id}`, { state: { name: kw.name } })}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full text-sm transition"
              >
                # {kw.name}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
