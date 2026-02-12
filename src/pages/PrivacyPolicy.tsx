import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PrivacyPolicy() {
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
            <Shield className="h-7 w-7 text-surface-0" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
            Adatvédelmi irányelvek
          </h1>
          <p className="text-text-secondary">
            Hatályos: 2025. január 1-től
          </p>
        </motion.div>

        <div className="space-y-5">
          {/* 1. Adatkezelő */}
          <Section title="1. Adatkezelő">
            <p>
              A Donezy alkalmazás (a továbbiakban: „Szolgáltatás") üzemeltetője és adatkezelője
              (a továbbiakban: „Adatkezelő") a Donezy fejlesztői csapata.
            </p>
            <p>
              Kapcsolattartási email: <strong className="text-primary">donezy@support.com</strong>
            </p>
            <p>
              Az Adatkezelő a jelen Adatvédelmi irányelvekben foglaltak szerint kezeli a Felhasználók
              személyes adatait az Európai Unió Általános Adatvédelmi Rendelete (GDPR – 2016/679/EU rendelet),
              valamint a magyar információs önrendelkezési jogról és az információszabadságról szóló
              2011. évi CXII. törvény (Infotv.) rendelkezéseinek megfelelően.
            </p>
          </Section>

          {/* 2. Gyűjtött adatok */}
          <Section title="2. Gyűjtött személyes adatok">
            <p>A Szolgáltatás használata során az alábbi személyes adatokat gyűjtjük és kezeljük:</p>

            <SubSection title="2.1. Regisztrációs és fiókadatok">
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li>Teljes név (megjelenítendő név)</li>
                <li>Email cím</li>
                <li>Jelszó (kizárólag hash-elt formában, a Firebase Authentication által titkosítva)</li>
                <li>Google fiók adatok Google-lal történő regisztráció esetén (név, email cím, profilkép URL)</li>
                <li>Regisztráció dátuma</li>
              </ul>
            </SubSection>

            <SubSection title="2.2. Profil- és beállítási adatok">
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li>Kiválasztott célcsoport (persona típus)</li>
                <li>Onboarding kérdőív válaszai: érdeklődési körök, fő kihívás, küldetés gyakoriság, preferált aktív időszak, lakóhelyzet</li>
                <li>Értesítési és megjelenítési beállítások</li>
              </ul>
            </SubSection>

            <SubSection title="2.3. Felhasználói tartalom">
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li>Küldetések (generált és teljesített küldetések, státusz, haladás)</li>
                <li>Feladatlisták és azok elemei</li>
                <li>Jegyzetek (cím, tartalom, mappák, címkék)</li>
                <li>Naptári események (cím, leírás, időpont, kategória)</li>
                <li>Eredmények és feloldott jutalmak</li>
              </ul>
            </SubSection>

            <SubSection title="2.4. Statisztikai adatok">
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li>Felhasználói szint és tapasztalati pontok (XP)</li>
                <li>Essence (virtuális pénznem) egyenleg</li>
                <li>Napi aktivitási sorozat (streak)</li>
                <li>Teljesített küldetések és feladatok száma</li>
                <li>Utolsó aktív dátum</li>
              </ul>
            </SubSection>

            <SubSection title="2.5. Automatikusan gyűjtött technikai adatok">
              <p>
                A Szolgáltatás nem gyűjt automatikusan böngészőazonosítót, IP-címet vagy
                eszközadatokat. A Firebase infrastruktúra naplófájljai tartalmazhatnak
                technikai adatokat a Google adatvédelmi irányelveinek megfelelően.
              </p>
            </SubSection>
          </Section>

          {/* 3. Jogalap */}
          <Section title="3. Az adatkezelés jogalapja">
            <p>
              Az adatkezelés az alábbi jogalapokon történik a GDPR 6. cikk (1) bekezdése szerint:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary mt-2">
              <li>
                <strong className="text-text-primary">Szerződés teljesítése (6. cikk (1) bek. b) pont):</strong>{' '}
                A regisztrációs, profil- és tartalmi adatok kezelése a Szolgáltatás nyújtásához szükséges.
                A fiók létrehozásával a Felhasználó elfogadja a Felhasználási feltételeket, amely szerződésnek minősül.
              </li>
              <li>
                <strong className="text-text-primary">Hozzájárulás (6. cikk (1) bek. a) pont):</strong>{' '}
                Az onboarding kérdőív válaszainak gyűjtése a személyre szabott élmény biztosítása
                érdekében, a Felhasználó önkéntes hozzájárulása alapján történik. A hozzájárulás
                bármikor visszavonható.
              </li>
              <li>
                <strong className="text-text-primary">Jogos érdek (6. cikk (1) bek. f) pont):</strong>{' '}
                A statisztikai adatok gyűjtése a Szolgáltatás fejlesztése és a felhasználói élmény
                javítása érdekében történik.
              </li>
            </ul>
          </Section>

          {/* 4. Adatkezelés célja */}
          <Section title="4. Az adatkezelés célja">
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>A Szolgáltatás működtetése és a felhasználói fiók kezelése</li>
              <li>Személyre szabott küldetések, tartalom és funkciók biztosítása</li>
              <li>Felhasználói haladás, statisztikák és eredmények nyomon követése</li>
              <li>A gamifikációs rendszer (szint, XP, Essence, sorozat) működtetése</li>
              <li>Értesítések és emlékeztetők küldése (a Felhasználó beállításai szerint)</li>
              <li>A Szolgáltatás fejlesztése, hibajavítás</li>
              <li>Felhasználói kommunikáció (email megerősítés, jelszó visszaállítás)</li>
            </ul>
          </Section>

          {/* 5. Adattárolás */}
          <Section title="5. Adattárolás és biztonság">
            <p>
              A személyes adatok a <strong className="text-text-primary">Google Firebase</strong> infrastruktúráján
              kerülnek tárolásra:
            </p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary mt-2">
              <li>
                <strong className="text-text-primary">Firebase Authentication:</strong> a felhasználói
                hitelesítési adatok (email, jelszó hash, Google OAuth tokenek) kezelése
              </li>
              <li>
                <strong className="text-text-primary">Firebase Realtime Database:</strong> a felhasználói
                tartalom, beállítások, statisztikák és preferenciák tárolása
              </li>
            </ul>
            <p className="mt-2">
              A Firebase szerverek az Európai Unió területén és/vagy az Egyesült Államokban
              találhatók. Az EU-n kívüli adattovábbítás esetén a Google a GDPR által előírt
              megfelelő garanciákat biztosítja (Standard Contractual Clauses – SCC).
            </p>
            <p className="mt-2">
              A Google Firebase biztonsági intézkedéseiről bővebben:{' '}
              <a
                href="https://firebase.google.com/support/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                firebase.google.com/support/privacy
              </a>
            </p>
          </Section>

          {/* 6. Adatmegőrzés */}
          <Section title="6. Adatmegőrzési időtartam">
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>
                <strong className="text-text-primary">Fiókadatok és tartalom:</strong> a Felhasználó
                fiókjának fennállása alatt, illetve a fiók törléséig
              </li>
              <li>
                <strong className="text-text-primary">Fiók törlése esetén:</strong> az összes személyes
                adat (profil, tartalom, statisztikák, preferenciák) haladéktalanul, de legkésőbb
                30 napon belül véglegesen törlésre kerül a Firebase adatbázisból és az
                Authentication rendszerből
              </li>
              <li>
                <strong className="text-text-primary">Naplófájlok:</strong> a Firebase infrastruktúra
                naplófájljai a Google adatmegőrzési politikájának megfelelően kezelődnek
              </li>
            </ul>
          </Section>

          {/* 7. Harmadik felek */}
          <Section title="7. Harmadik felek és adattovábbítás">
            <p>Az Adatkezelő az alábbi harmadik felek szolgáltatásait veszi igénybe:</p>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 text-text-primary font-semibold">Szolgáltató</th>
                    <th className="text-left py-2 pr-4 text-text-primary font-semibold">Cél</th>
                    <th className="text-left py-2 text-text-primary font-semibold">Adatvédelem</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Google Firebase Authentication</td>
                    <td className="py-2 pr-4">Felhasználói hitelesítés</td>
                    <td className="py-2">
                      <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link</a>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Google Firebase Realtime Database</td>
                    <td className="py-2 pr-4">Adattárolás</td>
                    <td className="py-2">
                      <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Google OAuth 2.0</td>
                    <td className="py-2 pr-4">Google fiókkal történő bejelentkezés</td>
                    <td className="py-2">
                      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Az Adatkezelő a személyes adatokat harmadik félnek nem értékesíti, nem adja bérbe
              és nem továbbítja marketing célokra. Az adattovábbítás kizárólag a Szolgáltatás
              működtetéséhez szükséges mértékben és a fent megjelölt célokra történik.
            </p>
          </Section>

          {/* 8. Felhasználói jogok */}
          <Section title="8. A Felhasználó jogai (GDPR)">
            <p>
              A GDPR alapján a Felhasználó az alábbi jogokat gyakorolhatja személyes adataival
              kapcsolatban:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary mt-2">
              <li>
                <strong className="text-text-primary">Hozzáférési jog (15. cikk):</strong> tájékoztatást
                kérhet arról, hogy milyen személyes adatait kezeljük, és másolatot kérhet azokról.
              </li>
              <li>
                <strong className="text-text-primary">Helyesbítéshez való jog (16. cikk):</strong> kérheti
                a pontatlan személyes adatok helyesbítését.
              </li>
              <li>
                <strong className="text-text-primary">Törléshez való jog (17. cikk):</strong> kérheti
                személyes adatainak törlését. A fiók törlése a Beállítások menüben elérhető.
              </li>
              <li>
                <strong className="text-text-primary">Az adatkezelés korlátozásához való jog (18. cikk):</strong>{' '}
                kérheti az adatkezelés korlátozását meghatározott feltételek teljesülése esetén.
              </li>
              <li>
                <strong className="text-text-primary">Adathordozhatósághoz való jog (20. cikk):</strong>{' '}
                kérheti, hogy személyes adatait tagolt, széles körben használt, géppel olvasható
                formátumban megkapja. Az adatok exportálása a Beállítások menüben elérhető.
              </li>
              <li>
                <strong className="text-text-primary">Tiltakozáshoz való jog (21. cikk):</strong> tiltakozhat
                a jogos érdeken alapuló adatkezelés ellen.
              </li>
              <li>
                <strong className="text-text-primary">Hozzájárulás visszavonása:</strong> az onboarding
                kérdőív válaszain alapuló adatkezelés esetén a hozzájárulás bármikor visszavonható,
                amely nem érinti a visszavonás előtti adatkezelés jogszerűségét.
              </li>
            </ul>
            <p className="mt-3">
              A jogok gyakorlására vonatkozó kérelmeket a{' '}
              <strong className="text-primary">donezy@support.com</strong> email címen lehet benyújtani.
              A kérelmekre legkésőbb 30 napon belül válaszolunk.
            </p>
          </Section>

          {/* 9. Cookie-k */}
          <Section title="9. Cookie-k és helyi tárolás">
            <p>
              A Szolgáltatás az alábbi helyi tárolási mechanizmusokat használja:
            </p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary mt-2">
              <li>
                <strong className="text-text-primary">localStorage:</strong> a felhasználói munkamenet
                (bejelentkezési állapot) és az alkalmazás beállításainak (pl. kiválasztott célcsoport,
                téma) tárolására a Felhasználó eszközén
              </li>
              <li>
                <strong className="text-text-primary">Firebase session cookie-k:</strong> a hitelesítési
                munkamenet fenntartásához szükséges technikai cookie-k
              </li>
            </ul>
            <p className="mt-2">
              A Szolgáltatás nem használ marketing, analitikai vagy harmadik féltől származó
              nyomkövető cookie-kat.
            </p>
          </Section>

          {/* 10. Gyermekek védelme */}
          <Section title="10. Gyermekek védelme">
            <p>
              A Szolgáltatás nem irányul 16 éven aluli személyekre. Amennyiben tudomásunkra jut,
              hogy 16 éven aluli személy személyes adatait kezeljük a törvényes képviselő
              hozzájárulása nélkül, az adatokat haladéktalanul töröljük. Ha Ön tudomást szerez
              arról, hogy 16 éven aluli gyermek adatot adott meg, kérjük, értesítsen minket a{' '}
              <strong className="text-primary">donezy@support.com</strong> email címen.
            </p>
          </Section>

          {/* 11. Adatbiztonság */}
          <Section title="11. Adatbiztonsági intézkedések">
            <p>Az Adatkezelő az alábbi biztonsági intézkedéseket alkalmazza:</p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary mt-2">
              <li>Jelszavak kizárólag hash-elt formában kerülnek tárolásra (Firebase Authentication)</li>
              <li>HTTPS titkosított kommunikáció az alkalmazás és a szerverek között</li>
              <li>Firebase Security Rules a jogosulatlan adathozzáférés megakadályozására</li>
              <li>A Google Cloud Platform infrastrukturális biztonsági intézkedései (SOC 2, ISO 27001)</li>
              <li>Az adatkezeléshez hozzáféréssel rendelkező személyek köre a minimálisan szükségesre korlátozva</li>
            </ul>
          </Section>

          {/* 12. Adatvédelmi incidens */}
          <Section title="12. Adatvédelmi incidens">
            <p>
              Adatvédelmi incidens (személyes adatok jogosulatlan hozzáférése, elvesztése vagy
              megsemmisülése) esetén az Adatkezelő a GDPR 33. és 34. cikke szerint jár el:
            </p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary mt-2">
              <li>72 órán belül értesíti a Nemzeti Adatvédelmi és Információszabadság Hatóságot (NAIH)</li>
              <li>Magas kockázat esetén haladéktalanul értesíti az érintett Felhasználókat</li>
              <li>Dokumentálja az incidenst és a megtett intézkedéseket</li>
            </ul>
          </Section>

          {/* 13. Jogorvoslat */}
          <Section title="13. Jogorvoslati lehetőségek">
            <p>
              Amennyiben a Felhasználó úgy ítéli meg, hogy személyes adatainak kezelése sérti a
              GDPR vagy az Infotv. rendelkezéseit, az alábbi jogorvoslati lehetőségek állnak
              rendelkezésére:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary mt-2">
              <li>
                <strong className="text-text-primary">Panasz az Adatkezelőnél:</strong>{' '}
                <span className="text-primary">donezy@support.com</span>
              </li>
              <li>
                <strong className="text-text-primary">Panasz a felügyeleti hatóságnál:</strong>{' '}
                Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH), 1055 Budapest,
                Falk Miksa utca 9-11., telefon: +36 (1) 391-1400, email: ugyfelszolgalat@naih.hu,
                honlap:{' '}
                <a href="https://www.naih.hu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  www.naih.hu
                </a>
              </li>
              <li>
                <strong className="text-text-primary">Bírósági jogorvoslat:</strong> a Felhasználó
                lakóhelye vagy tartózkodási helye szerinti törvényszékhez fordulhat.
              </li>
            </ul>
          </Section>

          {/* 14. Módosítások */}
          <Section title="14. Az irányelvek módosítása">
            <p>
              Az Adatkezelő fenntartja a jogot a jelen Adatvédelmi irányelvek módosítására. A
              módosításokról a Felhasználókat az alkalmazáson belüli értesítéssel, illetve a
              módosított irányelvek közzétételével tájékoztatjuk. A módosítás a közzététel
              napjától hatályos. A Szolgáltatás további használata a módosított irányelvek
              elfogadásának minősül.
            </p>
          </Section>

          {/* 15. Kapcsolat */}
          <Section title="15. Kapcsolat">
            <p>
              Adatvédelmi kérdéseivel, kérelmeivel és panaszaival forduljon hozzánk:
            </p>
            <div className="mt-2 p-4 rounded-lg bg-surface-1/50 border border-white/10">
              <p className="text-text-primary font-medium">Donezy – Adatvédelmi kapcsolattartó</p>
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
