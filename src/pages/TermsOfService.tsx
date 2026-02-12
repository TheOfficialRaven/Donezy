import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-0 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Vissza
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center glow-primary">
            <FileText className="h-7 w-7 text-surface-0" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
            Felhasználási feltételek
          </h1>
          <p className="text-text-secondary">
            Hatályos: 2025. január 1-től
          </p>
        </motion.div>

        <div className="space-y-5">
          {/* 1. Általános rendelkezések */}
          <Section title="1. Általános rendelkezések">
            <p>
              Jelen Felhasználási feltételek (a továbbiakban: „Feltételek") szabályozzák a
              Donezy alkalmazás (a továbbiakban: „Szolgáltatás") használatát. A Szolgáltatás
              üzemeltetője a Donezy fejlesztői csapata (a továbbiakban: „Szolgáltató").
            </p>
            <p>
              A Szolgáltatás használatával, illetve a fiók létrehozásával a Felhasználó
              kijelenti, hogy a jelen Feltételeket megismerte és elfogadja. Amennyiben nem ért
              egyet a Feltételekkel, kérjük, ne használja a Szolgáltatást.
            </p>
          </Section>

          {/* 2. A Szolgáltatás leírása */}
          <Section title="2. A Szolgáltatás leírása">
            <p>
              A Donezy egy gamifikált produktivitás-menedzsment webalkalmazás, amely az alábbi
              funkciókat nyújtja:
            </p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary mt-2">
              <li>Személyre szabott napi és heti küldetések generálása</li>
              <li>Feladatlisták létrehozása és kezelése</li>
              <li>Jegyzetelés és dokumentumkezelés</li>
              <li>Naptári események kezelése</li>
              <li>Gamifikációs rendszer: szintlépés, tapasztalati pontok (XP), Essence (virtuális pénznem), sorozat (streak), eredmények</li>
              <li>Célcsoport-alapú és érdeklődés-alapú személyre szabás</li>
              <li>Statisztikák és haladás nyomon követése</li>
            </ul>
            <p className="mt-2">
              A Szolgáltatás jelenleg ingyenesen elérhető. A Szolgáltató fenntartja a jogot
              fizetős funkciók bevezetésére a jövőben, erről a Felhasználókat előzetesen
              tájékoztatja.
            </p>
          </Section>

          {/* 3. Regisztráció és fiók */}
          <Section title="3. Regisztráció és fiókkezelés">
            <SubSection title="3.1. Fiók létrehozás">
              <p>
                A Szolgáltatás használatához fiók létrehozása szükséges. A regisztráció
                email cím és jelszó megadásával, vagy Google fiókkal történő bejelentkezéssel
                lehetséges.
              </p>
            </SubSection>

            <SubSection title="3.2. Email megerősítés">
              <p>
                Az email címmel történő regisztráció esetén a Felhasználónak meg kell erősítenie
                email címét a megadott címre küldött megerősítő link segítségével. A Szolgáltatás
                teljes funkcionalitása csak megerősített email cím esetén érhető el.
              </p>
            </SubSection>

            <SubSection title="3.3. Fiókbiztonság">
              <p>
                A Felhasználó felelős a fiókjához tartozó bejelentkezési adatok biztonságos
                kezeléséért. A Felhasználó köteles haladéktalanul értesíteni a Szolgáltatót,
                ha fiókjához illetéktelen hozzáférést észlel.
              </p>
            </SubSection>

            <SubSection title="3.4. Fiók törlés">
              <p>
                A Felhasználó bármikor törölheti fiókját a Beállítások menüben. A fiók törlése
                végleges és visszavonhatatlan; a fiókhoz tartozó összes adat (beleértve a
                küldetéseket, jegyzeteket, listákat, statisztikákat és eredményeket) véglegesen
                törlésre kerül.
              </p>
            </SubSection>
          </Section>

          {/* 4. Felhasználói kötelezettségek */}
          <Section title="4. Felhasználói kötelezettségek">
            <p>A Felhasználó kötelezettséget vállal arra, hogy:</p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary mt-2">
              <li>Valós és pontos adatokat ad meg a regisztráció és az onboarding során</li>
              <li>Nem próbálja meg jogosulatlanul hozzáférni más Felhasználók fiókjaihoz vagy adataihoz</li>
              <li>Nem kísérli meg a Szolgáltatás rendszerének feltörését, megkerülését vagy manipulálását</li>
              <li>Nem használja a Szolgáltatást jogellenes tevékenységre</li>
              <li>Nem tölt fel kifogásolható, jogellenes vagy harmadik fél jogait sértő tartalmat</li>
              <li>Nem próbálja meg a gamifikációs rendszert (XP, Essence, szint, sorozat) tisztességtelen módon manipulálni</li>
              <li>Betartja a jelen Feltételeket és a vonatkozó jogszabályokat</li>
            </ul>
          </Section>

          {/* 5. Szellemi tulajdon */}
          <Section title="5. Szellemi tulajdon">
            <SubSection title="5.1. Szolgáltató szellemi tulajdona">
              <p>
                A Szolgáltatás teljes tartalma, beleértve, de nem kizárólagosan a szoftvert,
                grafikai elemeket, ikonokat, logókat, szövegeket, arculati elemeket, a
                gamifikációs rendszert és a küldetések szövegeit, a Szolgáltató szellemi
                tulajdonát képezik, és szerzői jogi védelem alatt állnak.
              </p>
            </SubSection>

            <SubSection title="5.2. Felhasználói tartalom">
              <p>
                A Felhasználó által létrehozott tartalom (jegyzetek, feladatlisták, naptári
                események) a Felhasználó szellemi tulajdona marad. A Felhasználó a tartalom
                feltöltésével a Szolgáltatónak nem kizárólagos, díjmentes felhasználási jogot
                biztosít a tartalom tárolására és megjelenítésére a Szolgáltatás működtetéséhez
                szükséges mértékben.
              </p>
            </SubSection>
          </Section>

          {/* 6. Virtuális javak */}
          <Section title="6. Virtuális javak">
            <p>
              A Szolgáltatás az alábbi virtuális javakat alkalmazza a gamifikációs rendszer
              részeként:
            </p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary mt-2">
              <li>
                <strong className="text-text-primary">Tapasztalati pontok (XP):</strong> a felhasználói
                tevékenység alapján szerzett pontok, amelyek a szintlépést szolgálják
              </li>
              <li>
                <strong className="text-text-primary">Essence:</strong> virtuális pénznem, amely
                a küldetések és feladatok teljesítéséért jár
              </li>
              <li>
                <strong className="text-text-primary">Szint:</strong> a Felhasználó haladását jelző
                numerikus érték
              </li>
              <li>
                <strong className="text-text-primary">Sorozat (Streak):</strong> az egymást követő
                aktív napok száma
              </li>
            </ul>
            <p className="mt-2">
              <strong className="text-text-primary">Fontos:</strong> A virtuális javak (XP, Essence,
              szint, sorozat) kizárólag az alkalmazáson belüli funkciókhoz kapcsolódnak, semmilyen
              valós pénzbeli értékkel nem rendelkeznek, nem válthatók valós pénzre, és nem
              ruházhatók át. A Szolgáltató fenntartja a jogot a virtuális javak rendszerének
              módosítására.
            </p>
          </Section>

          {/* 7. Szolgáltatás elérhetősége */}
          <Section title="7. A Szolgáltatás elérhetősége és módosítása">
            <p>
              A Szolgáltató törekszik a Szolgáltatás folyamatos elérhetőségére, azonban nem
              garantálja a megszakítás nélküli működést. A Szolgáltató fenntartja a jogot:
            </p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary mt-2">
              <li>A Szolgáltatás funkcióinak módosítására, bővítésére vagy korlátozására</li>
              <li>Karbantartási célú leállásokra (lehetőség szerint előzetes értesítés mellett)</li>
              <li>A Szolgáltatás végleges megszüntetésére, legalább 30 napos előzetes értesítés mellett</li>
              <li>A Felhasználói felület, a gamifikációs rendszer és a küldetések rendszerének módosítására</li>
            </ul>
          </Section>

          {/* 8. Felelősség korlátozása */}
          <Section title="8. Felelősség korlátozása">
            <p>
              A Szolgáltatás „jelenlegi állapotában" („as is") kerül nyújtásra, kifejezett vagy
              hallgatólagos garanciák nélkül. A Szolgáltató nem vállal felelősséget:
            </p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary mt-2">
              <li>A Szolgáltatás esetleges hibáiból vagy megszakításából eredő károkért</li>
              <li>A Felhasználó által megadott adatok pontosságáért</li>
              <li>A Felhasználó által létrehozott tartalom elvesztéséért, amennyiben az a Felhasználó tevékenységéből ered</li>
              <li>Harmadik felek (pl. Firebase, Google) szolgáltatásainak hibáiért vagy kieséseiért</li>
              <li>A Felhasználó fiókjának jogosulatlan használatából eredő károkért, amennyiben az a Felhasználó gondatlanságából ered</li>
              <li>A gamifikációs rendszer (XP, szint, Essence, sorozat) esetleges visszaállításából vagy módosításából eredő „veszteségekért"</li>
            </ul>
            <p className="mt-2">
              A Szolgáltató felelőssége – a jogszabályok által megengedett mértékben –
              minden esetben a Felhasználó által a Szolgáltatásért fizetett összegre korlátozódik
              (ingyenes szolgáltatás esetén ez nulla).
            </p>
          </Section>

          {/* 9. Felhasználási jog megszüntetése */}
          <Section title="9. Felhasználási jog megszüntetése">
            <SubSection title="9.1. Felhasználó általi felmondás">
              <p>
                A Felhasználó bármikor, indokolás nélkül megszüntetheti fiókját a Beállítások
                menüben elérhető „Fiók törlése" funkció segítségével.
              </p>
            </SubSection>

            <SubSection title="9.2. Szolgáltató általi felmondás">
              <p>A Szolgáltató jogosult a Felhasználó fiókjának felfüggesztésére vagy törlésére, amennyiben:</p>
              <ul className="list-disc list-inside space-y-1 text-text-secondary mt-1">
                <li>A Felhasználó megsérti a jelen Feltételeket</li>
                <li>A Felhasználó jogellenes tevékenységet folytat a Szolgáltatáson keresztül</li>
                <li>A Felhasználó rendszeresen megkísérli a gamifikációs rendszer manipulálását</li>
                <li>A Felhasználó fiókja 12 hónapnál hosszabb ideig inaktív</li>
              </ul>
            </SubSection>

            <SubSection title="9.3. Felmondás jogkövetkezményei">
              <p>
                A fiók törlése (akár a Felhasználó, akár a Szolgáltató által) a fiókhoz
                tartozó összes adat végleges törlését eredményezi, az Adatvédelmi irányelvekben
                foglaltak szerint.
              </p>
            </SubSection>
          </Section>

          {/* 10. Kártalanítás */}
          <Section title="10. Kártalanítás">
            <p>
              A Felhasználó vállalja, hogy kártalanítja a Szolgáltatót minden olyan kár,
              veszteség és költség tekintetében, amely a Felhasználó jelen Feltételek
              megsértéséből, jogellenes tevékenységéből vagy harmadik felek jogainak
              megsértéséből ered.
            </p>
          </Section>

          {/* 11. Alkalmazandó jog */}
          <Section title="11. Alkalmazandó jog és vitarendezés">
            <p>
              A jelen Feltételekre a <strong className="text-text-primary">magyar jog</strong> az
              irányadó, különös tekintettel a Polgári Törvénykönyvről szóló 2013. évi V. törvény,
              az elektronikus kereskedelmi szolgáltatások egyes kérdéseiről szóló 2001. évi
              CVIII. törvény, valamint a fogyasztóvédelemről szóló 1997. évi CLV. törvény
              rendelkezéseire.
            </p>
            <p className="mt-2">
              Vitás kérdések esetén a felek elsősorban békés úton történő rendezésre törekednek.
              Amennyiben ez nem vezet eredményre, a jogviták elbírálására a magyar bíróságok
              rendelkeznek kizárólagos illetékességgel.
            </p>
            <p className="mt-2">
              A Felhasználó fogyasztói panaszaival fordulhat:
            </p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary mt-1">
              <li>
                <strong className="text-text-primary">Szolgáltatóhoz:</strong>{' '}
                <span className="text-primary">donezy@support.com</span>
              </li>
              <li>
                <strong className="text-text-primary">Budapesti Békéltető Testülethez:</strong>{' '}
                1016 Budapest, Krisztina krt. 99., email: bekelteto.testulet@bkik.hu
              </li>
              <li>
                <strong className="text-text-primary">Online vitarendezési platformhoz:</strong>{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  ec.europa.eu/consumers/odr
                </a>
              </li>
            </ul>
          </Section>

          {/* 12. Egyéb rendelkezések */}
          <Section title="12. Egyéb rendelkezések">
            <SubSection title="12.1. Elválaszthatóság">
              <p>
                Amennyiben a jelen Feltételek bármely rendelkezése érvénytelennek vagy
                végrehajthatatlannak minősül, az nem érinti a többi rendelkezés érvényességét.
                Az érvénytelen rendelkezés helyébe olyan rendelkezés lép, amely leginkább
                megfelel az eredeti rendelkezés céljának.
              </p>
            </SubSection>

            <SubSection title="12.2. Teljes megállapodás">
              <p>
                A jelen Feltételek, az Adatvédelmi irányelvekkel együtt, a Felhasználó és a
                Szolgáltató között a Szolgáltatás használatára vonatkozó teljes megállapodást
                képezik, és felváltanak minden korábbi szóbeli vagy írásbeli megállapodást.
              </p>
            </SubSection>

            <SubSection title="12.3. Joglemondás">
              <p>
                A Szolgáltató bármely jogának nem érvényesítése nem jelenti az adott jogról
                való lemondást, és nem akadályozza a jog jövőbeni érvényesítését.
              </p>
            </SubSection>
          </Section>

          {/* 13. Feltételek módosítása */}
          <Section title="13. A Feltételek módosítása">
            <p>
              A Szolgáltató fenntartja a jogot a jelen Feltételek módosítására. A
              módosításokról a Felhasználókat az alkalmazáson belüli értesítéssel, illetve
              a módosított Feltételek közzétételével tájékoztatjuk. A lényeges módosításokról
              legalább 15 nappal a hatályba lépés előtt értesítjük a Felhasználókat.
            </p>
            <p className="mt-2">
              A módosított Feltételek hatályba lépése után a Szolgáltatás további használata
              a módosított Feltételek elfogadásának minősül. Amennyiben a Felhasználó nem ért
              egyet a módosított Feltételekkel, jogosult fiókja törlésére.
            </p>
          </Section>

          {/* 14. Kapcsolat */}
          <Section title="14. Kapcsolat">
            <p>
              A Feltételekkel kapcsolatos kérdéseivel forduljon hozzánk:
            </p>
            <div className="mt-2 p-4 rounded-lg bg-surface-1/50 border border-white/10">
              <p className="text-text-primary font-medium">Donezy – Ügyfélszolgálat</p>
              <p className="text-text-secondary mt-1">Email: <span className="text-primary">donezy@support.com</span></p>
            </div>
          </Section>
        </div>

        <div className="text-center py-6 text-sm text-text-muted">
          <p>Utolsó frissítés: 2025. január 1.</p>
        </div>
      </div>
    </div>
  );
}

// ── Helper components ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass p-6">
        <h2 className="text-lg font-heading font-semibold text-text-primary mb-3">{title}</h2>
        <div className="space-y-2 text-sm text-text-secondary leading-relaxed">{children}</div>
      </Card>
    </motion.div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="text-sm font-semibold text-text-primary mb-1.5">{title}</h3>
      {children}
    </div>
  );
}
