import { useState, useEffect, useRef } from "react";
import { UserForm } from "./components/UserForm";
import { UserProfile } from "./components/UserProfile";
import { StatusDisplay } from "./components/StatusDisplay";
import { LoginScreen } from "./components/LoginScreen";

// --- Types ---
declare global {
  interface Window {
    electron: {
      getUser: (uid: string) => Promise<User | null>;
      saveUser: (user: User) => Promise<void>;
      login: (creds: {username: string, password: string}) => Promise<{success: boolean, error?: string}>;
      checkAuth: () => Promise<{authenticated: boolean, nodeId: string}>;
      sync: () => Promise<{success: boolean, error?: string}>;
    }
  }
}

// Types matching DB schema (snake_case from DB)
interface User {
  user_id?: number;
  id_number: string;
  rfid_tag: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: 'student' | 'faculty';
  college: string;
  department: string;
  year_level: string;
  status: 'active' | 'inactive';
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = loading
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [resetDuration, setResetDuration] = useState<number | undefined>(undefined);
  
  // Use generic type for timeout compatible with both Node and Browser
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Check authentication on mount
    window.electron.checkAuth().then(res => {
      setIsAuthenticated(res.authenticated);
    });
  }, []);

  const clearAutoReset = () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  };

  const handleReset = () => {
    setCurrentUser(null);
    setScannedUid(null);
    setIsEditing(false);
    setResetDuration(undefined);
    setStatus('idle');
    clearAutoReset();
  };



  const handleSaveUser = async (formData: any) => {
    // Convert camelCase form data to snake_case DB schema
    const userToSave: User = {
      id_number: formData.idNumber,
      rfid_tag: scannedUid || "",
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      user_type: formData.userType,
      college: formData.college,
      department: formData.department,
      year_level: formData.yearLevel,
      status: formData.status
    };

    try {
      if (scannedUid) {
        await window.electron.saveUser(userToSave);
        // Show the saved profile briefly
        const savedUser = await window.electron.getUser(scannedUid);
        setCurrentUser(savedUser);
        setIsEditing(false);
        setResetDuration(2000);
        
        // Auto-return to reader after showing the profile briefly
        clearAutoReset();
        resetTimeoutRef.current = setTimeout(() => {
          handleReset();
        }, 2000);
      }
    } catch (err) {
      console.error('Error saving user:', err);
      // In a real app we might show an error toast here
    }
  };

  // --- Scan Processing ---
  const processScan = async (uid: string) => {
    clearAutoReset();

    setScannedUid(uid);
    // Optional: show scanning state briefly if needed, but for now direct to result
    
    try {
      console.log("Calling electron.getUser with:", uid);
      const user = await window.electron.getUser(uid);
      
      setStatus('complete'); // Show the results view
      
      if (user) {
        setCurrentUser(user);
        setIsEditing(false);
        setResetDuration(4000);
        // Auto-reset for existing users only
        resetTimeoutRef.current = setTimeout(() => {
          handleReset();
        }, 4000);
      } else {
        // New user
        setResetDuration(undefined);
        setCurrentUser(null);
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      // In case of error, maybe go back to idle?
       setStatus('idle');
    }
  };

  // --- Keyboard Scanner Listener ---
  // Use a ref to access the latest processScan without resetting the effect/buffer
  const processScanRef = useRef(processScan);
  useEffect(() => {
    processScanRef.current = processScan;
  }, [processScan]);

  useEffect(() => {
    let buffer = "";
    let timeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a form field
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      if (e.key === 'Enter') {
        if (buffer) {
          console.log("Processing scan:", buffer);
          processScanRef.current(buffer);
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
        // Clear buffer if typing is too slow (scanners are fast, but we allow 2s for manual testing)
        clearTimeout(timeout);
        timeout = setTimeout(() => { buffer = ""; }, 2000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }

  if (isAuthenticated === false) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      
      {/* Main Container */}
      <div className="w-full max-w-lg">
        
        {/* State: Idle or Scanning */}
        {status !== 'complete' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[400px] flex flex-col items-center justify-center relative">
             <StatusDisplay status={status} />
          </div>
        )}

        {/* State: Complete (Show Profile or Form) */}
        {status === 'complete' && scannedUid && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Back button for admin convenience */}
             <button onClick={handleReset} className="mb-4 text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1">
                ← Back to Reader
             </button>

             {isEditing ? (
               <UserForm 
                 uid={scannedUid} 
                 initialData={currentUser || undefined}
                 isNewUser={!currentUser}
                 onSave={handleSaveUser}
                 onCancel={() => currentUser ? setIsEditing(false) : handleReset()} 
               />
             ) : (
               <UserProfile 
                 uid={scannedUid} 
                 data={currentUser!} 
                 onEdit={() => {
                   // If user manually edits, cancel the auto-reset
                   clearAutoReset();
                   setResetDuration(undefined);
                   setIsEditing(true);
                 }} 
                 autoResetDuration={resetDuration}
               />
             )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
