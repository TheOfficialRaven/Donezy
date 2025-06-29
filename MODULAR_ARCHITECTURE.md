# Donezy Web Application - Modular Architecture

## Áttekintés

A Donezy webalkalmazás mostantól moduláris architektúrát használ, amely karbantarthatóbb és átláthatóbb kódot biztosít. A modulok külön fájlokban vannak definiálva, és minden modul egy specifikus funkcionalitást kezel.

## JavaScript Modulok

### 1. FirebaseService.js
**Helye:** `js/modules/FirebaseService.js`

**Felelősség:** Firebase Realtime Database kezelése
- Felhasználói adatok mentése és betöltése
- Firebase kapcsolat kezelése
- Anonim felhasználó létrehozása
- Adatok szinkronizálása

**Fő metódusok:**
- `init()` - Firebase inicializálása
- `getUserData()` - Felhasználói adatok lekérése
- `saveUserData()` - Felhasználói adatok mentése
- `saveItem()` - Elemek mentése
- `testConnection()` - Kapcsolat tesztelése

### 2. LocalStorageService.js
**Helye:** `js/modules/LocalStorageService.js`

**Felelősség:** Lokális tárolás kezelése (Firebase fallback)
- Ugyanazokat a metódusokat biztosítja, mint a FirebaseService
- Offline működés biztosítása
- Adatok localStorage-ban tárolása

**Fő metódusok:**
- `getUserData()` - Lokális adatok lekérése
- `saveUserData()` - Lokális adatok mentése
- `getUserGroup()` - Felhasználói csoport lekérése
- `saveItem()` - Elemek lokális mentése

### 3. DataService.js
**Helye:** `js/modules/DataService.js`

**Felelősség:** Adatkezelési szolgáltatás factory
- Automatikusan kiválasztja a megfelelő adatkezelési szolgáltatást
- Firebase vagy LocalStorage használata
- Egységes interfész biztosítása

**Fő metódusok:**
- `init()` - Szolgáltatás inicializálása
- `getServiceType()` - Aktuális szolgáltatás típusa
- Proxy metódusok az alárendelt szolgáltatásokhoz

### 4. NotificationService.js
**Helye:** `js/modules/NotificationService.js`

**Felelősség:** Értesítések és üzenetek kezelése
- Sikeres műveletek értesítése
- Hibaüzenetek megjelenítése
- Értesítések sorba állítása
- Betöltési állapotok kezelése

**Fő metódusok:**
- `showNotification()` - Általános értesítés
- `showSuccess()` - Sikeres művelet értesítése
- `showError()` - Hibaüzenet megjelenítése
- `showLoading()` - Betöltési állapot
- `clearAll()` - Összes értesítés törlése

### 5. ModalService.js
**Helye:** `js/modules/ModalService.js`

**Felelősség:** Modal dialógusok kezelése
- Dinamikus modal létrehozása
- Form mezők kezelése
- Eseménykezelés
- Modal életciklus kezelése

**Fő metódusok:**
- `showModal()` - Általános modal megjelenítése
- `showQuickActionModal()` - Gyors művelet modal
- `showConfirmModal()` - Megerősítő modal
- `closeModal()` - Modal bezárása
- `getModalData()` - Modal adatok lekérése

### 6. main.js
**Helye:** `js/main.js`

**Felelősség:** Fő alkalmazás logika
- Modulok koordinálása
- Felhasználói felület kezelése
- Navigáció kezelése
- Alkalmazás életciklus kezelése

**Fő metódusok:**
- `init()` - Alkalmazás inicializálása
- `setupEventListeners()` - Eseménykezelők beállítása
- `switchTab()` - Lapok váltása
- `setupProfileMenu()` - Profil menü kezelése

## CSS Modulok

### 1. base.css
**Helye:** `css/modules/base.css`

**Felelősség:** Alapvető stílusok és CSS változók
- CSS custom properties (változók)
- Reset stílusok
- Alapvető tipográfia
- Form elemek alapstílusai
- Segédeszközök

### 2. components.css
**Helye:** `css/modules/components.css`

**Felelősség:** Újrafelhasználható komponensek
- Gombok (btn, btn-primary, btn-secondary, stb.)
- Kártyák (card, card-header, card-body, stb.)
- Navigáció (nav, nav-link, nav-tab)
- Dropdown menük
- Badge-ek és alert-ek
- Progress bar-ok
- Avatar-ok
- Tooltip-ok

### 3. layout.css
**Helye:** `css/modules/layout.css`

**Felelősség:** Layout és grid rendszer
- Container osztályok
- CSS Grid rendszer
- Flexbox segédeszközök
- Spacing utilities
- Responsive breakpoint-ok
- Width/height utilities

### 4. main.css
**Helye:** `css/main.css`

**Felelősség:** Fő CSS fájl
- Modulok importálása
- Alkalmazás-specifikus stílusok
- Animációk
- Hover effektek
- Responsive beállítások
- Print stílusok
- Accessibility támogatás

## Fájl struktúra

```
to-do-listank/
├── css/
│   ├── main.css                 # Fő CSS fájl
│   ├── styles.css               # Régi CSS (elavult)
│   └── modules/
│       ├── base.css             # Alapvető stílusok
│       ├── components.css       # Komponensek
│       └── layout.css           # Layout rendszer
├── js/
│   ├── main.js                  # Fő JavaScript fájl
│   ├── app.js                   # Régi JavaScript (elavult)
│   ├── firebase-config.js       # Firebase konfiguráció
│   ├── target-audience-selector.js # Célcsoport választó
│   └── modules/
│       ├── FirebaseService.js   # Firebase szolgáltatás
│       ├── LocalStorageService.js # Lokális tárolás
│       ├── DataService.js       # Adatkezelési factory
│       ├── NotificationService.js # Értesítések
│       └── ModalService.js      # Modal kezelés
└── index.html                   # Fő HTML fájl
```

## Modulok betöltési sorrend

### JavaScript modulok sorrendje:
1. `firebase-config.js` - Firebase konfiguráció
2. `FirebaseService.js` - Firebase szolgáltatás
3. `LocalStorageService.js` - Lokális tárolás
4. `DataService.js` - Adatkezelési factory
5. `NotificationService.js` - Értesítések
6. `ModalService.js` - Modal kezelés
7. `target-audience-selector.js` - Célcsoport választó
8. `main.js` - Fő alkalmazás

### CSS modulok sorrendje:
1. `base.css` - Alapvető stílusok
2. `components.css` - Komponensek
3. `layout.css` - Layout rendszer
4. `main.css` - Alkalmazás-specifikus stílusok

## Modulok használata

### JavaScript modulok használata:

```javascript
// DataService használata
const dataService = new DataService();
await dataService.init();

// NotificationService használata
const notificationService = new NotificationService();
notificationService.showSuccess('Sikeres mentés!');

// ModalService használata
const modalService = new ModalService();
modalService.showQuickActionModal('Új feladat', 'task', (data) => {
    console.log('Modal data:', data);
});
```

### CSS osztályok használata:

```html
<!-- Gomb komponens -->
<button class="btn btn-primary">Mentés</button>

<!-- Kártya komponens -->
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Cím</h3>
    </div>
    <div class="card-body">
        Tartalom
    </div>
</div>

<!-- Grid layout -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div class="card">Elem 1</div>
    <div class="card">Elem 2</div>
    <div class="card">Elem 3</div>
</div>
```

## Előnyök

### Karbantarthatóság
- Minden modul egy specifikus felelősséggel rendelkezik
- Könnyű hibakeresés és debugolás
- Modulok függetlenül fejleszthetők

### Újrafelhasználhatóság
- Komponensek más projektekben is használhatók
- CSS osztályok konzisztensek
- JavaScript modulok modulárisak

### Teljesítmény
- CSS modulok optimalizálhatók
- JavaScript modulok lazy loading-kel betölthetők
- Csak a szükséges kód töltődik be

### Fejlesztői élmény
- Tiszta kód struktúra
- Könnyű navigáció a fájlok között
- Jól dokumentált modulok

## Migráció a régi rendszerből

A régi `app.js` és `styles.css` fájlok továbbra is megtalálhatók, de elavultak. Az új moduláris rendszer használata ajánlott.

### Változások:
- `app.js` → `main.js` + modulok
- `styles.css` → `main.css` + CSS modulok
- Moduláris architektúra
- Jobb szeparáció a felelősségek között

## Jövőbeli fejlesztések

### Lehetséges bővítések:
- TypeScript támogatás
- ES6 modulok használata
- Webpack vagy Vite bundler
- Unit tesztek minden modulhoz
- Automatikus dokumentáció generálás

### Optimalizációk:
- CSS kritikus útvonal optimalizálás
- JavaScript code splitting
- Tree shaking
- Minifikáció és tömörítés 