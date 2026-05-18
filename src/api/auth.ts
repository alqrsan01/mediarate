import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost/mediarate-api",
  withCredentials: true,
});

export const register = (username: string, email: string, password: string) =>
  api.post("/auth/register.php", { username, email, password });

export const login = (email: string, password: string) =>
  api.post("/auth/login.php", { email, password });

export const logout = () => api.post("/auth/logout.php");

export const getMe = () => api.get("/auth/me.php");

export const updatePassword = (current_password: string, new_password: string) =>
  api.post('/user/update_password.php', { current_password, new_password })

export const updateAvatar = (avatar_url: string) =>
  api.post('/user/update_avatar.php', { avatar_url })

export default api;