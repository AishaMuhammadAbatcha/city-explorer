# Gemini AI Integration Setup Guide

This guide will help you set up the Google Gemini AI API for the City Explorer chatbot.

## Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Configuration

1. Open the `.env` file in the root of your project
2. Find the line that says `VITE_GEMINI_API_KEY=your_gemini_api_key_here`
3. Replace `your_gemini_api_key_here` with your actual API key

```env
VITE_GEMINI_API_KEY=AIzaSyD...your_actual_key_here
```

4. Save the file
5. Restart your development server:

```bash
npm run dev
```

## Features

The Gemini AI integration provides:

- **Intelligent Responses**: AI-powered responses for city exploration queries
- **Context-Aware Conversations**: Maintains conversation history for better responses
- **Fallback Mode**: Automatically uses mock responses if API key is not configured
- **Free Tier**: Uses the `gemini-1.5-flash` model which is free to use
- **City-Focused**: Optimized for recommending places, businesses, and activities in Nigerian cities

## Usage

Once configured, the AI chatbot in the "Explore AI" page will automatically use Gemini to:

- Recommend restaurants, cafes, and entertainment venues
- Suggest date ideas and activities
- Provide information about tourist attractions
- Help discover local businesses and services
- Answer questions about places to visit

## Testing Without API Key

The app will work without an API key by using mock responses. However, for the best experience, we recommend setting up the Gemini API key.

## API Limits (Free Tier)

- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per minute

These limits are more than sufficient for most development and moderate production use.

## Troubleshooting

### Issue: "API key not found" warning

**Solution**: Make sure you've added your API key to the `.env` file and restarted the development server.

### Issue: Rate limit exceeded

**Solution**: The free tier has generous limits. If you hit them, wait a minute and try again.

### Issue: Responses are slow

**Solution**: This is normal for the first request. Subsequent requests should be faster.

## Security Note

⚠️ **Never commit your `.env` file to version control.** The `.gitignore` file should already be configured to exclude it.
