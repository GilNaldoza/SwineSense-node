import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [nodeId, setNodeId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const nId = await window.electron.getSetting("node_id");
      const loc = await window.electron.getSetting("location_name");
      setNodeId(nId || "NODE_UNKNOWN");
      setLocationName(loc || "Main Library");
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    await window.electron.setSetting("node_id", nodeId);
    await window.electron.setSetting("location_name", locationName);
    onClose();
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Reader Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Node ID
            </label>
            <input
              type="text"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. READER_01"
            />
            <p className="text-xs text-slate-500 mt-1">Unique identifier for this device.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Location Name
            </label>
            <select
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="Main Library">Main Library</option>
              <option value="Graduate Library">Graduate Library</option>
              <option value="Electronic Library">Electronic Library</option>
              <option value="CEA Library">CEA Library</option>
              <option value="CSM Library">CSM Library</option>
              <option value="CITC Library">CITC Library</option>
              <option value="COT Library">COT Library</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Physical location of this reader.</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
