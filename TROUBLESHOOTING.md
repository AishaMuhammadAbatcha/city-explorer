# Troubleshooting Guide - Maps & Data Not Loading

## Quick Diagnosis

### Step 1: Check Environment Variables in Production

Visit your deployed site and add `?debug=env` to the URL:
```
https://your-app.vercel.app/?debug=env
```

You should see a debug panel in the bottom-right corner showing the status of all environment variables.

**Expected Result:**
- All variables should show a green checkmark (✓)
- If any show a red X (✗), they're not configured correctly

### Step 2: Check Browser Console

1. Open your deployed site
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Look for the "Environment check" log

**What to look for:**
```javascript
Environment check: {
  hasSupabaseUrl: true,      // Should be true
  hasSupabaseKey: true,      // Should be true
  hasGoogleMapsKey: true,    // Should be true
  mode: "production",
  dev: false,
  prod: true
}
```

If any value is `false`, that environment variable is not set correctly.

## Common Issues & Solutions

### Issue 1: Environment Variables Show as `false`

**Symptoms:**
- Environment check shows `hasGoogleMapsKey: false`
- Maps don't load
- No place data appears
- AI recommendations are empty

**Causes:**
1. Environment variables not set in Vercel
2. Typo in variable names
3. Variables not set for the correct environment (Production vs Preview)
4. Deployment built before variables were added

**Solutions:**

#### A. Verify Variables in Vercel
1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Environment Variables**
3. Verify all these variables exist:
   ```
   VITE_GOOGLE_MAPS_API_KEY
   VITE_MAP_ID
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   ```
4. Check they're enabled for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (optional)

#### B. Check Variable Names
**IMPORTANT:** Vite requires the `VITE_` prefix!

❌ Wrong:
```
GOOGLE_MAPS_API_KEY=xxx
SUPABASE_URL=xxx
```

✅ Correct:
```
VITE_GOOGLE_MAPS_API_KEY=xxx
VITE_SUPABASE_URL=xxx
```

#### C. Redeploy After Adding Variables
Environment variables are **baked into the build**. You MUST redeploy after adding them.

**Option 1: Push a new commit**
```bash
git commit --allow-empty -m "Trigger rebuild"
git push
```

**Option 2: Redeploy in Vercel**
1. Go to Vercel Dashboard → Deployments
2. Click the three dots (•••) on the latest deployment
3. Click **Redeploy**
4. ✅ Check "Use existing Build Cache" (optional)

### Issue 2: Google Maps API Errors

**Symptoms:**
- Console shows: `RefererNotAllowedMapError`
- Console shows: `ApiNotActivatedMapError`
- Maps show grey boxes or error messages

**Solutions:**

#### A. Enable Required APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Library**
4. Enable these APIs:
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Geocoding API
   - ✅ Directions API

#### B. Configure API Key Restrictions

**For Production:**
1. Go to [API Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers (websites)"
   - Add your domains:
     ```
     https://your-app.vercel.app/*
     https://*.vercel.app/*
     http://localhost:5173/*
     ```

**For Testing (Temporary):**
- Set "Application restrictions" to **None**
- ⚠️ Remember to add restrictions after testing!

#### C. Check API Key Billing
1. Go to [Google Cloud Console Billing](https://console.cloud.google.com/billing)
2. Verify billing is enabled
3. Google Maps APIs require a billing account (with free tier)

### Issue 3: Data Loading Errors

**Symptoms:**
- Maps load but no places appear
- "No recommendations available" message
- Empty place cards

**Solutions:**

#### A. Check Browser Console for Specific Errors

Look for errors like:
```
Failed to initialize Google Maps: [error message]
Places search failed: OVER_QUERY_LIMIT
Places search failed: REQUEST_DENIED
```

**OVER_QUERY_LIMIT:**
- You've exceeded the API quota
- Solution: Enable billing or wait for quota reset

**REQUEST_DENIED:**
- API key is invalid or restricted
- Solution: Check API key restrictions and ensure APIs are enabled

**ZERO_RESULTS:**
- No places found for the search criteria
- This is normal if searching in remote areas

#### B. Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Look for failed requests to:
   - `googleapis.com`
   - Your Supabase domain
4. Click on failed requests to see error details

### Issue 4: Authentication/Supabase Errors

**Symptoms:**
- Can't log in
- "Failed to fetch" errors
- Data doesn't save

**Solutions:**

#### A. Verify Supabase Variables
1. Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
2. Verify they match your Supabase project settings:
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Select your project
   - Go to **Settings** → **API**
   - Copy the URL and anon/public key

#### B. Check Supabase Service
1. Ensure your Supabase project is active (not paused)
2. Check [Supabase Status](https://status.supabase.com/)

## Testing Checklist

After making changes, verify:

- [ ] Visit site with `?debug=env` - all variables show ✓
- [ ] Browser console shows all env vars as `true`
- [ ] No errors in browser console
- [ ] Can navigate to different pages and reload without 404
- [ ] Maps page shows the map
- [ ] Explore page shows place cards
- [ ] Dashboard shows AI recommendations
- [ ] Can search for places
- [ ] Authentication works

## Still Not Working?

### Get More Details

1. **Check Exact Console Error:**
   - What's the exact error message?
   - Is it a Google Maps error or Supabase error?

2. **Screenshot the Debug Panel:**
   - Visit your site with `?debug=env`
   - Take a screenshot of the environment variables panel

3. **Check Vercel Deployment Logs:**
   - Go to Vercel → Deployments → Latest deployment
   - Click "View Build Logs"
   - Look for errors during build

4. **Verify API Key Works Locally:**
   ```bash
   # Create .env file locally
   cp .env.example .env

   # Add your actual values to .env
   # Then test locally:
   npm run dev
   ```

   If it works locally but not in production, it's definitely an environment variable issue.

## Common Mistakes

❌ **Using quotes in Vercel environment variables**
```
VITE_GOOGLE_MAPS_API_KEY="AIza..."  ❌ Don't use quotes
VITE_GOOGLE_MAPS_API_KEY=AIza...    ✅ Correct
```

❌ **Forgetting to redeploy after adding variables**
- Variables are baked into the build
- Must redeploy after any environment variable change

❌ **Setting variables only for Preview/Development**
- Must be set for Production environment

❌ **Using wrong API key**
- Maps JavaScript API key ≠ Places API key ≠ Other API keys
- Use the same key for all Maps-related APIs

## Need Help?

If you've tried everything above:

1. Share the error message from browser console
2. Share screenshot of the debug panel (`?debug=env`)
3. Confirm you've:
   - Set all env vars in Vercel
   - Enabled all required Google Maps APIs
   - Redeployed after setting variables
