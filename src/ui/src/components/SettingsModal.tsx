import { useState, useEffect } from "react";
import {
  X,
  Save,
  Settings as SettingsIcon,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [nodeId, setNodeId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [serverAddress, setServerAddress] = useState("localhost:50060");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const nId = await window.electron.getSetting("node_id");
      const loc = await window.electron.getSetting("location_name");
      const grpc = await window.electron.getSetting("grpc_server_address");
      setNodeId(nId || "NODE_UNKNOWN");
      setLocationName(loc || "Farrowing Pen");
      setServerAddress(grpc || "localhost:50060");
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await window.electron.setSetting("node_id", nodeId);
      await window.electron.setSetting("location_name", locationName);
      await window.electron.setSetting("grpc_server_address", serverAddress);
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 border border-slate-200/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <SettingsIcon size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Reader Settings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure node preferences
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Node ID
            </label>
            <input
              type="text"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50 hover:bg-white focus:bg-white"
              placeholder="e.g. READER_01"
              disabled={saving}
            />
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <span>•</span> Unique identifier for this device
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Location Name
            </label>
            <select
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50 hover:bg-white focus:bg-white cursor-pointer"
              disabled={saving}
            >
              <option value="Farrowing Pen">Farrowing Pen</option>
              <option value="Barn A">Barn A</option>
              <option value="Barn B">Barn B</option>
              <option value="Quarantine">Quarantine</option>
              <option value="Weaning Facility">Weaning Facility</option>
              <option value="Finishing Facility">Finishing Facility</option>
              <option value="Gestation Barn">Gestation Barn</option>
            </select>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <span>•</span> Physical location of this reader
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              gRPC Server Address
            </label>
            <input
              type="text"
              value={serverAddress}
              onChange={(e) => setServerAddress(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50 hover:bg-white focus:bg-white"
              placeholder="localhost:50060"
              disabled={saving}
            />
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <span>•</span> Address used to connect to the backend sync service
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
