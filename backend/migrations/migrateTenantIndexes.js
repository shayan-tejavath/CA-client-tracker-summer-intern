import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";

dotenv.config();

/* =====================================================================
   ONE-OFF MIGRATION: Multi-tenant role/permission indexes
   ---------------------------------------------------------------------
   Why: QwikCA is now multi-tenant. Roles and permissions are scoped per
   company, so the global-unique indexes on a single name/role field
   block valid cross-firm duplicate names. They are replaced with
   tenant-aware compound unique indexes.

   Target collections:
     - userroles    : drop global-unique { name: 1 }
                      ensure unique      { name: 1, companyId: 1 }
                      ensure             { companyId: 1 }
     - permissions  : drop global-unique { role: 1 }
                      ensure unique      { role: 1, companyId: 1 }
                      ensure             { companyId: 1 }

   Safety:
     - Inspects existing indexes before any change (dry-run flag included).
     - Creates required indexes BEFORE dropping obsolete ones, so there is
       never a window without a uniqueness constraint.
     - Idempotent: safe to re-run; already-applied steps are skipped.
     - Only touches index metadata. Never reads, writes, or deletes
       application documents.

   Usage:
     node migrations/migrateTenantIndexes.js            # apply
     node migrations/migrateTenantIndexes.js --dry-run  # preview only
   ===================================================================== */

const DRY_RUN = process.argv.includes("--dry-run");

const MIGRATION = [
  {
    collection: "userroles",
    obsoleteUniqueKeys: [{ name: 1 }],
    requiredIndexes: [
      { key: { name: 1, companyId: 1 }, options: { unique: true } },
      { key: { companyId: 1 }, options: {} },
    ],
  },
  {
    collection: "permissions",
    obsoleteUniqueKeys: [{ role: 1 }],
    requiredIndexes: [
      { key: { role: 1, companyId: 1 }, options: { unique: true } },
      { key: { companyId: 1 }, options: {} },
    ],
  },
];

const sameKey = (a, b) => {
  const keysA = Object.keys(a || {});
  const keysB = Object.keys(b || {});
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
};

const logIndex = (prefix, index) => {
  console.log(
    `${prefix} ${index.name} ${JSON.stringify(index.key)} unique=${!!index.unique}`
  );
};

// MongoDB's default auto-generated name for an index key (numeric/1 only here).
const indexName = (key) =>
  Object.keys(key)
    .map((k) => `${k}_${key[k]}`)
    .join("_");

// Simulates the final index set for dry-run previews by replaying the
// create/drop operations of this migration against the current snapshot.
const simulateAfter = (existing, step) => {
  const simulated = existing.map((index) => ({ ...index }));

  for (const req of step.requiredIndexes) {
    const presentIndex = simulated.find((index) => sameKey(index.key, req.key));
    if (presentIndex) {
      if (Boolean(presentIndex.unique) === Boolean(req.options.unique)) {
        continue;
      }
      simulated.splice(simulated.indexOf(presentIndex), 1);
      simulated.push({
        name: indexName(req.key),
        key: req.key,
        unique: !!req.options.unique,
      });
    } else {
      simulated.push({
        name: indexName(req.key),
        key: req.key,
        unique: !!req.options.unique,
      });
    }
  }

  for (const obsolete of step.obsoleteUniqueKeys) {
    const match = simulated.find(
      (index) => sameKey(index.key, obsolete) && index.name !== "_id_"
    );
    if (match && match.unique) {
      simulated.splice(simulated.indexOf(match), 1);
    }
  }

  return simulated;
};

const run = async () => {
  await connectDB();
  const db = mongoose.connection.db;

  console.log(
    "\n=== TENANT-INDEX MIGRATION " + (DRY_RUN ? "(DRY RUN - NO CHANGES)" : "START") + " ==="
  );

  let totalChanges = 0;
  let totalSkips = 0;
  let totalFailures = 0;

  for (const step of MIGRATION) {
    const collections = await db
      .listCollections({ name: step.collection })
      .toArray();

    console.log(`\n--- Collection: ${step.collection} ---`);

    if (collections.length === 0) {
      console.log("  SKIP (collection does not exist - mongoose will create indexes on next boot)");
      totalSkips += 1;
      continue;
    }

    const col = db.collection(step.collection);
    const existing = await col.indexes();

    console.log("  Current indexes:");
    existing.forEach((index) => logIndex("    ", index));

    let collectionChanges = 0;

    // 1) Ensure required indexes exist (create BEFORE dropping obsolete ones).
    for (const req of step.requiredIndexes) {
      const present = existing.find((index) => sameKey(index.key, req.key));

      if (present) {
        if (Boolean(present.unique) === Boolean(req.options.unique)) {
          console.log(
            `  SKIP create ${JSON.stringify(req.key)} (already present as "${present.name}")`
          );
          totalSkips += 1;
          continue;
        }

        console.log(
          `  DROP ${present.name} (key ${JSON.stringify(present.key)}, uniqueness mismatch - recreating)`
        );
        if (!DRY_RUN) await col.dropIndex(present.name);
        collectionChanges += 1;

        console.log(
          `  CREATE ${JSON.stringify(req.key)} ${JSON.stringify(req.options)}`
        );
        if (!DRY_RUN) await col.createIndex(req.key, req.options);
        collectionChanges += 1;
        continue;
      }

      console.log(
        `  CREATE ${JSON.stringify(req.key)} ${JSON.stringify(req.options)}`
      );
      if (!DRY_RUN) await col.createIndex(req.key, req.options);
      collectionChanges += 1;
    }

    // 2) Drop obsolete global-unique single-field indexes.
    for (const obsolete of step.obsoleteUniqueKeys) {
      const match = existing.find(
        (index) => sameKey(index.key, obsolete) && index.name !== "_id_"
      );

      if (!match) {
        console.log(`  SKIP drop ${JSON.stringify(obsolete)} (not present)`);
        totalSkips += 1;
        continue;
      }

      // Defensive: never drop an index whose key is actually required.
      const isRequired = step.requiredIndexes.some((r) =>
        sameKey(r.key, obsolete)
      );
      if (isRequired) {
        console.log(
          `  SKIP drop ${match.name} (key is part of required indexes)`
        );
        totalSkips += 1;
        continue;
      }

      // Only the global-unique single-field index conflicts with multi-tenancy.
      if (!match.unique) {
        console.log(
          `  SKIP drop ${match.name} (key ${JSON.stringify(match.key)} is NOT unique - not the conflicting global-unique index)`
        );
        totalSkips += 1;
        continue;
      }

      console.log(
        `  DROP ${match.name} (key ${JSON.stringify(match.key)}, obsolete global-unique)`
      );
      if (!DRY_RUN) await col.dropIndex(match.name);
      collectionChanges += 1;
    }

    // 3) Show resulting index set (simulated in dry-run, live otherwise).
    const finalIndexes = DRY_RUN
      ? simulateAfter(existing, step)
      : await col.indexes();
    console.log("  Final indexes:");
    finalIndexes.forEach((index) => logIndex("    ", index));

    // 4) Verify every required index exists with the intended uniqueness.
    for (const req of step.requiredIndexes) {
      const present = finalIndexes.find((index) =>
        sameKey(index.key, req.key)
      );
      const ok =
        present && Boolean(present.unique) === Boolean(req.options.unique);
      console.log(
        `  ${ok ? "VERIFY OK" : "VERIFY FAILED"} ${JSON.stringify(req.key)} unique=${req.options.unique ? "true" : "false"}`
      );
      if (!ok) totalFailures += 1;
    }

    totalChanges += collectionChanges;
    console.log(
      collectionChanges > 0
        ? `  -> ${collectionChanges} index change(s)`
        : "  -> no changes needed"
    );
  }

  console.log(`\n=== TENANT-INDEX MIGRATION ${DRY_RUN ? "PREVIEW" : "COMPLETE"} ===`);
  console.log(`Total index changes: ${DRY_RUN ? totalChanges + " (would apply)" : totalChanges}`);
  console.log(`Skipped steps: ${totalSkips}`);
  if (totalFailures > 0) {
    console.error(`Verification failures: ${totalFailures} required index(es) missing or incorrect.`);
  } else {
    console.log("Verification: all required compound indexes present.");
  }

  await mongoose.connection.close();

  if (totalFailures > 0 && !DRY_RUN) {
    process.exitCode = 1;
  }
};

run().catch(async (error) => {
  console.error("\n[FATAL] Migration failed - no further changes applied.");
  console.error(error);
  try {
    await mongoose.connection.close();
  } catch {
    /* ignore close errors on failure */
  }
  process.exit(1);
});
