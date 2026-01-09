interface LogEntry {
  userId: number;
  entryTimestamp: string;
  entryMethod: string;
  status: string;
}

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

export interface ElectronAPI {
  getUser: (rfid: string) => Promise<User | null>;
  saveUser: (user: User) => Promise<{ success: boolean; error?: string }>;
  logEntry: (entry: LogEntry) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
