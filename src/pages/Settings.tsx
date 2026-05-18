import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updatePassword, updateAvatar } from "../api/auth";
import BackButton from "../components/BackButton";

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password state
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleAvatarSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvatarSaving(true);
    setAvatarMsg(null);
    try {
      const res = await updateAvatar(avatarUrl);
      setUser(res.data.user);
      setAvatarMsg({ type: "success", text: "Avatar updated successfully" });
    } catch (err: any) {
      setAvatarMsg({
        type: "error",
        text: err.response?.data?.error ?? "Something went wrong",
      });
    } finally {
      setAvatarSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (newPass !== confirm) {
      setPassMsg({ type: "error", text: "New passwords do not match" });
      return;
    }

    setPassSaving(true);
    try {
      await updatePassword(current, newPass);
      setPassMsg({ type: "success", text: "Password updated successfully" });
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch (err: any) {
      setPassMsg({
        type: "error",
        text: err.response?.data?.error ?? "Something went wrong",
      });
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      <BackButton />
      <h1 className="text-white text-2xl font-bold">Settings</h1>

      {/* Avatar */}
      <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold text-lg">Avatar</h2>

        {/* Preview */}
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-700"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {user?.username[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-medium">{user?.username}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleAvatarSave} className="space-y-4">
          {avatarMsg && (
            <div
              className={`text-sm px-4 py-3 rounded-lg ${
                avatarMsg.type === "success"
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              {avatarMsg.text}
            </div>
          )}

          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/your-photo.jpg"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={avatarSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition text-sm"
          >
            {avatarSaving ? "Saving..." : "Save Avatar"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold text-lg">Change Password</h2>

        <form onSubmit={handlePasswordSave} className="space-y-4">
          {passMsg && (
            <div
              className={`text-sm px-4 py-3 rounded-lg ${
                passMsg.type === "success"
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              {passMsg.text}
            </div>
          )}

          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">
              Current Password
            </label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">
              New Password
            </label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={passSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition text-sm"
          >
            {passSaving ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
