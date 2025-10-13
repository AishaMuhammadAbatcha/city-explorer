# Authentication Debug Guide

## What Was Fixed

### 1. Improved Auth State Management
- Removed race conditions between initialization timeout and profile fetch
- Added proper timeout management with clear/reset logic
- Added specific handling for `SIGNED_IN` and `TOKEN_REFRESHED` events
- Profile fetch failures no longer cause infinite loading

### 2. Fixed ProtectedRoute Component
- Removed extra "Loading profile..." screen that was blocking users
- Now allows access even if profile isn't loaded (with warning)
- Only redirects based on role if profile is actually loaded

### 3. Enhanced Error Handling
- Profile fetch errors now properly set loading to false
- Added logging for better debugging
- Handles missing profiles gracefully (PGRST116 error)

## Expected Console Logs (Normal Flow)

When you log in, you should see:

```
Auth state change: SIGNED_IN <user-id>
Fetching profile for user: <user-id>
Profile fetched successfully: individual (or business)
```

## Troubleshooting

### If you still see "Auth initialization timeout"

This means the profile fetch is taking longer than 3 seconds. Check:

1. **Database Connection**: Is Supabase accessible?
   ```javascript
   // Open browser console and run:
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
   ```

2. **Profile Table**: Does the profiles table exist and have a record for your user?
   - Go to Supabase Dashboard
   - Navigate to Table Editor
   - Check the `profiles` table
   - Verify your user ID has a profile record

3. **Network**: Check Network tab in DevTools
   - Look for failed requests to Supabase
   - Check response times

### If you see "Profile fetch timeout"

The system will still let you in after 3 seconds, but this indicates:

1. **Slow Network**: Profile fetch is taking too long
2. **Missing Profile**: User has no profile record (check database)
3. **Database Issue**: Check Supabase service status

### What to Check in Console

1. **User ID**: Look for the SIGNED_IN log
2. **Profile Fetch**: Look for "Fetching profile for user"
3. **Profile Success**: Look for "Profile fetched successfully"
4. **Errors**: Look for any red error messages about profile fetch

## Manual Testing Steps

### Test 1: Fresh Login
1. Clear browser cache and local storage
2. Navigate to `/login`
3. Enter credentials
4. Click Sign In
5. **Expected**: Should see dashboard within 3-5 seconds
6. **Check console**: Should see successful profile fetch

### Test 2: Page Reload
1. After logging in successfully
2. Refresh the page (F5)
3. **Expected**: Should remain logged in and see dashboard
4. **Check console**: Should see SIGNED_IN event and profile fetch

### Test 3: Role-Based Access
1. Log in as an individual user
2. Try to navigate to `/business/dashboard`
3. **Expected**: Should redirect to `/dashboard`
4. **Check console**: Should see redirect message

## Quick Fix Commands

### If the dev server is running, restart it:
```bash
# Press Ctrl+C to stop
npm run dev
```

### Clear browser storage:
```javascript
// Run in browser console:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Check if profile exists in database:
```sql
-- Run in Supabase SQL Editor:
SELECT * FROM profiles WHERE id = '<your-user-id>';
```

## Common Issues and Solutions

### Issue: "Loading..." never stops

**Possible Causes:**
1. Network request failing silently
2. Profile doesn't exist in database
3. JavaScript error preventing state update

**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify profile exists in Supabase

### Issue: Redirected to login immediately

**Possible Causes:**
1. Session expired
2. Invalid token
3. Supabase configuration issue

**Solution:**
1. Try logging in again
2. Check .env file has correct VITE_SUPABASE_* values
3. Clear browser storage and try again

### Issue: "Profile not found" warning

**Cause:** User exists but has no profile record

**Solution:**
Create a profile record in Supabase:
```sql
INSERT INTO profiles (id, email, role, full_name)
VALUES ('<user-id>', '<email>', 'individual', '<name>');
```

## Testing Checklist

- [ ] Login works without infinite loading
- [ ] Page refresh maintains login state
- [ ] Logout works properly
- [ ] Role-based redirects work
- [ ] Console shows proper log sequence
- [ ] No JavaScript errors in console
- [ ] Profile data loads correctly

## Files to Check

1. `src/contexts/AuthContext.tsx` - Auth logic
2. `src/routers/Router.tsx` - Route protection
3. `.env` - Supabase configuration
4. Browser DevTools Console - Runtime logs
5. Browser DevTools Network - API requests

## Getting Help

If issues persist:

1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify database schema matches expectations
4. Test with a different browser
5. Clear all browser data and retry

## Success Indicators

✅ Login completes in < 3 seconds
✅ Console shows "Profile fetched successfully"
✅ Dashboard loads with user data
✅ Page refresh maintains login
✅ No timeout warnings in console
✅ No JavaScript errors
