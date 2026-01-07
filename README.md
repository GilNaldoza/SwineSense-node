# LENS Reader Node

**LENS (Library Entry Management System) - Reader Node**

This is the client-side "Edge Node" application for the LENS ecosystem. It is an Electron-based desktop application designed to run on RFID reader stations (e.g., Raspberry Pi or Mini PCs) at library entrances.

The application operates on an **Offline-First** model. It uses a local SQLite database to allow instant scanning and logging of students/faculty even without an internet connection. It synchronizes data with the central LENS Server via gRPC when a connection is available.

## ✨ Features

*   **RFID Scanning:** Supports USB HID RFID readers (keyboard emulation).
*   **Offline Capability:** Fully functional without internet access. Stores user data and logs locally in SQLite.
*   **Real-time Synchronization:**
    *   **Pull:** Downloads new user registrations from the central server.
    *   **Push:** Uploads local entry logs and new/edited users to the central server.
    *   **Signal:** Listens for "Sync Now" commands from the admin server.
*   **User Interface:** Modern React-based UI (TailwindCSS) for displaying profiles and registration forms.
*   **Admin Mode:** Includes a login screen for node authentication and admins to edit/register users directly on the device.
*   **Smart Reset:** Auto-resets the view after scanning an existing user, but stalls for new users to allow registration.

## 🛠️ Tech Stack

*   **Runtime:** Electron (Node.js)
*   **Frontend:** React, TypeScript, TailwindCSS
*   **Database:** `better-sqlite3` (SQLite)
*   **Communication:** gRPC (`@grpc/grpc-js`)
*   **Architecture:** Distributed Edge Computing

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher recommended)
*   A running LENS Central Server (gRPC) available at `localhost:50051` (default)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/LENS-Library-Entry-Management-System/LENS-node.git
    cd LENS-node
    ```

2.  Install dependencies:
    ```bash
    npm install
    # Install UI dependencies
    cd src/ui && npm install && cd ../..
    ```

3.  **Important:** Rebuild native modules for Electron:
    ```bash
    npm run rebuild
    ```
    *Note: Since `better-sqlite3` is a native C++ module, it must be compiled specifically for the Electron version you are running.*

### Running Development Mode

Start both the React dev server and the Electron main process:

```bash
npm run dev
```

This will:
1.  Start the Vite dev server for React.
2.  Wait for the UI to load.
3.  Launch the Electron window.

### Building for Production

To build the React assets and launch the app in production mode:

```bash
npm start
```

## 📂 Project Structure

*   `src/electron/`: **Main Process**
    *   `main.js`: Entry point, window creation, IPC handlers.
    *   `database.js`: SQLite schema and queries.
    *   `sync/`: gRPC client and sync orchestration logic.
*   `src/ui/`: **Renderer Process** (React App)
    *   `src/components/`: UI components (UserProfile, UserForm, LoginScreen).
    *   `src/App.tsx`: Main logic and state management.
*   `src/proto/`: Protocol Buffer definitions shared with the server.

## 🔄 Synchronization Logic

The node uses a hybrid **Poll + Push + Signal** strategy:
1.  **Poll:** Checks for updates every 5 minutes (default).
2.  **Push:** Uploads local logs immediately upon creating a new user or logging an entry (batched).
3.  **Signal:** Maintains a persistent gRPC stream to listen for `SYNC_NOW` commands from the server.

## 🤝 Contributing

1.  Fork the repo
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request
