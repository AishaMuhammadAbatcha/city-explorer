# Migration Plan: Simplify to Vite + Supabase Only

## 🎯 Goal
Remove the Node.js/Express backend (City_Explorer_Merged) and Redux, keeping only:
- **Frontend**: Vite + React + TypeScript
- **Backend**: Supabase (Database + Auth + Storage + Edge Functions)

## 📊 Analysis

### Current Architecture Issues:
1. **Dual Auth System**: Both Supabase Auth AND Node.js JWT auth (unused)
2. **Unused Redux**: Redux Toolkit is configured but barely used
3. **Unused Node Backend**: The Express server in City_Explorer_Merged is not called by the frontend
4. **Complexity**: Two separate backends causing confusion

### What the Node.js Backend Does:
- ❌ **Auth** (login/register) - REDUNDANT (Supabase Auth already handles this)
- ❌ **Business CRUD** - REDUNDANT (Supabase already has this)
- ❌ **Events/Promos** - REDUNDANT (Supabase already has this)
- ⚠️ **Chatbot** (Google Generative AI) - NEEDS MIGRATION to Supabase Edge Function
- ⚠️ **Image Upload** (Cloudinary) - CAN USE Supabase Storage instead

## ✅ Migration Steps

### Phase 1: Remove Unused Code ✓
1. Delete `City_Explorer_Merged/` directory
2. Remove Redux files (`src/app/store.ts`, `src/app/*ApiSlice.ts`)
3. Remove unused dependencies
4. Clean up environment variables

### Phase 2: Migrate Features to Supabase
1. **Chatbot** → Supabase Edge Function with Google AI
2. **Image Uploads** → Supabase Storage
3. Update any remaining code that references the old backend

### Phase 3: Clean Up
1. Remove unused packages from package.json
2. Update documentation
3. Test all features
4. Deploy

## 🚀 Benefits After Migration
- ✅ Single source of truth (Supabase)
- ✅ Simpler deployment (just Vite app)
- ✅ Lower maintenance burden
- ✅ Better performance (no extra API layer)
- ✅ Easier to understand and onboard new developers
