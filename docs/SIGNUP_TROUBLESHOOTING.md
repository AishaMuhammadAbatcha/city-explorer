# Signup Troubleshooting Guide

This guide helps resolve common signup issues users may encounter.

## Recent Fixes Applied

### 1. Database Trigger Fixed (Migration 004)
**Problem**: User roles weren't being saved when creating accounts.

**Solution**: Updated the `handle_new_user()` function to include the role field.

**Location**: `supabase/migrations/004_fix_signup_trigger.sql`

**To Apply**: Run the migration:
```bash
# If using Supabase CLI
supabase db push

# Or manually run the migration SQL in your Supabase dashboard
```

### 2. Improved Form Validation
**Changes**:
- Added email format validation
- Trimmed whitespace from email and name inputs
- Added clearer password requirements
- Better error messages for common issues

### 3. Enhanced Error Handling
**User-Friendly Messages**:
- "This email is already registered" → Instead of raw Supabase errors
- "Please enter a valid email address" → For invalid email formats
- "Too many signup attempts" → For rate limiting
- Clear password requirement hints

## Common Signup Issues & Solutions

### Issue 1: "User already registered" Error
**Cause**: Email address already exists in the system

**Solutions**:
1. Try logging in instead of signing up
2. Use the "Forgot Password" link if you can't remember your password
3. Contact support if you believe this is an error

### Issue 2: Email Confirmation Not Received
**Possible Causes**:
- Email in spam/junk folder
- Supabase email confirmation disabled
- Invalid email address

**Solutions**:
1. Check spam/junk folder
2. Verify email address is correct
3. Wait a few minutes (emails can be delayed)
4. For development: Check if email confirmation is required in Supabase settings

**To Disable Email Confirmation (Development Only)**:
1. Go to Supabase Dashboard
2. Navigate to Authentication → Settings
3. Under "Email Auth", toggle off "Confirm email"
4. **Important**: Re-enable for production!

### Issue 3: "Too many signup attempts"
**Cause**: Rate limiting protection

**Solution**: Wait 5-10 minutes before trying again

### Issue 4: Weak Password Error
**Requirements**:
- Minimum 6 characters
- Recommended: Include uppercase letters or numbers

**Solution**: Create a stronger password following the requirements

### Issue 5: Profile Not Created After Signup
**Cause**: Database trigger not running or RLS policies blocking creation

**Checks**:
1. Verify migration 004 is applied (see above)
2. Check Supabase logs for trigger errors
3. Verify `profiles` table RLS policies allow inserts

**RLS Policy Check**:
```sql
-- Should allow public inserts via trigger
SELECT * FROM pg_policies
WHERE tablename = 'profiles';
```

### Issue 6: Role Not Saved
**Cause**: Old version of `handle_new_user()` trigger

**Solution**: Apply migration 004 (see top of document)

## Testing the Signup Flow

### Manual Test Checklist:
1. ✅ Fill in all required fields
2. ✅ Use a valid email format
3. ✅ Password meets requirements (6+ characters)
4. ✅ Passwords match
5. ✅ Select account type (Individual/Business)
6. ✅ Submit form
7. ✅ Check for success message
8. ✅ Verify redirect to login page
9. ✅ (If email confirmation enabled) Check email
10. ✅ Login with new credentials

### Database Verification:
```sql
-- Check if user was created in auth.users
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users
WHERE email = 'test@example.com';

-- Check if profile was created
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE email = 'test@example.com';
```

## Environment-Specific Issues

### Development
- **Mock emails**: Supabase local dev shows emails in terminal
- **Auto-confirm**: Can disable email confirmation
- **Check logs**: Use `supabase logs` to see errors

### Production
- **SMTP configured**: Verify email service is set up
- **Domain verified**: Ensure sending domain is verified
- **Check quotas**: Verify Supabase plan limits

## Debugging Tips

### Enable Console Logging
The app now logs signup attempts to the browser console:

```javascript
// Check browser console for:
- "Signup successful, user created: [user-id]"
- "Signup error: [error details]"
```

### Common Console Errors:

1. **"Invalid email"**
   - Email format is wrong
   - Email contains invalid characters

2. **"User already registered"**
   - Email exists in database
   - Previous incomplete signup

3. **"Password too weak"**
   - Supabase's default password strength requirements not met

4. **"Network error"**
   - Check internet connection
   - Verify Supabase URL/keys are correct
   - Check browser network tab for failed requests

## Contact Support

If issues persist after trying these solutions:

1. **Check browser console** for specific error messages
2. **Check Supabase logs** in the dashboard
3. **Provide details**:
   - Error message received
   - Browser and version
   - Steps to reproduce
   - Screenshot if possible

## For Developers

### Recent Code Changes

**Files Modified**:
- `src/pages/auth/Signup.tsx` - Better validation and error handling
- `src/contexts/AuthContext.tsx` - Improved error catching
- `supabase/migrations/004_fix_signup_trigger.sql` - Fixed role saving

### Testing Locally

```bash
# Start development server
npm run dev

# In another terminal, watch Supabase logs (if using local Supabase)
supabase logs

# Test signup with various scenarios
```

### Key Validation Points
- Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Password: Minimum 6 characters
- All fields: Trimmed before submission
- Role: Defaults to 'individual' if not specified
