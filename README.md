# 3S Neighbourhood Viewer

A collaborative map-based discussion platform for neighbourhoods, allowing users to create and comment on location-based threads. Users can log in with Google, choose a role, and interact with others on a shared map.

> **Disclaimer:** Some API paths (such as `/api` and authentication endpoints) are hardcoded in the frontend and backend. If you deploy or use this app in a different environment or under a different base path, you will need to update these paths accordingly in the source code.

## Features
- **Interactive Map**: View and switch between multiple map styles (OpenStreetMap, Topo, CartoDB, Stamen Toner, Esri Satellite, and overlays).
- **Location-based Threads**: Create threads at specific map locations and comment on them.
- **User Roles**: Choose from Municipality Official, Private company, or Friendly neighbour.
- **Google Login**: Secure authentication using Google OAuth.
- **Sidebar**: Browse, filter, and focus on threads by role.
- **Persistent Storage**: All data is stored in a local SQLite database.

## Setup

### Prerequisites
- Node.js (v14 or higher recommended)
- npm (comes with Node.js)

### Installation
1. Clone the repository or download the source code.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Google OAuth credentials and update the configuration in `server.js` (see comments in the file for details).
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser and go to [http://localhost:3000](http://localhost:3000)

## Usage
- Log in with your Google account.
- Choose a username and role.
- Click on the map to create a new thread, or select existing threads from the sidebar to view and comment.
- Use the map style dropdown to change the map's appearance.
- Filter threads in the sidebar by user role.

## Project Structure
- `server.js` - Express server, API endpoints, authentication
- `db.js` - SQLite database setup and queries
- `Prototype.html` - Main frontend (map and UI)
- `threads.db` - SQLite database file
- `package.json` - Project dependencies and scripts

## Dependencies
- express
- cors
- express-session
- passport
- passport-google-oauth20
- sqlite3
- leaflet (frontend)

## License
ISC

---
Feel free to contribute or suggest improvements! 