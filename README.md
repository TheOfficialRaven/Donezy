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
- **Küldetések**: Napi és heti kihívások
- **Listák**: Teendők és bevásárlólisták
- **Jegyzetfüzet**: Jegyzetek írása és kezelése
- **Naptár**: Események és időbeosztás

### 🎮 Interaktív elemek:
- **Gyors műveletek**: Modal ablakok feladat/jegyzet/esemény hozzáadásához
- **Sorozatszámláló**: Automatikusan növekszik új elemek hozzáadásakor
- **Checkbox funkcionalitás**: Listákban a teendők bejelölése
- **Értesítések**: Sikeres műveletek visszajelzése
- **Témaváltó**: Későbbi funkció előkészítve

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
to-do-listank/
├── index.html                    # Fő HTML fájl navigációs rendszerrel
├── js/
│   ├── app.js                   # Fő JavaScript alkalmazás + navigáció
│   ├── firebase-config.js       # Firebase konfiguráció és szolgáltatás
│   └── target-audience-selector.js # Célcsoport-választó komponens
├── css/
│   └── styles.css               # Egyedi stílusok + navigációs CSS
├── package.json                 # Projekt konfiguráció
├── README.md                    # Részletes dokumentáció
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

### JavaScript osztályok:
- `DonezyApp`: Fő alkalmazás osztály navigációs rendszerrel
- `FirebaseService`: Firebase adatkezelés és kapcsolat
- `TargetAudienceSelector`: Célcsoport-választó komponens
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

### Navigációs rendszer:
```javascript
// Tab váltás programatikusan
window.donezyApp.switchTab('results');

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