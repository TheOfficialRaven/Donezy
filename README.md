# Donezy - Tanulmányi Központ

Egy játékos, MMORPG-hangulatú produktivitás dashboard, amely a "Tanulmányi Központ" szerepét tölti be, teljes navigációs rendszerrel és Firebase backend integrációval.

## 🎯 Funkciók

### 🧭 Navigációs rendszer:
- **Fix felső navigációs sáv** (navbar) minden oldalon
- **6 fő tab**: Dashboard, Eredmények, Küldetések, Listák, Jegyzetfüzet, Naptár
- **Reszponzív design**: Desktop (vízszintes) és mobil (stackelt) elrendezés
- **Aktív tab kiemelés**: Vizuális visszajelzés az aktuális oldalról
- **Smooth átmenetek**: Animált tab váltások

### 🎯 Célcsoport-választó:
- **Első belépés**: Automatikus modal megjelenés
- **5 célcsoport**: Diák, Önfejlesztő, Freelancer, Dolgozó, Rendszerező
- **Modern UI**: Kártyás elrendezés ikonokkal és leírásokkal
- **Firebase mentés**: Választás automatikus mentése
- **Személyre szabott élmény**: Célcsoportonként különböző funkciók

### 🔥 Firebase Backend:
- **Realtime Database**: Valós idejű adatszinkronizálás
- **Felhasználói adatok**: Célcsoport, szint, XP, sorozatszámláló
- **Elemek kezelés**: Feladatok, jegyzetek, események mentése
- **Offline támogatás**: Local storage fallback
- **Dummy felhasználó**: Tesztelési célokra

### 📊 Főbb komponensek:
- **Dashboard**: Tanulmányi központ áttekintés
- **Eredmények**: Teljesítmény grafikonok és célok
- **🤖 Küldetések**: AI-alapú napi küldetésgeneráló rendszer
- **Listák**: Teendők és bevásárlólisták
- **Jegyzetfüzet**: Jegyzetek írása és kezelése
- **Naptár**: Események és időbeosztás

### 🎮 Interaktív elemek:
- **Gyors műveletek**: Modal ablakok feladat/jegyzet/esemény hozzáadásához
- **Sorozatszámláló**: Automatikusan növekszik új elemek hozzáadásakor
- **Checkbox funkcionalitás**: Listákban a teendők bejelölése
- **Értesítések**: Sikeres műveletek visszajelzése
- **Témaváltó**: Későbbi funkció előkészítve

### 🤖 AI-alapú Küldetések:
- **Automatikus generálás**: Napi küldetések AI-alapú létrehozása
- **Személyre szabás**: Célcsoport és felhasználói adatok alapján
- **Valós progress követés**: Listák, jegyzetek, naptár alapján
- **Dinamikus tartalom**: Felhasználói tevékenységek alapján változó küldetések
- **Kategóriák**: Motivációs, termelékenységi, célcsoportra szabott, dinamikus

### 🔧 PWA Service Worker:
- **Offline támogatás**: Alkalmazás offline használata
- **Intelligens cache**: Statikus fájlok és dinamikus tartalom cache-elése
- **Hibakezelés**: Robusztus cache-elési logika egyedi fájl hibákkal
- **Automatikus frissítések**: Service worker verziókezelés
- **Push értesítések**: Háttérben futó értesítések támogatása

### 🌐 Nyelv és Téma vezérlők:
- **HU gomb**: Nyelv választó (dummy)
- **🎨 Téma**: Témaváltó gomb (dummy)
- **👤 Profil**: Felhasználói profil ikon (dummy)

## 🛠️ Technológia

- **Frontend**: Vanilla JavaScript (ES6+)
- **Stílus**: Tailwind CSS + egyedi CSS
- **Backend**: Firebase Realtime Database
- **Adatkezelés**: Valós idejű szinkronizálás + offline fallback
- **Moduláris architektúra**: Könnyen bővíthető komponensek
- **Reszponzív design**: Minden eszközön tökéletesen működik

## 📁 Projekt struktúra

```
Donezy/
├── index.html                    # Fő HTML fájl navigációs rendszerrel
├── js/
│   ├── app.js                   # Fő JavaScript alkalmazás + navigáció
│   ├── firebase-config.js       # Firebase konfiguráció és szolgáltatás
│   ├── target-audience-selector.js # Célcsoport-választó komponens
│   └── modules/
│       ├── QuestsService.js     # 🤖 AI-alapú küldetésgeneráló rendszer
│       ├── QuestsRenderer.js    # Küldetések UI renderelése
│       ├── DataService.js       # Adatkezelési szolgáltatás
│       ├── ListsService.js      # Listák kezelése
│       ├── NotesService.js      # Jegyzetek kezelése
│       ├── CalendarService.js   # Naptár kezelése
│       └── CurrencyService.js   # XP és Essence kezelése
├── css/
│   └── main.css                 # Egyedi stílusok + navigációs CSS
├── package.json                 # Projekt konfiguráció
├── service-worker.js            # 🔧 PWA Service Worker (cache, offline)
├── manifest.json               # PWA manifest fájl
├── offline.html                # Offline oldal
├── README.md                    # Részletes dokumentáció
├── AI_QUESTS_SYSTEM.md          # 🤖 AI-alapú küldetésrendszer dokumentáció
├── test-ai-quests.html          # AI küldetésrendszer tesztelése
├── test-service-worker.html     # 🔧 Service Worker tesztelése
├── DEMO.md                     # Demo útmutató
└── FIREBASE_SETUP.md           # Firebase beállítási útmutató
```

## 🚀 Használat

### Gyors indítás:
1. **Egyszerű indítás**: Nyisd meg az `index.html` fájlt böngészőben
2. **Lokális szerver**: `python -m http.server 8000` vagy `npm start`
3. **Célcsoport választás**: Első belépéskor válaszd ki a célcsoportodat
4. **Navigáció**: Kattints a tabokra a különböző oldalak között

### Firebase beállítás:
1. **Projekt létrehozás**: Kövesd a `FIREBASE_SETUP.md` útmutatót
2. **Konfiguráció**: Frissítsd a `js/firebase-config.js` fájlt
3. **Tesztelés**: Ellenőrizd a Firebase kapcsolatot

### Navigációs funkciók:
- **Tab váltás**: Kattints bármelyik tabra a tartalom váltásához
- **Mobil reszponzív**: Kisebb képernyőkön automatikusan stackelt elrendezés
- **Aktív tab jelzés**: Az aktuális tab kiemelve van
- **Smooth átmenetek**: Animált tartalom váltások

## 🎨 Téma és stílus

### Színséma:
- **Fő szín**: Narancssárga (`#ff6b35`)
- **Háttér**: Sötét kék (`#1a1a2e`)
- **Kártyák**: Közepes kék (`#16213e`)
- **Kiemelések**: Világos kék (`#0f3460`)

### Design jellemzők:
- **Fix navigációs sáv**: Mindig látható a képernyő tetején
- **Kártya alapú elrendezés**: Lekerekített sarkok, árnyékok
- **Modern animációk**: Hover effektek, fade-in, pulse animációk
- **MMORPG hangulat**: Játékos ikonok és színséma
- **Tab indikátorok**: Vizuális visszajelzés az aktív tabról
- **Célcsoport kártyák**: Interaktív választási felület

## 🔧 Fejlesztői információk

### Service Worker Hibaelhárítás:
- **Cache hiba**: Ha "Failed to execute 'addAll' on 'Cache'" hibát látsz, ellenőrizd a fájl elérési útjakat
- **Verzió frissítés**: A service worker automatikusan frissül, de manuálisan is törölheted a cache-t
- **Offline teszt**: Használd a `test-service-worker.html` fájlt a service worker tesztelésére
- **Fájl hiány**: Ellenőrizd, hogy minden fájl létezik a STATIC_FILES listában
- **Cache törlés**: `clearAllCaches()` funkció a teszt oldalon

### JavaScript osztályok:
- `DonezyApp`: Fő alkalmazás osztály navigációs rendszerrel
- `FirebaseService`: Firebase adatkezelés és kapcsolat
- `TargetAudienceSelector`: Célcsoport-választó komponens
- `QuestsService`: 🤖 AI-alapú küldetésgeneráló rendszer
- `QuestsRenderer`: ⚔️ Küldetések tab teljes UI renderelése
- `DataService`: Adatkezelési szolgáltatás
- `ListsService`: Listák kezelése
- `NotesService`: Jegyzetek kezelése
- `CalendarService`: Naptár kezelése
- `CurrencyService`: XP és Essence kezelése
- `LevelSystem`: Szint és badge rendszer
- `setupNavigation()`: Navigációs tab kezelés
- `switchTab()`: Tab váltás logika
- `updatePageTitle()`: Oldal cím frissítés

### Firebase integráció:
```javascript
// Firebase szolgáltatás inicializálása
const firebaseService = new FirebaseService();

// Felhasználói adatok mentése
await firebaseService.saveUserGroup('student');

// Elemek mentése
const itemId = await firebaseService.saveItem('task', 'Cím', 'Leírás');

// Adatok lekérdezése
const userData = await firebaseService.getUserData();
```

### Célcsoport-választó:
```javascript
// Célcsoport-választó inicializálása
const selector = new TargetAudienceSelector();
await selector.init(firebaseService);

// Célcsoport információk
const groupInfo = selector.getGroupInfo('student');
const allGroups = selector.getAllGroups();
```

### 🤖 AI-alapú Küldetések:
```javascript
// QuestsService inicializálása
await window.QuestsService.init();

// Napi küldetések generálása
const quests = await window.QuestsService.generateDailyQuests();

// Küldetések lekérése
const dailyQuests = window.QuestsService.getDailyQuests();

// Progress frissítés
await window.QuestsService.updateQuestProgressAutomatically();

// Küldetés teljesítése
await window.QuestsService.completeQuest(questId, 'daily');
```

### 🔧 Service Worker Tesztelés:
```javascript
// Service Worker regisztráció ellenőrzése
const registration = await navigator.serviceWorker.getRegistration();
const isActive = registration.active !== null;

// Cache állapot lekérdezése
const cacheNames = await caches.keys();
const cache = await caches.open('donezy-static-v1.0.1');

// Offline mód tesztelése
const response = await caches.match('/index.html');
const isCached = !!response;

// Teszt oldal: test-service-worker.html
```

### ⚔️ Küldetések Tab:
```javascript
// QuestsRenderer inicializálása
await window.QuestsRenderer.init();

// Szűrő beállítása
window.QuestsRenderer.setFilter('active');

// Küldetések betöltése és renderelése
await window.QuestsRenderer.loadAndRenderQuests();

// AI küldetések generálása
await window.QuestsRenderer.generateAIQuests();
```

### Navigációs rendszer:
```javascript
// Tab váltás programatikusan
window.donezyApp.switchTab('missions');

// Aktuális tab lekérdezése
const currentTab = window.donezyApp.getCurrentTab();

// Sorozatszámláló lekérdezése
const streak = window.donezyApp.getStreakCount();

// Felhasználói csoport lekérdezése
const userGroup = window.donezyApp.getUserGroup();
```

### Későbbi bővítések:
- Firebase Authentication integráció
- Több téma támogatása
- Felhasználói profilok
- Adatok exportálása
- Push értesítések
- URL routing (hash-based)
- Breadcrumb navigáció
- Célcsoportonkénti modulok

### 🤖 AI Küldetésrendszer Fejlesztések:
- **Nehézségi szintek**: Könnyű, közepes, nehéz küldetések
- **Szakmai küldetések**: Tantárgyi, projekt-specifikus
- **Csapat küldetések**: Több felhasználós kihívások
- **Időzített küldetések**: Heti, havi, év végi célok
- **AI tanulás**: Felhasználói preferenciák alapján optimalizálás
- **Küldetés konfiguráció**: Testreszabható jutalmak és kategóriák

### ⚔️ Küldetések Tab Fejlesztések:
- **Részletes statisztikák**: Küldetés teljesítési arányok
- **Küldetés történet**: Előző napok küldetései
- **Küldetés exportálás**: PDF vagy CSV formátumban
- **Küldetés megosztás**: Küldetések megosztása másokkal
- **Küldetés értékelés**: Felhasználói visszajelzés küldetésekről
- **Küldetés keresés**: Szöveges keresés küldetésekben

## 📱 Reszponzív design

### Desktop (lg+):
- **Navigáció**: Vízszintes tab sáv
- **Tartalom**: Teljes szélesség kihasználása
- **Grid**: 3 oszlopos elrendezés
- **Célcsoport-választó**: 3 oszlopos kártya grid

### Tablet (md):
- **Navigáció**: Vízszintes tab sáv (kisebb betűméret)
- **Tartalom**: Közepes szélesség
- **Grid**: 2 oszlopos elrendezés
- **Célcsoport-választó**: 2 oszlopos kártya grid

### Mobil (sm):
- **Navigáció**: Stackelt tab grid (3x2)
- **Tartalom**: Teljes szélesség
- **Grid**: 1 oszlopos elrendezés
- **Célcsoport-választó**: 1 oszlopos kártya grid

## 🎮 Interaktív elemek

### Navigációs funkciók:
- **Tab kattintás**: Tartalom váltás
- **Hover effektek**: Vizuális visszajelzés
- **Aktív állapot**: Kiemelt tab megjelenítés
- **Mobil tap**: Touch-friendly interakciók

### Célcsoport-választó:
- **Kártya kiválasztás**: Kattintás a kívánt csoportra
- **Vizuális visszajelzés**: Kiemelt kártya megjelenítés
- **Mentés**: Automatikus Firebase mentés
- **Sikeres értesítés**: Választás visszajelzése

### Tartalom funkciók:
- **Gyors műveletek**: Modal ablakok (csak Dashboard-on)
- **Checkbox kezelés**: Listákban automatikus stílusváltás
- **Sorozatszámláló**: Dinamikus frissítés
- **Értesítések**: Toast üzenetek

### Animációk:
- **Fade-in**: Új tartalom megjelenése
- **Tab indikátor**: Aktív tab alatti vonal animáció
- **Pulse**: Sürgős feladatok pulzálása
- **Modal**: Smooth megjelenés és eltűnés
- **Kártya hover**: Scale és shadow effektek

## 🔮 Jövőbeli fejlesztések

### Navigációs bővítések:
- [ ] URL routing (hash-based)
- [ ] Breadcrumb navigáció
- [ ] Tab history (vissza/előre gombok)
- [ ] Tab drag & drop sorrend
- [ ] Tab bezárás funkció

### Firebase bővítések:
- [ ] Firebase Authentication
- [ ] Firebase Hosting
- [ ] Firebase Functions
- [ ] Firebase Analytics
- [ ] Firebase Performance

### Funkcionális bővítések:
- [ ] Célcsoportonkénti modulok
- [ ] Felhasználói bejelentkezés
- [ ] Adatok szinkronizálása
- [ ] Több téma támogatása
- [ ] Push értesítések
- [ ] Adatok exportálása
- [ ] Csapat funkciók
- [ ] Teljesítmény statisztikák

### UI/UX fejlesztések:
- [ ] Dark/Light téma váltás
- [ ] Animált háttér effektek
- [ ] Drag & drop funkcionalitás
- [ ] Keyboard shortcuts
- [ ] Accessibility fejlesztések

## 📊 Teljesítmény

### Optimalizációk:
- **Lazy loading**: Tartalom csak szükség esetén töltődik
- **CSS animációk**: GPU gyorsított átmenetek
- **Minimális JavaScript**: Hatékony kód struktúra
- **Tailwind CSS**: Optimalizált stílusok
- **Firebase caching**: Offline adatok gyorsítása

### Méretek:
- **HTML**: ~15KB (navigációval)
- **CSS**: ~8KB (navigációs stílusokkal)
- **JavaScript**: ~20KB (navigációs logikával + Firebase)
- **Firebase SDK**: ~50KB (CDN)
- **Összesen**: ~93KB

## 🐛 Hibaelhárítás

### Navigációs problémák:
1. **Tab nem vált**: Ellenőrizd a JavaScript konzolt
2. **Mobil navigáció nem működik**: Ellenőrizd a viewport meta tag-et
3. **Aktív tab nem látszik**: Ellenőrizd a CSS betöltést
4. **Animációk nem működnek**: Ellenőrizd a CSS animációk támogatását

### Firebase problémák:
1. **Kapcsolat hiba**: Ellenőrizd a Firebase konfigurációt
2. **Adatok nem mentődnek**: Ellenőrizd a biztonsági szabályokat
3. **Offline mód**: Local storage automatikus fallback

### Célcsoport-választó problémák:
1. **Modal nem jelenik meg**: Ellenőrizd a Firebase kapcsolatot
2. **Választás nem mentődik**: Ellenőrizd a konzol hibákat
3. **UI nem frissül**: Ellenőrizd a CSS betöltést

### Böngésző támogatás:
- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+

---

**Fejlesztő**: Donezy Team  
**Verzió**: 3.0.0 (Firebase Backend + Célcsoport-választó)  
**Utolsó frissítés**: 2024 