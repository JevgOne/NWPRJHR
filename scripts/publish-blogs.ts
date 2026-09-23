import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const prisma = new PrismaClient({ adapter });

const SLUGS = [
  "sampon-pro-prodlouzene-vlasy",
  "prodlouzene-vlasy-more-sport-sauna",
];

async function main() {
  for (const slug of SLUGS) {
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post) {
      console.error(`Blog post "${slug}" not found!`);
      continue;
    }
    if (post.published) {
      console.log(`"${slug}" is already published.`);
      continue;
    }
    await prisma.blogPost.update({
      where: { slug },
      data: {
        published: true,
        publishedAt: new Date(),
      },
    });
    console.log(`Published "${slug}" at ${new Date().toISOString()}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
