import { useState } from "react";
import { followUser, unfollowUser } from "../api/social";

interface Props {
  userId: number;
  initialIsFollowing: boolean;
  onToggle?: (isFollowing: boolean) => void;
}

export default function FollowButton({ userId, initialIsFollowing, onToggle }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        onToggle?.(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
        onToggle?.(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        isFollowing
          ? "bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {loading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
