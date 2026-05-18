import { useEffect, useState } from "react";
import { getFeed } from "../api/social";
import ActivityItem from "../components/ActivityItem";
import { Link } from "react-router-dom";

export default function Feed() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeed()
      .then(res => setFeed(res.data.feed))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Activity Feed</h1>
        <Link to="/users" className="text-sm text-blue-400 hover:underline">
          Find people
        </Link>
      </div>

      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!loading && feed.length === 0 && (
        <div className="text-center py-16 text-white/40">
          <p className="text-lg mb-2">Nothing here yet</p>
          <p className="text-sm">
            Follow people to see their activity.{" "}
            <Link to="/users" className="text-blue-400 hover:underline">
              Find people to follow
            </Link>
          </p>
        </div>
      )}

      {feed.map(item => (
        <ActivityItem key={item.id} item={item} />
      ))}
    </div>
  );
}
