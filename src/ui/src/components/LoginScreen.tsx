import { useState } from "react";
import {
  Lock,
  Server,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  User,
} from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await window.electron.login({ username, password });
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main login card */}
      <div className="relative bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 animate-in fade-in zoom-in-95 duration-700">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-t-3xl"></div>

        {/* Logo and header */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            {/* Glowing effect */}
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
            <div className="absolute inset-0 bg-blue-300 rounded-full blur-xl opacity-30"></div>
            {/* Icon container */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <Lock size={40} strokeWidth={2} className="drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 tracking-tight">
            Node Login
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            Authenticate this reader node
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <User size={16} className="text-blue-600" />
              Node ID / Username
            </label>
            <div className="relative group">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                className="w-full p-4 pl-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 bg-white/80 hover:bg-white hover:border-blue-300 focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                placeholder="e.g. READER_01"
                required
                disabled={loading}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <User size={18} />
              </div>
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Lock size={16} className="text-blue-600" />
              Password
            </label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full p-4 pl-12 pr-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 bg-white/80 hover:bg-white hover:border-blue-300 focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors duration-200 p-1 rounded-lg hover:bg-blue-50"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50/90 backdrop-blur-sm border-2 border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 shadow-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-600" />
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span className="relative z-10">Login</span>
                <ArrowRight
                  size={18}
                  className="relative z-10 transition-transform duration-300 group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-10 pt-6 border-t border-slate-200/50 text-center">
          <div className="flex items-center justify-center gap-2.5 text-xs text-slate-600">
            <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <Server size={14} className="text-blue-600" />
            </div>
            <span className="font-medium">
              Connects to Central LENS Server via gRPC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
