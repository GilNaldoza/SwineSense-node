import { useState, useEffect, useRef, useCallback } from "react";
import { StatusDisplay } from "./components/StatusDisplay";
import { LoginScreen } from "./components/LoginScreen";
import { SettingsModal } from "./components/SettingsModal";
import { Settings, PiggyBank, Edit, RotateCcw } from "lucide-react";

// --- Types ---
declare global {
  interface Window {
    electron: {
      getPig: (uid: string) => Promise<Pig | null>;
      savePig: (pig: Pig) => Promise<void>;
      login: (creds: {
        username: string;
        password: string;
      }) => Promise<{
        success: boolean;
        error?: string;
        loggedInUser?: string;
      }>;
      checkAuth: () => Promise<{
        authenticated: boolean;
        nodeId: string;
        loggedInUser: string;
      }>;
      sync: () => Promise<{ success: boolean; error?: string }>;
      logout: () => Promise<{ success: boolean; error?: string }>;
      logPigScan: (scan: {
        rfidTag: string;
        timestamp: string;
        notes?: string;
      }) => Promise<{ success: boolean; error?: string }>;
      getSetting: (key: string) => Promise<string | null>;
      setSetting: (key: string, value: string) => Promise<{ success: boolean }>;
    };
  }
}

interface Pig {
  pig_id?: number;
  rfid_tag: string;
  pig_number: string;
  pig_type: "piglet" | "sow" | "boar" | "gilt";
  sire?: string;
  dam?: string;
  pen: string;
  health_status: "healthy" | "at-risk" | "sick";
  weight?: number;
  date_of_birth: string;
  notes?: string;
  last_scanned?: string;
}

interface PigFormData {
  pigNumber: string;
  pigType: "piglet" | "sow" | "boar" | "gilt";
  sire: string;
  dam: string;
  pen: string;
  healthStatus: "healthy" | "at-risk" | "sick";
  weight: string;
  dateOfBirth: string;
  notes: string;
}

function PigRegistrationForm({
  uid,
  initialData,
  onSave,
  onCancel,
}: {
  uid: string;
  initialData?: Pig;
  onSave: (data: PigFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PigFormData>({
    pigNumber: initialData?.pig_number || "",
    pigType: initialData?.pig_type || "piglet",
    sire: initialData?.sire || "",
    dam: initialData?.dam || "",
    pen: initialData?.pen || "",
    healthStatus: initialData?.health_status || "healthy",
    weight: initialData?.weight?.toString() || "",
    dateOfBirth: initialData?.date_of_birth?.split("T")[0] || "",
    notes: initialData?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-pink-100">
          <PiggyBank size={24} className="text-pink-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? "Edit Pig" : "Register New Pig"}
          </h2>
          <p className="text-sm text-slate-500 font-mono">{uid}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Pig Number *</label>
            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.pigNumber} onChange={(e) => setForm({ ...form, pigNumber: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Type *</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.pigType} onChange={(e) => setForm({ ...form, pigType: e.target.value as Pig["pig_type"] })}>
              <option value="piglet">Piglet</option>
              <option value="gilt">Gilt</option>
              <option value="sow">Sow</option>
              <option value="boar">Boar</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Pen *</label>
            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.pen} onChange={(e) => setForm({ ...form, pen: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Health Status</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.healthStatus} onChange={(e) => setForm({ ...form, healthStatus: e.target.value as Pig["health_status"] })}>
              <option value="healthy">Healthy</option>
              <option value="at-risk">At Risk</option>
              <option value="sick">Sick</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Weight (kg)</label>
            <input type="number" step="0.1" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Date of Birth *</label>
            <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Sire (Father)</label>
            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.sire} onChange={(e) => setForm({ ...form, sire: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Dam (Mother)</label>
            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.dam} onChange={(e) => setForm({ ...form, dam: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Notes</label>
          <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all">
            {initialData ? "Save Changes" : "Register Pig"}
          </button>
          <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "complete">("idle");
  const [currentPig, setCurrentPig] = useState<Pig | null>(null);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string>("");

  const refreshAuth = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !window.electron || !window.electron.checkAuth) {
        setIsAuthenticated(false);
        setLoggedInUser("");
        return;
      }
      const res = await window.electron.checkAuth();
      setIsAuthenticated(res.authenticated);
      setLoggedInUser(res.loggedInUser || "");
    } catch (err) {
      console.error("Failed to refresh auth state:", err);
      setIsAuthenticated(false);
      setLoggedInUser("");
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const recordPigScan = useCallback(async (pig: Pig) => {
    if (!pig.rfid_tag) return;
    try {
      if (!window?.electron?.logPigScan) return;
      await window.electron.logPigScan({
        rfidTag: pig.rfid_tag,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to log pig scan:", err);
    }
  }, []);

  const handleReset = useCallback(() => {
    setCurrentPig(null);
    setScannedUid(null);
    setIsEditing(false);
    setStatus("idle");
  }, []);

  const handleLogout = async () => {
    if (window?.electron?.logout) {
      await window.electron.logout();
    }
    setIsAuthenticated(false);
    setLoggedInUser("");
  };

  const handleSavePig = async (formData: PigFormData) => {
    const pigToSave: Pig = {
      rfid_tag: scannedUid || "",
      pig_number: formData.pigNumber,
      pig_type: formData.pigType,
      sire: formData.sire || undefined,
      dam: formData.dam || undefined,
      pen: formData.pen,
      health_status: formData.healthStatus,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      date_of_birth: formData.dateOfBirth,
      notes: formData.notes || undefined,
    };

    try {
      if (scannedUid) {
        await window.electron.savePig(pigToSave);
        const savedPig = await window.electron.getPig(scannedUid);
        if (savedPig) {
          setCurrentPig(savedPig);
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error("Error saving pig:", err);
    }
  };

  const processScan = useCallback(
    async (uid: string) => {
      setScannedUid(uid);

      try {
        console.log("Checking RFID:", uid);

        const pig = await window.electron.getPig(uid);

        if (pig) {
          await recordPigScan(pig);
          setCurrentPig(pig);
          setIsEditing(false);
        } else {
          // Unknown RFID — show pig registration form
          setCurrentPig(null);
          setIsEditing(true);
        }

        setStatus("complete");
      } catch (err) {
        console.error("Error processing scan:", err);
        setStatus("idle");
      }
    },
    [recordPigScan],
  );

  const processScanRef = useRef(processScan);
  useEffect(() => {
    processScanRef.current = processScan;
  }, [processScan]);

  useEffect(() => {
    let buffer = "";
    let timeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (e.key === "Enter") {
        if (buffer) {
          console.log("Processing scan:", buffer);
          processScanRef.current(buffer);
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          buffer = "";
        }, 2000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Loading...
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <LoginScreen
        onLoginSuccess={async (name?: string) => {
          if (name) setLoggedInUser(name);
          await refreshAuth();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      {/* Header Bar */}
      {isAuthenticated && (
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="w-7 h-7 bg-linear-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {loggedInUser ? loggedInUser.charAt(0).toUpperCase() : "?"}
            </div>
            <span className="text-sm font-medium text-slate-700">
              {loggedInUser || "Unknown"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-600 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow-md"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white hover:bg-red-50 rounded-lg border border-red-200 shadow-sm transition-all hover:shadow-md"
            >
              <span className="mb-px">Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Main Container */}
      <div className="w-full max-w-lg">
        {/* State: Idle or Scanning */}
        {status !== "complete" && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-100 flex flex-col items-center justify-center relative">
            <StatusDisplay status={status} />
          </div>
        )}

        {/* State: Complete (Show Pig Profile or Registration Form) */}
        {status === "complete" && scannedUid && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isEditing ? (
              <PigRegistrationForm
                uid={scannedUid}
                initialData={currentPig || undefined}
                onSave={handleSavePig}
                onCancel={() =>
                  currentPig ? setIsEditing(false) : handleReset()
                }
              />
            ) : currentPig ? (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl p-6">
                {/* Pig Profile Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-green-100">
                    <PiggyBank size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {currentPig.pig_number}
                    </h2>
                    <p className="text-sm text-slate-500">Pig Profile</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Type & Pen */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Type</label>
                      <p className="text-slate-800 capitalize">{currentPig.pig_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Pen</label>
                      <p className="text-slate-800">{currentPig.pen}</p>
                    </div>
                  </div>

                  {/* Health Status & Weight */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Health Status</label>
                      <p className={`capitalize ${
                        currentPig.health_status === "healthy" ? "text-green-600" :
                        currentPig.health_status === "at-risk" ? "text-yellow-600" :
                        "text-red-600"
                      }`}>
                        {currentPig.health_status}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Weight</label>
                      <p className="text-slate-800">
                        {currentPig.weight ? `${currentPig.weight} kg` : "Not recorded"}
                      </p>
                    </div>
                  </div>

                  {/* Sire */}
                  {currentPig.sire && (
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Sire</label>
                      <p className="text-slate-800">{currentPig.sire}</p>
                    </div>
                  )}

                  {/* Dam */}
                  {currentPig.dam && (
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Dam</label>
                      <p className="text-slate-800">{currentPig.dam}</p>
                    </div>
                  )}

                  {/* Date of Birth */}
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Date of Birth</label>
                    <p className="text-slate-800">
                      {currentPig.date_of_birth
                        ? new Date(currentPig.date_of_birth).toLocaleDateString()
                        : "Not recorded"}
                    </p>
                  </div>

                  {/* Notes */}
                  {currentPig.notes && (
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Notes</label>
                      <p className="text-slate-800">{currentPig.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all"
                  >
                    Edit Pig
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;