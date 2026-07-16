import { prisma } from "../src/lib/db";

const USER_COLORS: Record<string, string> = {
  "inga@hairland.cz": "#e91e8a",     // pink (růžová)
  "jevgenij@hairland.cz": "#dc2626", // red (červená)
  "martin@hairland.cz": "#2563eb",   // blue (modrá)
};

async function main() {
  for (const [email, color] of Object.entries(USER_COLORS)) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`User ${email} not found, skipping`);
      continue;
    }
    await prisma.user.update({
      where: { email },
      data: { color },
    });
    console.log(`Set ${email} color to ${color}`);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
