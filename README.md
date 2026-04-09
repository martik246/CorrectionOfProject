# Food Journal Tracker

## About the project
This is a React Native / Expo application for keeping a simple food journal. A user can register, sign in, add meal entries with an image and description, edit or delete them later, and filter entries by category.

During the work on this assignment, I reviewed the original codebase, fixed the broken parts, updated the storage layer, and improved the interface so the application is easier to use and more stable.

## What I changed
- fixed the database layer and aligned it with the current async `expo-sqlite` API
- cleaned up the authentication flow for registration and login
- improved the journal screen logic for creating, editing, deleting, and filtering entries
- added a demo account and demo journal entries for quick testing
- added a separate web-friendly storage implementation to avoid runtime issues in the browser
- improved the UI of the authentication and journal screens
- added a runtime error boundary so critical rendering failures are easier to notice

## Stack
- Expo SDK 52
- React Native 0.76
- React Navigation
- `expo-sqlite`
- `expo-image-picker`
- `expo-camera`

## Project structure
- `App.js` - application startup, navigation, database initialization
- `components/auth/authScreen.js` - login and registration screen
- `components/database/database.js` - native database layer
- `components/database/database.web.js` - browser storage layer
- `screens/homeScreen.js` - native journal screen
- `screens/homeScreen.web.js` - web journal screen
- `REPORT_RU.md` - detailed report in Russian

## Notes about storage
For native platforms the project uses `expo-sqlite`.

For the web version I added a separate implementation based on `localStorage`. I did this because browser support for SQLite in Expo web can introduce extra setup and runtime issues, while the assignment still needs the app to work reliably in the browser.

## Demo account
You can use the following credentials to test the app immediately:

- email: `demo@example.com`
- password: `demo123`

The demo account is pre-filled with several journal entries.

## Run the project
Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

Run web:

```bash
npx expo start --web
```

Build web export:

```bash
npx expo export --platform web
```

## What I checked
- application startup
- database initialization
- registration flow
- login flow
- loading journal entries
- adding, editing, and deleting entries
- filtering by category
- web bundling through Expo

## Additional note
In PowerShell, `npm` / `npx` may be blocked by the local execution policy. In that case the commands can be run through `npm.cmd` and `npx.cmd`.
