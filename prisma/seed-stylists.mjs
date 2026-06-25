import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Get first salon for linking
const salonsResult = await client.execute("SELECT id FROM salons LIMIT 3");
const salonIds = salonsResult.rows.map(r => r.id);

const now = new Date().toISOString();

const stylists = [
  {
    id: "stylist_01",
    name: "Natalia Kovalenko",
    slug: "natalia-kovalenko",
    photo: null,
    bio: "Specialistka na prodlužování vlasů s 8letou praxí. Miluji proměny a šťastné klientky! ✨💇‍♀️",
    bioUk: "Спеціалістка з нарощування волосся з 8-річним досвідом. Обожнюю перевтілення та щасливих клієнток! ✨💇‍♀️",
    bioRu: "Специалист по наращиванию волос с 8-летним опытом. Люблю преображения и счастливых клиенток! ✨💇‍♀️",
    specializations: JSON.stringify(["Prodlužování vlasů", "Keratinové metody", "Tape-in", "Barvení"]),
    languages: JSON.stringify(["cs", "uk", "ru"]),
    phone: "+420 777 111 222",
    email: "natalia@hairora.cz",
    instagram: "@natalia.hair.cz",
    telegram: "@natalia_hair",
    whatsapp: "+420777111222",
    city: "Praha",
    experience: 8,
    certifications: JSON.stringify(["Great Lengths certifikát", "Hairdreams Master"]),
    portfolio: JSON.stringify([]),
    featured: 1,
    active: 1,
    salonId: salonIds[0] || null,
  },
  {
    id: "stylist_02",
    name: "Olena Shevchenko",
    slug: "olena-shevchenko",
    photo: null,
    bio: "Vaše vlasy, můj um. 💫 Specializuji se na clip-in a micro ring metody. Konzultace zdarma!",
    bioUk: "Ваше волосся, моя майстерність. 💫 Спеціалізуюся на clip-in та micro ring методах. Консультація безкоштовно!",
    bioRu: "Ваши волосы, моё мастерство. 💫 Специализируюсь на clip-in и micro ring методах. Консультация бесплатно!",
    specializations: JSON.stringify(["Clip-in", "Micro ring", "Weft metody", "Údržba prodloužení"]),
    languages: JSON.stringify(["cs", "uk", "en"]),
    phone: "+420 608 333 444",
    email: "olena@hairora.cz",
    instagram: "@olena.extensions",
    telegram: "@olena_hair",
    whatsapp: null,
    city: "Brno",
    experience: 5,
    certifications: JSON.stringify(["Balmain certifikát"]),
    portfolio: JSON.stringify([]),
    featured: 1,
    active: 1,
    salonId: salonIds[1] || null,
  },
  {
    id: "stylist_03",
    name: "Katerina Novotná",
    slug: "katerina-novotna",
    photo: null,
    bio: "10 let zkušeností s prémiovými vlasy 🌟 Keratin & tape-in specialistka. Váš nový look začíná u mě!",
    bioUk: "10 років досвіду з преміальним волоссям 🌟 Кератин & tape-in спеціалістка.",
    bioRu: "10 лет опыта с премиальными волосами 🌟 Кератин & tape-in специалист.",
    specializations: JSON.stringify(["Keratin bonding", "Tape-in", "Prodlužování panenských vlasů", "Střihy"]),
    languages: JSON.stringify(["cs", "en"]),
    phone: "+420 602 555 666",
    email: "katerina@hairora.cz",
    instagram: "@katerina.hair.pro",
    telegram: null,
    whatsapp: "+420602555666",
    city: "Praha",
    experience: 10,
    certifications: JSON.stringify(["Great Lengths Master", "L'Oréal Color Specialist"]),
    portfolio: JSON.stringify([]),
    featured: 0,
    active: 1,
    salonId: salonIds[0] || null,
  },
  {
    id: "stylist_04",
    name: "Marina Popova",
    slug: "marina-popova",
    photo: null,
    bio: "Každá žena si zaslouží krásné vlasy 💖 Weft & clip-in expertka. Přírodní vzhled je můj cíl!",
    bioUk: "Кожна жінка заслуговує на гарне волосся 💖 Weft & clip-in експертка.",
    bioRu: "Каждая женщина заслуживает красивые волосы 💖 Weft & clip-in эксперт.",
    specializations: JSON.stringify(["Weft metody", "Clip-in systémy", "Barevné přechody", "Ombre"]),
    languages: JSON.stringify(["cs", "ru"]),
    phone: "+420 773 888 999",
    email: "marina@hairora.cz",
    instagram: "@marina.weft",
    telegram: "@marina_weft",
    whatsapp: null,
    city: "Ostrava",
    experience: 6,
    certifications: JSON.stringify(["Hair Extensions Academy"]),
    portfolio: JSON.stringify([]),
    featured: 1,
    active: 1,
    salonId: salonIds[2] || null,
  },
  {
    id: "stylist_05",
    name: "Alina Bondarenko",
    slug: "alina-bondarenko",
    photo: null,
    bio: "Mladá, ale zkušená! 🔥 3 roky intenzivní praxe. Micro ring & nano ring jsou moje doména.",
    bioUk: "Молода, але досвідчена! 🔥 3 роки інтенсивної практики. Micro ring & nano ring — моя сфера.",
    bioRu: "Молодая, но опытная! 🔥 3 года интенсивной практики. Micro ring & nano ring — моя сфера.",
    specializations: JSON.stringify(["Micro ring", "Nano ring", "Prodlužování krátkých vlasů"]),
    languages: JSON.stringify(["cs", "uk", "ru", "en"]),
    phone: "+420 776 222 333",
    email: "alina@hairora.cz",
    instagram: "@alina.micro",
    telegram: "@alina_hair",
    whatsapp: "+420776222333",
    city: "Plzeň",
    experience: 3,
    certifications: JSON.stringify([]),
    portfolio: JSON.stringify([]),
    featured: 0,
    active: 1,
    salonId: null,
  },
];

for (const s of stylists) {
  await client.execute({
    sql: `INSERT OR REPLACE INTO stylists (id, name, slug, photo, bio, bioUk, bioRu, specializations, languages, phone, email, instagram, telegram, whatsapp, city, experience, certifications, portfolio, featured, active, salonId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [s.id, s.name, s.slug, s.photo, s.bio, s.bioUk, s.bioRu, s.specializations, s.languages, s.phone, s.email, s.instagram, s.telegram, s.whatsapp, s.city, s.experience, s.certifications, s.portfolio, s.featured, s.active, s.salonId, now, now],
  });
  console.log(`✓ ${s.name}`);
}

console.log("Done! 5 stylists seeded.");
