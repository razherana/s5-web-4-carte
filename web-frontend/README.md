# Web Frontend - React Application

A modern, responsive web application for managing road reports with glassmorphism design. Built with React, Leaflet, and Vite.

## Features

### 🔐 Authentication
- Login with email/password
- User registration
- Profile management
- Role-based access control (Visitor/Manager)
- JWT token authentication
- Session management

### 🗺️ Interactive Map (Offline OpenStreetMap)
- Leaflet integration with offline tiles
- Real-time report markers with color-coded status:
  - 🔵 Blue: New reports
  - 🟠 Orange: In Progress
  - 🟢 Green: Completed
- Interactive popups with detailed information
- Click-to-edit functionality for managers
- Smooth animations and hover effects

### 📊 Statistics Dashboard
- Total reports count
- Total surface area (m²)
- Total budget (Ariary)
- Progress percentage
- Status breakdown visualization
- Real-time data updates

### 👤 Visitor Mode (Public Access)
- View all reports on the map (read-only)
- Access statistics dashboard
- No authentication required
- Clean, intuitive interface

### 👨‍💼 Manager Features
- Full dashboard access
- Edit report details (surface, budget, company, status, description)
- User management (create, view, unblock, delete)
- Firebase synchronization
- Real-time updates

### 🎨 Modern UI/UX
- Glassmorphism design
- Responsive layout (desktop + tablet + mobile)
- Dark theme with gradient backgrounds
- Smooth animations and transitions
- Loading states and error handling
- Success/error notifications

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Leaflet** - Maps
- **Axios** - HTTP client
- **CSS3** - Styling

## Prerequisites

- Node.js 16+ and npm
- Backend API running on `http://localhost:8000`
- Docker for offline map tiles

## Installation

1. **Install dependencies:**
   ```bash
   cd web-frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Start map server:**
   ```bash
   cd ../web-carte/maps
   docker-compose up -d
   ```

## Development

Start dev server:
```bash
npm run dev
```

Access at `http://localhost:5173`

## Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
web-frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── contexts/      # React contexts
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/login`
- `POST /api/register`
- `PUT /api/profile`

### Reports
- `GET /api/signalements`
- `PUT /api/signalements/:id`
- `POST /api/signalements/sync`

### Users (Manager)
- `GET /api/users`
- `POST /api/users`
- `POST /api/users/:id/unblock`
- `DELETE /api/users/:id`

## Routes

### Public
- `/` → Visitor dashboard
- `/login` → Login
- `/register` → Register
- `/visitor/dashboard` → Public view

### Protected
- `/profile` → User profile

### Manager
- `/manager/dashboard` → Manager view
- `/manager/users` → User management
- `/manager/users/create` → Create user
- `/manager/reports/edit` → Edit report

## Troubleshooting

### Map tiles not loading
- Ensure Docker is running
- Check `http://localhost:8080`
- Verify `.env` settings

### API errors
- Verify backend is running
- Check `.env` configuration
- Check browser console

### Authentication issues
- Clear localStorage
- Check token validity
- Verify API endpoints

## License

MIT License
