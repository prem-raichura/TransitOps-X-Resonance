// Slug policy (see doc 01): URL identifiers are slugs derived from name, never the cuid `id`.
// On collision, append -2, -3, ... e.g. "van-05", "van-05-2".

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric runs -> single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/**
 * Generate a slug for `name` that is unique within the given Prisma model delegate.
 * @param {object} model  a Prisma model delegate exposing findUnique, e.g. prisma.vehicle
 * @param {string} name
 * @param {string} [excludeId]  ignore a row (used on update so a record doesn't collide with itself)
 */
async function generateUniqueSlug(model, name, excludeId = null) {
  const base = slugify(name) || 'item';
  let candidate = base;
  let n = 1;

  // Loop until we find a free slug.
  while (true) {
    const existing = await model.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

module.exports = { slugify, generateUniqueSlug };
