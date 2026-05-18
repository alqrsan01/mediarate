import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { searchMovies } from "../api/movies";
import { searchTV } from "../api/tv";
import { searchPeople, searchCompany } from "../api/search";

type SuggestionType = "movie" | "tv" | "person" | "company";

type Suggestion = {
  id: number;
  title: string;
  poster_path: string | null;
  year: string;
  type: SuggestionType;
};

const TYPE_LABELS: Record<SuggestionType, string> = {
  movie:   "Movie",
  tv:      "TV",
  person:  "Person",
  company: "Company",
};

const TYPE_COLORS: Record<SuggestionType, string> = {
  movie:   "bg-blue-600/30 text-blue-400",
  tv:      "bg-purple-600/30 text-purple-400",
  person:  "bg-yellow-600/30 text-yellow-400",
  company: "bg-green-600/30 text-green-400",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery]             = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDrop, setShowDrop]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const menuRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSuggestions([]);
      setShowDrop(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [movieRes, tvRes, peopleRes, companyRes] = await Promise.all([
          searchMovies(query),
          searchTV(query),
          searchPeople(query),
          searchCompany(query),
        ]);

        const movies: Suggestion[] = (movieRes.data.results ?? [])
          .slice(0, 3)
          .map((m: any) => ({
            id:          m.id,
            title:       m.title,
            poster_path: m.poster_path,
            year:        m.release_date?.slice(0, 4) ?? "",
            type:        "movie" as const,
          }));

        const tvShows: Suggestion[] = (tvRes.data.results ?? [])
          .slice(0, 3)
          .map((s: any) => ({
            id:          s.id,
            title:       s.name,
            poster_path: s.poster_path,
            year:        s.first_air_date?.slice(0, 4) ?? "",
            type:        "tv" as const,
          }));

        const people: Suggestion[] = (peopleRes.data.results ?? [])
          .slice(0, 2)
          .map((p: any) => ({
            id:          p.id,
            title:       p.name,
            poster_path: p.profile_path,
            year:        p.known_for_department ?? "",
            type:        "person" as const,
          }));

        const companies: Suggestion[] = (companyRes.data.results ?? [])
          .slice(0, 2)
          .map((c: any) => ({
            id:          c.id,
            title:       c.name,
            poster_path: c.logo_path,
            year:        c.origin_country ?? "",
            type:        "company" as const,
          }));

        // Interleave: movie, tv, person, company… up to 7 total
        const merged: Suggestion[] = [];
        const slots = [movies, tvShows, people, companies];
        const maxLen = Math.max(...slots.map((s) => s.length));
        for (let i = 0; i < maxLen && merged.length < 7; i++) {
          for (const slot of slots) {
            if (slot[i] && merged.length < 7) merged.push(slot[i]);
          }
        }

        setSuggestions(merged);
        setShowDrop(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDrop(false);
    const q = query.trim();
    setQuery("");
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSelect = (item: Suggestion) => {
    setShowDrop(false);
    setQuery("");
    if (item.type === "movie")   navigate(`/movie/${item.id}`);
    else if (item.type === "tv") navigate(`/tv/${item.id}`);
    else if (item.type === "person") navigate(`/person/${item.id}`);
    else if (item.type === "company") navigate(`/company/${item.id}`, { state: { name: item.title } });
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="text-white font-bold text-xl shrink-0">
          Media<span className="text-blue-500">Rate</span>
        </Link>

        {/* Search */}
        <div ref={wrapperRef} className="flex-1 max-w-lg relative">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDrop(true)}
              placeholder="Search movies, TV, people, companies…"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {showDrop && (
            <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
              {loading && (
                <div className="text-gray-500 text-sm px-4 py-3">Searching…</div>
              )}

              {!loading && suggestions.length === 0 && (
                <div className="text-gray-500 text-sm px-4 py-3">No results found.</div>
              )}

              {!loading && suggestions.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 transition text-left"
                >
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w45${item.poster_path}`}
                      alt={item.title}
                      className={`shrink-0 rounded object-cover ${
                        item.type === "company"
                          ? "w-12 h-8 object-contain filter invert opacity-80"
                          : "w-8 h-12"
                      }`}
                    />
                  ) : (
                    <div className={`shrink-0 bg-gray-700 rounded flex items-center justify-center ${
                      item.type === "company" ? "w-12 h-8 text-lg" : "w-8 h-12 text-xl"
                    }`}>
                      {item.type === "person" ? "👤" : item.type === "company" ? "🏢" : ""}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <p className="text-gray-500 text-xs">{item.year}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded ${TYPE_COLORS[item.type]}`}>
                    {TYPE_LABELS[item.type]}
                  </span>
                </button>
              ))}

              {!loading && suggestions.length > 0 && (
                <button
                  onClick={handleSubmit as any}
                  className="w-full text-center text-blue-400 text-sm py-2.5 hover:bg-gray-800 border-t border-gray-800 transition"
                >
                  See all results for "{query}"
                </button>
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="ml-auto relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.username[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm hidden sm:block">{user?.username}</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
              <Link to="/profile"  onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-200 hover:bg-gray-700">Profile</Link>
              <Link to="/my-list"  onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-200 hover:bg-gray-700">My List</Link>
              <Link to="/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-200 hover:bg-gray-700">Settings</Link>
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                  navigate("/login");
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
