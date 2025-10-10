# City Explorer

A modern location-based discovery platform built with **Vite + React + TypeScript** and **Supabase**, helping users explore and connect with local businesses, events, and activities.

## 🎯 Features

- **🔐 Authentication**: Secure user authentication with Supabase Auth
- **📍 Location Services**: Google Maps integration for place discovery
- **🤖 AI Recommendations**: Personalized business and event suggestions
- **⭐ Reviews & Ratings**: User-generated reviews and ratings
- **❤️ Favorites**: Save and bookmark favorite places
- **📅 Events**: Discover and register for local events
- **📱 Responsive Design**: Mobile-first, works on all devices
- **🌓 Dark Mode**: Built-in dark/light theme support

## 🏗️ Tech Stack

### Frontend
- **Framework**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI + shadcn/ui
- **Routing**: React Router 7
- **Forms**: React Hook Form + Zod
- **Maps**: Google Maps (@vis.gl/react-google-maps)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for images)
- **Real-time**: Supabase Realtime subscriptions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd city-explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Then update `.env` with your credentials:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_MAP_ID=your_map_id
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   - Go to your Supabase project dashboard
   - Open the SQL Editor
   - Run the SQL from `database-schema.sql`
   - This creates all necessary tables, policies, and triggers

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
city-explorer/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── places/      # Place cards & details
│   │   ├── recommendations/  # AI recommendation cards
│   │   └── notifications/    # Notification center
│   ├── contexts/        # React contexts (Auth)
│   ├── hooks/           # Custom React hooks
│   ├── layout/          # Dashboard layout components
│   ├── lib/             # Utilities & Supabase client
│   ├── pages/           # Auth pages
│   ├── roles/           # Role-specific pages
│   │   ├── business/   # Business dashboard
│   │   └── individual/ # User dashboard
│   ├── routers/         # React Router configuration
│   ├── services/        # API service layer
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
├── database-schema.sql  # Supabase database schema
└── vercel.json         # Vercel deployment config
```

## 🗄️ Database Schema

The Supabase database includes the following tables:

- **profiles**: User information and roles
- **businesses**: Business listings
- **events**: Business events
- **reviews**: User reviews and ratings
- **favorites**: User bookmarks
- **bookings**: Reservation system
- **notifications**: User notifications

All tables have Row Level Security (RLS) enabled for data protection.

## 🎨 User Roles

### Individual Users
- Explore businesses and events
- Write reviews
- Save favorites
- Make bookings
- Get AI recommendations

### Business Users
- Manage business profile
- Create and manage events
- Respond to reviews
- View analytics
- Manage deals/promos

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_MAP_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Other Platforms

The app can also be deployed to:
- Netlify
- Cloudflare Pages
- GitHub Pages

Just make sure to set the environment variables on your chosen platform.

## 🔒 Security

- **Row Level Security**: Enabled on all Supabase tables
- **API Keys**: Store in environment variables, never commit `.env`
- **Authentication**: Handled securely by Supabase Auth
- **HTTPS**: Always use HTTPS in production

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

Additional documentation is available in the [`docs/`](./docs) folder:

- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Complete deployment instructions for Vercel
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Backend Setup](./docs/BACKEND_SETUP.md)** - Supabase backend configuration
- **[Architecture](./docs/SIMPLIFIED_ARCHITECTURE.md)** - System architecture overview
- **[Migration Guide](./docs/MIGRATION_SUCCESS.md)** - Vite migration details

## 📞 Support

For issues or questions, please open an issue in the GitHub repository.

---

Built with ❤️ using Vite + React + Supabase
