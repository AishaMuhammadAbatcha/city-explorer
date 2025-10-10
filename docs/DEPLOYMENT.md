# Deployment Guide

## Quick Debug Tool 🔍

**IMPORTANT:** After deployment, visit your site with `?debug=env` to check environment variables:
```
https://your-app.vercel.app/?debug=env
```

This will show a debug panel in the bottom-right corner displaying:
- ✅ Which environment variables are set correctly
- ❌ Which environment variables are missing
- Current environment mode (production/development)

If you see any red ✗ marks, those variables are not configured properly in Vercel.

---

## Environment Variables

Your application requires the following environment variables to function correctly in production:

### Required Environment Variables

#### Google Maps API Configuration
- `VITE_GOOGLE_MAPS_API_KEY` - Your Google Maps API key
- `VITE_MAP_ID` - Your Google Maps Map ID (for styled maps)

#### Supabase Configuration
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable from above with their corresponding values
4. Make sure to set them for **Production**, **Preview**, and **Development** environments
5. After adding/updating environment variables, **redeploy** your application

## Common Issues After Deployment

### 1. 404 Error on Page Reload

**Problem:** When you refresh the page on any route (e.g., `/dashboard`, `/explore`), you get a 404 error.

**Cause:** This is a Single Page Application (SPA) routing issue. Vercel tries to find a physical file for the route, which doesn't exist.

**Solution:** This has been fixed in `vercel.json` by adding rewrites configuration that redirects all requests to `index.html`.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Google Maps Not Loading

**Problem:** Maps don't show, place cards are empty, AI recommendations don't appear.

**Possible Causes:**
1. Environment variables not set in Vercel
2. Google Maps API key not configured or invalid
3. API key restrictions preventing access from your domain

**Solutions:**

#### Check Environment Variables
1. Verify all environment variables are set in Vercel
2. Ensure there are no typos in variable names
3. Redeploy after adding variables

#### Google Maps API Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API
3. Configure API key restrictions:
   - Add your Vercel domain to the allowed referrers (e.g., `https://your-app.vercel.app/*`)
   - Or temporarily remove restrictions for testing

#### Check Browser Console
Open your browser's developer console (F12) and look for errors:
- If you see "Google Maps API key is not configured" → Environment variable not set
- If you see "RefererNotAllowedMapError" → Add your domain to API key restrictions
- If you see "ApiNotActivatedMapError" → Enable the required APIs in Google Cloud Console

### 3. Supabase Connection Issues

**Problem:** User authentication fails, data doesn't load.

**Solutions:**
1. Verify Supabase environment variables are correct
2. Check that your Supabase project is running
3. Verify database tables exist and have correct permissions
4. Check if Row Level Security (RLS) policies are properly configured

## Deployment Checklist

Before deploying to production, ensure:

- [ ] All environment variables are set in Vercel
- [ ] Google Maps APIs are enabled in Google Cloud Console
- [ ] API key restrictions include your production domain
- [ ] Supabase project is running and accessible
- [ ] Database migrations are complete
- [ ] RLS policies are configured
- [ ] `vercel.json` includes SPA rewrites configuration
- [ ] Test all routes work after reload
- [ ] Test Google Maps features (maps page, explore page, AI recommendations)
- [ ] Test authentication flow

## Vercel Deployment

### Automatic Deployment
Vercel automatically deploys your application when you push to your main branch.

### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Environment Variables Template

Copy this template and fill in your values:

```env
# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=AIza...
VITE_MAP_ID=your_map_id

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

## Debugging in Production

### Check Deployment Logs
1. Go to Vercel dashboard
2. Click on your deployment
3. Go to **Logs** tab
4. Look for build errors or runtime errors

### Check Browser Console
1. Open your deployed site
2. Press F12 to open developer tools
3. Go to **Console** tab
4. Look for JavaScript errors

### Environment Check
The application logs environment variable status on load. Check the browser console for:
```
Environment check: {
  hasSupabaseUrl: true/false,
  hasSupabaseKey: true/false,
  hasGoogleMapsKey: true/false,
  mode: "production",
  dev: false,
  prod: true
}
```

If any of these show `false`, the corresponding environment variable is not set correctly in Vercel.

## Getting Help

If you continue to experience issues:
1. Check the browser console for specific error messages
2. Check Vercel deployment logs
3. Verify all environment variables are set correctly
4. Ensure Google Maps APIs are enabled and properly configured
5. Test locally with production environment variables to reproduce the issue
