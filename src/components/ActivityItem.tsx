import { Link } from "react-router-dom";

interface Activity {
  id: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  type: string;
  media_type: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  rating: number | null;
  created_at: string;
}

const actionLabel = (type: string) => {
  switch (type) {
    case "watched":  return "watched";
    case "watching": return "is watching";
    case "wishlist": return "added to wishlist";
    case "dropped":  return "dropped";
    case "rated":    return "rated";
    default:         return type;
  }
};

export default function ActivityItem({ item }: { item: Activity }) {
  const detailPath = `/${item.media_type === "tv" ? "tv" : "movie"}/${item.tmdb_id}`;
  const initials = item.username?.slice(0, 2).toUpperCase();

  return (
    <div className="flex gap-3 items-start py-3 border-b border-white/10">
      <Link to={`/user/${item.username}`} className="shrink-0">
        {item.avatar_url ? (
          <img src={item.avatar_url} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90">
          <Link to={`/user/${item.username}`} className="font-semibold hover:underline">
            {item.username}
          </Link>{" "}
          <span className="text-white/60">{actionLabel(item.type)}</span>{" "}
          <Link to={detailPath} className="font-medium hover:underline">
            {item.title}
          </Link>
          {item.rating && (
            <span className="ml-1 text-yellow-400">· {item.rating}/10</span>
          )}
        </p>
        <p className="text-xs text-white/40 mt-0.5">
          {new Date(item.created_at).toLocaleDateString()}
        </p>
      </div>

      {item.poster_path && (
        <Link to={detailPath} className="shrink-0">
          <img
            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
            className="w-10 h-14 object-cover rounded"
          />
        </Link>
      )}
    </div>
  );
}
