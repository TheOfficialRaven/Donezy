# Firebase Rules Update Guide

## Issue
The themes system is getting a "permission_denied" error because the Firebase Database Rules don't allow access to the `/themes` path.

## Solution
You need to manually update the Firebase Database Rules in the Firebase Console.

## Steps to Fix

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com/
   - Select your project: `donezy-82cdb`

2. **Navigate to Realtime Database**
   - Click on "Realtime Database" in the left sidebar
   - Click on the "Rules" tab

3. **Update the Rules**
   - Replace the current rules with this updated version:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": true,
        ".write": true,
        "items": {
          "$itemId": {
            ".read": true,
            ".write": true
          }
        }
      }
    },
    "themes": {
      ".read": true,
      ".write": "auth != null"
    },
    "test": {
      ".read": true,
      ".write": true
    },
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```

4. **Publish the Rules**
   - Click the "Publish" button to save the changes

## What This Does
- **`.read: true`** for themes: Allows anyone to read themes (for the theme selector)
- **`.write: "auth != null"`** for themes: Only authenticated users can create/update themes
- Keeps all existing rules for users and test data

## Temporary Workaround
Until you update the rules, the app will automatically fall back to using default themes and show a notification that themes are loaded in offline mode.

## Verification
After updating the rules:
1. Refresh your app
2. Open the theme selector
3. You should no longer see the permission denied error in the console
4. Themes should load from Firebase (if any exist) or use the default themes

## Default Themes Available
The app includes these default themes that work offline:
- Donezy Sötét (default)
- Óceán Kék (unlocks at level 5)
- Erdő Zöld (unlocks at level 10)
- Naplemente Lila (100 Essence)
- Éjfél Arany (250 Essence)
- Neon Rózsaszín (unlocks at level 15) 