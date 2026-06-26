import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

function cuid() {
  return "r" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
}

const reviews = [
  {
    authorName: "Natálie K.",
    authorCity: "Praha",
    salonName: "Studio Natálie",
    rating: 5,
    text: "Objednávám u Hairlandu už přes rok. Vlasy jsou opravdu kvalitní, barvy sedí přesně a klientky jsou nadšené. Osobní přístup a dovoz po Praze zdarma — lepší servis jsem nenašla.",
    source: "GOOGLE",
    featured: true,
  },
  {
    authorName: "Olena M.",
    authorCity: "Praha",
    rating: 5,
    text: "Дуже якісне волосся! Замовляла вже тричі — кожного разу ідеальна якість. Приємно, що можна спілкуватися українською. Рекомендую всім!",
    source: "GOOGLE",
    featured: true,
  },
  {
    authorName: "Petra Dvořáková",
    authorCity: "Brno",
    salonName: "Hair Elegance",
    rating: 5,
    text: "Poprvé jsem si vlasy mohla osahat osobně, než jsem je koupila. Žádné překvapení, žádné zklamání. Přesně to, co jsem potřebovala pro své klientky.",
    source: "MANUAL",
    featured: true,
  },
  {
    authorName: "Анна С.",
    authorCity: "Praha 5",
    rating: 5,
    text: "Заказала clip-in на пробу — сделали за 5 дней, качество отличное. Цвет точно совпал. Буду заказывать ещё!",
    source: "MANUAL",
    featured: false,
  },
  {
    authorName: "Lucie Nováková",
    authorCity: "Praha",
    salonName: "Beauty Corner",
    rating: 4,
    text: "Velký výběr odstínů a délek. Vlasy jsou krásné, hedvábné. Oceňuji, že mi poradili přesně jakou gramáž potřebuji. Spolupráce na jedničku.",
    source: "GOOGLE",
    featured: false,
  },
  {
    authorName: "Марина Б.",
    authorCity: "Praha 4",
    salonName: "Salon Krasula",
    rating: 5,
    text: "Працюю з Hairland вже пів року. Волосся чудової якості, особливо virgin з Казахстану. Клієнтки задоволені, повертаються знову і знову.",
    source: "INSTAGRAM",
    featured: true,
  },
  {
    authorName: "Kateřina H.",
    authorCity: "Plzeň",
    rating: 5,
    text: "Tape-in mi připravili přesně na míru do týdne. Perfektní zpracování, barva 1:1. Moje kadeřnice byla nadšená kvalitou. Určitě objednám znovu!",
    source: "MANUAL",
    featured: false,
  },
  {
    authorName: "Svetlana T.",
    authorCity: "Praha 2",
    rating: 5,
    text: "Наконец нашла где можно купить качественные славянские волосы в Праге. Приехали с образцами прямо в салон, всё показали и объяснили. Сервис на высшем уровне!",
    source: "GOOGLE",
    featured: false,
  },
];

async function main() {
  for (const r of reviews) {
    const id = cuid();
    const now = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO reviews (id, authorName, authorCity, salonName, rating, text, source, featured, active, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [id, r.authorName, r.authorCity ?? null, r.salonName ?? null, r.rating, r.text, r.source, r.featured ? 1 : 0, now, now],
    });
  }
  console.log(`Seeded ${reviews.length} reviews!`);
}

main().catch(console.error);
