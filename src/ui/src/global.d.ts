export interface ElectronAPI {
  getUser: (rfid: string) => Promise<any>;
  saveUser: (user: any) => Promise<{ success: boolean; error?: string }>;
  logEntry: (entry: any) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
