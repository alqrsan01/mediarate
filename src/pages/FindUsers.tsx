import { useState } from "react";
import { searchUsers } from "../api/social";
import FollowButton from "../components/FollowButton";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";

export default function FindUsers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await searchUsers(q);
      setResults(res.data.users);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <BackButton />
      <h1 className="text-2xl font-bold mt-4 mb-6">Find People</h1>

      <input
        type="text"
        value={query}
        onChange={e => search(e.target.value)}
        placeholder="Search by username..."
        className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-500 mb-6"
      />

      {loading && <p className="text-white/40 text-sm">Searching...</p>}

      <div className="space-y-3">
        {results.map(user => (
          <div key={user.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <Link to={`/user/${user.username}`} className="shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
              )}
            </Link>
            <Link to={`/user/${user.username}`} className="flex-1 font-medium hover:underline">
              {user.username}
            </Link>
            <FollowButton userId={user.id} initialIsFollowing={!!user.is_following} />
          </div>
        ))}

        {!loading && query && results.length === 0 && (
          <p className="text-white/40 text-sm text-center py-8">No users found.</p>
        )}
      </div>
    </div>
  );
}
