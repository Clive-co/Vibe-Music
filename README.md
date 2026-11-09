# VibeMusic

VibeMusic is a mobile social music app for sharing what you listen to and keeping up with friends. Connect a Spotify or Apple Music account to see listening activity, recent tracks, and weekly recaps; add friends, react to their music, chat, and compete in listening leagues.

> **GitHub description:** A social music app for sharing listening activity, chatting with friends, and competing in weekly music leagues. Built with Expo and React Native.

## Features

- Sign up, email verification, sign in, and password recovery with Amazon Cognito.
- Connect or disconnect Spotify and Apple Music accounts.
- View your listening profile, current and recent tracks, top artists, top tracks, and weekly recap.
- Find and manage friends, view friend activity, and react to tracks with emoji.
- Send and receive friend requests.
- One-to-one and group chats, including message history and unread-message indicators.
- Create and join listening leagues, invite friends, and view leaderboards.
- Edit profile and account settings, manage blocked users, and choose a light, dark, or system theme.
- Cache selected app data locally for a more responsive experience.

## Tech stack

- React Native, TypeScript, and Expo SDK 52
- Expo Router for file-based navigation
- AWS Amplify and Amazon Cognito for authentication and AWS-backed app services
- REST APIs and WebSockets for social, chat, and listening features
- Spotify and Apple Music account integrations
- NativeWind, Tailwind CSS, and React Native components for styling

## Getting started

### Prerequisites

- Node.js and npm
- Expo CLI through `npx` (no global Expo CLI install required)
- Android Studio for an Android emulator or device
- Xcode and macOS for an iOS simulator or device
- Valid configuration for the AWS backend and any music or geolocation services you want to use

### Install and run

From the project directory:

```bash
npm install
npx expo start
```

Use the Expo CLI prompts to open the app on a configured simulator or development build. For native development builds, use:

```bash
npm run android
npm run ios
```

The iOS build command requires macOS and Xcode. Some native modules and OAuth flows may not work in Expo Go; use an Expo development build when needed.

## Service configuration

The app initializes Amplify with `src/amplifyconfiguration.json`, and API service modules currently target a pre-existing AWS development API. That configuration is environment-specific: to run this project against your own infrastructure, provision/configure the matching Amplify resources and replace the checked-in development configuration with your own.

The client also reads these build-time environment variables:

| Variable | Used for |
| --- | --- |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` | Spotify authorization |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` | Spotify token exchange and refresh in the current implementation |
| `EXPO_PUBLIC_IPINFO` | Region/time-zone lookup during account verification |

Create a local `.env` file and provide the values required for the integrations you configure. Do not commit credentials or tokens. **Important:** Expo `EXPO_PUBLIC_*` values are bundled into the client and are visible to users. The current Spotify implementation reads a client secret in the app; do not use that pattern for a production release. Move secret-dependent token exchange and refresh to a trusted backend, and keep private credentials out of the client bundle. IPinfo tokens bundled into the app are also publicly extractable.

Spotify and Apple Music provider setup (including redirect URI configuration and required credentials) must be completed with the respective provider dashboards. The app's configured callback scheme is `myapp`.

## Project structure

```text
app/                    Expo Router routes: auth, tabs, chat, settings, and leagues
components/             Reusable UI grouped by feature
constants/              Colors, themes, and shared styles
context/                Shared app state, including authentication-related music and chat state
data/                   Local sample and placeholder data
src/                    Amplify client configuration
utils/service_api/      REST API clients for users, friends, chats, reactions, and leagues
amplify/backend/         Amplify backend definitions and Lambda functions
assets/                 Images, fonts, SVGs, and animations
```

## Useful commands

```bash
npm run start            # Start Expo
npm run android          # Build and launch on Android
npm run ios              # Build and launch on iOS (macOS only)
npm run web              # Start the web target
npm run lint             # Run Expo lint
npx jest --watchAll=false # Run Jest tests once
```

## Notes

- The frontend depends on backend resources; without valid AWS configuration, account, social, chat, and league features will not work end to end.
- `data/` contains local sample data used by parts of the UI; it is not a replacement for the configured backend.
- App store builds and production operation require your own provider registrations, backend deployment, and secure handling of credentials.
