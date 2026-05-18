import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProfile } from "../api/social";
import FollowButton from "../components/FollowButton";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/BackButton";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"watched" | "wishlist">("watched");

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getProfile(username)
      .then(res => setProfile(res.data.profile))
      .catch(() => setError("User not found"))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">Loading...</div>;
  if (error) return <div className="max-w-2xl mx-auto px-4 py-8 text-red-400">{error}</div>;
  if (!profile) return null;

  const isMe = me?.id === profile.id;
  const filtered = profile.media.filter((m: any) => m.status === tab);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackButton />

      <div className="flex items-center gap-4 mt-4 mb-8">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
            {profile.username.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold">{profile.username}</h1>
          <div className="flex gap-4 text-sm text-white/50 mt-1">
            <span><strong className="text-white">{profile.followers_count}</strong> followers</span>
            <span><strong className="text-white">{profile.following_count}</strong> following</span>
            <span><strong className="text-white">{profile.media.length}</strong> titles</span>
          </div>
        </div>
        {!isMe && (
          <FollowButton userId={profile.id} initialIsFollowing={profile.is_following} />
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(["watched", "wishlist"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-blue-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {t} ({profile.media.filter((m: any) => m.status === t).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-white/40 text-sm py-8 text-center">Nothing here yet.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {filtered.map((item: any) => (
            <a key={item.id} href={`/${item.media_type}/${item.tmdb_id}`} className="group">
              {item.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                  className="w-full rounded-lg group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-white/10 rounded-lg flex items-center justify-center text-xs text-white/40">
                  No image
                </div>
              )}
              {item.rating && (
                <p className="text-xs text-yellow-400 mt-1">{item.rating}/10</p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
