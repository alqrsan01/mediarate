import api from "./auth";

export const searchUsers = (q: string) =>
  api.get("/social/search_users.php", { params: { q } });

export const getProfile = (username: string) =>
  api.get("/social/profile.php", { params: { username } });

export const followUser = (user_id: number) =>
  api.post("/social/follow.php", { user_id });

export const unfollowUser = (user_id: number) =>
  api.post("/social/unfollow.php", { user_id });

export const getFollowers = (user_id?: number) =>
  api.get("/social/followers.php", { params: user_id ? { user_id } : {} });

export const getFollowing = (user_id?: number) =>
  api.get("/social/following.php", { params: user_id ? { user_id } : {} });

export const getFeed = () =>
  api.get("/social/feed.php");
