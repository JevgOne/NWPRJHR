/**
 * Fix internal links in blog post content.
 * Replaces /offer -> /vlasy-k-prodlouzeni and /contact -> /kontakt
 * in markdown link contexts.
 *
 * Run: node --env-file=.env.production.local scripts/fix-blog-links.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL?.replace(/\s+/g, ""),
  authToken: process.env.TURSO_AUTH_TOKEN?.replace(/\s+/g, ""),
});
const prisma = new PrismaClient({ adapter });

/** Content fields to check and fix */
const CONTENT_FIELDS = ["content", "contentUk", "contentRu"];

/**
 * Replacements: match markdown link targets like ](/offer) or ](/offer#...)
 * Also handles href="/offer" in raw HTML within markdown.
 */
const REPLACEMENTS = [
  { from: /\]\(\/offer([\)#\?])/g, to: "](/vlasy-k-prodlouzeni$1" },
  { from: /\]\(\/contact([\)#\?])/g, to: "](/kontakt$1" },
  { from: /href="\/offer(["#\?])/g, to: 'href="/vlasy-k-prodlouzeni$1' },
  { from: /href="\/contact(["#\?])/g, to: 'href="/kontakt$1' },
];

function applyReplacements(text) {
  let result = text;
  for (const { from, to } of REPLACEMENTS) {
    result = result.replace(from, to);
  }
  return result;
}

async function main() {
  // Find all blog posts that contain /offer or /contact in any content field
  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        ...CONTENT_FIELDS.flatMap((field) => [
          { [field]: { contains: "/offer" } },
          { [field]: { contains: "/contact" } },
        ]),
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      contentUk: true,
      contentRu: true,
    },
  });

  if (posts.length === 0) {
    console.log("No blog posts found with /offer or /contact links.");
    return;
  }

  console.log(`Found ${posts.length} blog post(s) with old links:\n`);

  let totalUpdated = 0;

  for (const post of posts) {
    const changes = [];
    const updateData = {};

    for (const field of CONTENT_FIELDS) {
      const original = post[field];
      if (!original) continue;

      const updated = applyReplacements(original);
      if (updated !== original) {
        updateData[field] = updated;
        // Log what changed
        const offerCount = (original.match(/\]\(\/offer[\)#\?]/g) || []).length
          + (original.match(/href="\/offer["#\?]/g) || []).length;
        const contactCount = (original.match(/\]\(\/contact[\)#\?]/g) || []).length
          + (original.match(/href="\/contact["#\?]/g) || []).length;
        if (offerCount > 0) changes.push(`${field}: /offer -> /vlasy-k-prodlouzeni (${offerCount}x)`);
        if (contactCount > 0) changes.push(`${field}: /contact -> /kontakt (${contactCount}x)`);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: updateData,
      });
      totalUpdated++;
      console.log(`  [${post.slug}] "${post.title}"`);
      for (const change of changes) {
        console.log(`    - ${change}`);
      }
    }
  }

  console.log(`\nDone. Updated ${totalUpdated} blog post(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
