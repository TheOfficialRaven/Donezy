# Donezy Demo Útmutató

## 🚀 Gyors indítás

### 1. Egyszerű indítás
```bash
# Nyisd meg az index.html fájlt böngészőben
# Vagy használj egy lokális szervert:
python -m http.server 8000
# Majd menj: http://localhost:8000
```

### 2. Firebase beállítás (opcionális)
```bash
# 1. Kövesd a FIREBASE_SETUP.md útmutatót
# 2. Frissítsd a js/firebase-config.js fájlt
# 3. Teszteld a kapcsolatot
```

## 🎯 Célcsoport-választó tesztelés

### Első belépés tesztelése:
1. **Töröld a localStorage-t** (böngésző konzolban):
   ```javascript
   localStorage.clear();
   ```
2. **Frissítsd az oldalt** - a célcsoport-választó modal megjelenik
3. **Válassz egy célcsoportot** - kattints a kívánt kártyára
4. **Ellenőrizd a mentést** - a modal eltűnik és megjelenik a dashboard

### Célcsoportok tesztelése:
- **Diák** 🎓: Tanulmányi célok és iskolai feladatok
- **Önfejlesztő** 🚀: Személyes fejlődés és készségek
- **Freelancer** 💼: Projektek és ügyfelek kezelése
- **Dolgozó** 👔: Munkahelyi feladatok és karrier célok
- **Rendszerező** 📋: Általános produktivitás és szervezés

### Választás visszavonása:
```javascript
// Töröld a felhasználói csoportot
localStorage.removeItem('donezy_user_group');
// Frissítsd az oldalt - újra megjelenik a választó
```

## 🔥 Firebase Backend tesztelés

### Kapcsolat tesztelése:
```javascript
// Böngésző konzolban
const firebaseService = new FirebaseService();
const isConnected = await firebaseService.testConnection();
console.log('Firebase connected:', isConnected);
```

### Felhasználói adatok tesztelése:
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

### Elemek tesztelése:
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

### Offline mód tesztelése:
1. **Kapcsold ki az internetet**
2. **Próbálj új elemet menteni** - automatikusan localStorage-ba ment
3. **Kapcsold vissza az internetet**
4. **Frissítsd az oldalt** - adatok betöltődnek

## 🧭 Navigációs rendszer tesztelés

### Tab váltás tesztelése:
1. **Dashboard** - Fő áttekintés és gyors műveletek
2. **Eredmények** - Teljesítmény grafikonok és célok
3. **Küldetések** - Napi és heti kihívások
4. **Listák** - Teendők és bevásárlólisták
5. **Jegyzetfüzet** - Jegyzetek írása és kezelése
6. **Naptár** - Események és időbeosztás

### Reszponzív tesztelés:
- **Desktop**: Vízszintes tab sáv
- **Tablet**: Közepes méretű tabok
- **Mobil**: Stackelt tab grid (3x2)

### Programatikus tab váltás:
```javascript
// Tab váltás JavaScript-ből
window.donezyApp.switchTab('missions');

// Aktuális tab lekérdezése
const currentTab = window.donezyApp.getCurrentTab();
console.log('Current tab:', currentTab);
```

## 🎮 Interaktív funkciók tesztelése

### Gyors műveletek (csak Dashboard-on):
1. **Gyors feladat** - Új feladat hozzáadása
2. **Gyors jegyzet** - Új jegyzet írása
3. **Esemény** - Új esemény beírása

### Modal ablakok:
- **Megnyitás**: Kattints a gyors műveletek gombokra
- **Bezárás**: X gomb, Mégse gomb, vagy overlay kattintás
- **Mentés**: Mentés gomb (ellenőrizd a validációt)

### Checkbox funkcionalitás (Listák tab):
- **Bejelölés**: Kattints a checkbox-ra
- **Vizuális visszajelzés**: Áthúzott szöveg
- **Visszavonás**: Ismételt kattintás

### Sorozatszámláló:
- **Növekedés**: Új elem hozzáadásakor
- **Mentés**: Firebase-ba automatikus mentés
- **Betöltés**: Oldal frissítéskor

## 📊 Adatkezelés tesztelése

### Firebase adatstruktúra:
```javascript
// Felhasználói adatok struktúrája
{
  "users": {
    "user_1234567890": {
      "group": "student",
      "level": 1,
      "xp": 150,
      "streak": 3,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastActive": "2024-01-15T15:45:00.000Z",
      "items": {
        "task_1234567890": {
          "id": "task_1234567890",
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

### Adatok exportálása:
```javascript
// Felhasználói adatok exportálása
const userData = await firebaseService.getUserData();
console.log('Export data:', JSON.stringify(userData, null, 2));

// Elemek exportálása
const items = await firebaseService.getUserItems();
console.log('Export items:', JSON.stringify(items, null, 2));
```

### Adatok törlése:
```javascript
// Felhasználói adatok törlése
localStorage.clear();

// Vagy csak a felhasználói csoport törlése
localStorage.removeItem('donezy_user_group');
```

## 🎨 UI/UX tesztelés

### Animációk:
- **Fade-in**: Új tartalom megjelenése
- **Tab indikátor**: Aktív tab alatti vonal
- **Pulse**: Sürgős feladatok pulzálása
- **Modal**: Smooth megjelenés és eltűnés
- **Kártya hover**: Scale és shadow effektek

### Színséma:
- **Fő szín**: Narancssárga (#ff6b35)
- **Háttér**: Sötét kék (#1a1a2e)
- **Kártyák**: Közepes kék (#16213e)
- **Kiemelések**: Világos kék (#0f3460)

### Reszponzív breakpointok:
- **Desktop**: lg+ (1024px+)
- **Tablet**: md (768px-1023px)
- **Mobil**: sm (640px-767px)

## 🔧 Fejlesztői eszközök

### Debug mód:
```javascript
// Firebase debug mód bekapcsolása
localStorage.setItem('firebase_debug', 'true');

// Részletes logok
console.log('Firebase config:', firebaseConfig);
console.log('Database reference:', database);
```

### Teljesítmény monitorozás:
```javascript
// App állapot lekérdezése
console.log('App state:', {
  currentTab: window.donezyApp.getCurrentTab(),
  streakCount: window.donezyApp.getStreakCount(),
  userGroup: window.donezyApp.getUserGroup()
});
```

### Hibakeresés:
```javascript
// Firebase hibák elkapása
try {
  const result = await firebaseService.saveItem('task', 'Test', 'Test');
  console.log('Success:', result);
} catch (error) {
  console.error('Firebase error:', error);
}
```

## 🚨 Hibaelhárítás

### Gyakori problémák:

1. **"Firebase service not available"**
   - Ellenőrizd a Firebase SDK betöltését
   - Ellenőrizd a konfigurációs adatokat

2. **"Firebase connection test failed"**
   - Ellenőrizd az internetkapcsolatot
   - Ellenőrizd a Firebase projekt beállításait

3. **"Célcsoport-választó nem jelenik meg"**
   - Töröld a localStorage-t: `localStorage.clear()`
   - Frissítsd az oldalt

4. **"Navigáció nem működik"**
   - Ellenőrizd a JavaScript konzolt
   - Ellenőrizd a CSS betöltést

5. **"Modal nem záródik be"**
   - Ellenőrizd a JavaScript hibákat
   - Próbáld az ESC billentyűt

### Böngésző kompatibilitás:
- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+

## 📱 Mobil tesztelés

### Responsive design:
- **Viewport meta tag**: Automatikus skálázás
- **Touch-friendly**: Nagyobb érintési területek
- **Stackelt navigáció**: Mobil-optimalizált tab elrendezés

### Mobil böngészők:
- **Safari (iOS)**: Teljes támogatás
- **Chrome (Android)**: Teljes támogatás
- **Firefox Mobile**: Teljes támogatás

## 🔮 Jövőbeli funkciók tesztelése

### Későbbi bővítések:
- [ ] Firebase Authentication
- [ ] URL routing (hash-based)
- [ ] Több téma támogatása
- [ ] Push értesítések
- [ ] Adatok exportálása
- [ ] Csapat funkciók

### Tesztelési terv:
1. **Unit tesztek**: JavaScript funkciók
2. **Integration tesztek**: Firebase integráció
3. **E2E tesztek**: Teljes felhasználói folyamatok
4. **Performance tesztek**: Betöltési idők
5. **Accessibility tesztek**: Akadálymentesítés

---

**Demo verzió**: 3.0.0 (Firebase Backend + Célcsoport-választó)  
**Utolsó frissítés**: 2024 