# Firebase Setup Guide for Donezy

## 🔥 Firebase Projekt konfigurálva

A Donezy alkalmazás Firebase backend-je már be van állítva a következő konfigurációval:

### ✅ Aktuális Firebase konfiguráció

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBu25SFdGZLJzMjbcT_jd8_Vput6E7vYR4",
    authDomain: "donezy-82cdb.firebaseapp.com",
    databaseURL: "https://donezy-82cdb-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "donezy-82cdb",
    storageBucket: "donezy-82cdb.firebasestorage.app",
    messagingSenderId: "960038081983",
    appId: "1:960038081983:web:afb9627c4d88572b24bd0a",
    measurementId: "G-YEKELDTEQK"
};
```

### 📊 Projekt információk

- **Projekt ID**: `donezy-82cdb`
- **Régió**: `europe-west1`
- **Analytics**: Beállítva (`G-YEKELDTEQK`)
- **Realtime Database**: Aktív
- **Storage**: Elérhető

## 🚀 Gyors indítás

### 1. Alkalmazás indítása
```bash
# Egyszerű indítás
python -m http.server 8000
# Vagy
npx http-server
```

### 2. Firebase kapcsolat tesztelése
Nyisd meg a böngésző konzolt és futtasd:

```javascript
// Firebase kapcsolat tesztelése
const firebaseService = new FirebaseService();
const isConnected = await firebaseService.testConnection();
console.log('Firebase connected:', isConnected);

// Kapcsolat állapot lekérdezése
const status = firebaseService.getConnectionStatus();
console.log('Connection status:', status);
```

## 📊 Adatbázis struktúra

### Felhasználói adatok
```
users/
  {userId}/
    group: "student" | "self-improver" | "freelancer" | "worker" | "organizer"
    level: 1
    xp: 0
    streak: 0
    createdAt: "2024-01-15T10:30:00.000Z"
    lastActive: "2024-01-15T10:30:00.000Z"
    items/
      {itemId}/
        id: "task_1234567890"
        type: "task" | "note" | "event"
        title: "Feladat címe"
        description: "Feladat leírása"
        createdAt: "2024-01-15T10:30:00.000Z"
        completed: false
```

### Példa adatok
```json
{
  "users": {
    "user_1705312200000_abc123": {
      "group": "student",
      "level": 1,
      "xp": 150,
      "streak": 3,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastActive": "2024-01-15T15:45:00.000Z",
      "items": {
        "task_1705312200000": {
          "id": "task_1705312200000",
          "type": "task",
          "title": "Matematika házi feladat",
          "description": "Oldd meg a 15-20. feladatokat",
          "createdAt": "2024-01-15T10:30:00.000Z",
          "completed": false
        }
      }
    }
  }
}
```

## 🔧 Firebase Console beállítások

### 1. Realtime Database szabályok
A Firebase Console > Realtime Database > Rules oldalon állítsd be:

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

**Vagy használd a `firebase-database-rules.json` fájlt:**

1. Nyisd meg a [Firebase Console](https://console.firebase.google.com/project/donezy-82cdb)
2. Válaszd ki a projektet: `donezy-82cdb`
3. Menj a **Realtime Database** > **Rules** oldalra
4. Másold be a fenti szabályokat vagy a `firebase-database-rules.json` tartalmát
5. Kattints **Publish** gombra

**Megjegyzés**: Ez a konfiguráció tesztelési célokra van beállítva. Éles környezetben szigorúbb szabályokat kell alkalmazni.

### 2. Analytics beállítások
- **Google Analytics**: Automatikusan beállítva
- **Események követése**: Aktív
- **Felhasználói tevékenységek**: Rögzítve

## 🛠️ Fejlesztői információk

### Firebase Service osztály funkciói

#### Alapvető műveletek:
- **Felhasználó kezelés**: Adatok mentése és betöltése
- **Célcsoport kezelés**: Felhasználói csoport mentése és lekérdezése
- **Elemek kezelése**: Feladatok, jegyzetek, események mentése
- **Kapcsolat tesztelés**: Firebase elérhetőség ellenőrzése

#### Analytics funkciók:
- **Felhasználói tevékenységek**: Automatikus követés
- **Célcsoport választás**: Esemény rögzítés
- **Elemek létrehozása**: Tevékenység követés

### Local Storage Fallback
Ha a Firebase nem érhető el, az alkalmazás automatikusan átvált a localStorage használatára:
- Felhasználói adatok localStorage-ban tárolva
- Ugyanazok a funkciók elérhetők
- Offline működés támogatott

## 🔧 Tesztelés

### Firebase kapcsolat tesztelése
```javascript
// Böngésző konzolban
const firebaseService = new FirebaseService();
const isConnected = await firebaseService.testConnection();
console.log('Firebase connected:', isConnected);
```

### Felhasználói adatok tesztelése
```javascript
// Felhasználói adatok lekérdezése
const userData = await firebaseService.getUserData();
console.log('User data:', userData);

// Célcsoport mentése
const success = await firebaseService.saveUserGroup('student');
console.log('Group saved:', success);

// Sorozatszámláló frissítése
await firebaseService.updateStreak(5);
```

### Elemek tesztelése
```javascript
// Új feladat mentése
const taskId = await firebaseService.saveItem('task', 'Teszt feladat', 'Ez egy teszt feladat');
console.log('Task saved:', taskId);

// Új jegyzet mentése
const noteId = await firebaseService.saveItem('note', 'Teszt jegyzet', 'Ez egy teszt jegyzet');
console.log('Note saved:', noteId);

// Felhasználói elemek lekérdezése
const items = await firebaseService.getUserItems();
console.log('User items:', items);
```

### Analytics tesztelése
```javascript
// Felhasználói tevékenység naplózása
firebaseService.logActivity('tab_switched', { tab: 'dashboard' });

// Kapcsolat állapot lekérdezése
const status = firebaseService.getConnectionStatus();
console.log('Status:', status);
```

## 🚨 Hibaelhárítás

### Gyakori problémák

1. **"Firebase service not available"**
   - Ellenőrizd a Firebase SDK betöltését
   - Ellenőrizd a konfigurációs adatokat

2. **"Firebase connection test failed"**
   - Ellenőrizd az internetkapcsolatot
   - Ellenőrizd a Firebase projekt beállításait
   - Ellenőrizd a biztonsági szabályokat

3. **"Permission denied"**
   - Ellenőrizd a Realtime Database szabályokat
   - Ellenőrizd a felhasználói jogosultságokat

4. **"Analytics error"**
   - Ellenőrizd a Google Analytics beállításokat
   - Ellenőrizd a measurement ID-t

### Debug mód
```javascript
// Firebase debug mód bekapcsolása
localStorage.setItem('firebase_debug', 'true');

// Részletes logok a konzolban
console.log('Firebase config:', firebaseConfig);
console.log('Database reference:', database);
console.log('Analytics:', analytics);
```

### Kapcsolat állapot ellenőrzése
```javascript
// Kapcsolat állapot lekérdezése
const firebaseService = new FirebaseService();
const status = firebaseService.getConnectionStatus();
console.log('Connection status:', status);

// Teszt kapcsolat
const isConnected = await firebaseService.testConnection();
console.log('Test connection:', isConnected);
```

## 📱 Offline támogatás

Az alkalmazás offline módban is működik:

- **Local storage fallback**: Automatikus átváltás
- **Adatok szinkronizálása**: Online állapotban
- **Offline változtatások**: Mentés és szinkronizálás

### Offline tesztelés:
1. **Kapcsold ki az internetet**
2. **Próbálj új elemet menteni** - automatikusan localStorage-ba ment
3. **Kapcsold vissza az internetet**
4. **Frissítsd az oldalt** - adatok betöltődnek

## 🔮 Jövőbeli fejlesztések

### Firebase bővítések:
- [ ] Firebase Authentication
- [ ] Firebase Hosting
- [ ] Firebase Functions
- [ ] Firebase Performance
- [ ] Firebase Crashlytics

### Analytics bővítések:
- [ ] Részletes felhasználói viselkedés követés
- [ ] Teljesítmény metrikák
- [ ] Hibák követése
- [ ] A/B tesztelés

### Biztonsági fejlesztések:
- [ ] Felhasználói autentikáció
- [ ] Szigorúbb adatbázis szabályok
- [ ] Adatok titkosítása
- [ ] GDPR megfelelőség

## 📊 Teljesítmény monitorozás

### Firebase Analytics események:
- `user_group_selected`: Célcsoport választás
- `item_created`: Új elem létrehozása
- `user_activity`: Felhasználói tevékenységek
- `tab_switched`: Tab váltások
- `app_launched`: Alkalmazás indítása

### Teljesítmény metrikák:
- **Betöltési idő**: Firebase kapcsolat
- **Adatátvitel**: Realtime Database
- **Offline működés**: Local storage
- **Felhasználói interakciók**: Analytics

---

**Fontos**: Ez a setup guide a valós Firebase projekt konfigurációját tartalmazza. A projekt teljesen működőképes és készen áll a használatra.

**Projekt URL**: https://console.firebase.google.com/project/donezy-82cdb  
**Utolsó frissítés**: 2024 