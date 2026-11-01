/**
 * Moves legacy payment proofs (base64 stored inside billinginvoices documents) into protected file storage.
 *
 *   node scripts/migrate-payment-proofs.js            -> dry run, changes nothing
 *   node scripts/migrate-payment-proofs.js --apply    -> writes files, then clears the base64 copy
 *
 * Safety: the file is written and re-read before the base64 copy is removed, invoices are never deleted,
 * and proofs that are not valid PNG/JPEG images are left untouched. The API reads both formats, so the
 * migration can be run at any time or not at all.
 */
const path = require("path");
const mongoose = require("mongoose");
const BillingInvoice = require("../models/BillingInvoice");
const { parseImageDataUrl, saveImage, readAsDataUrl } = require("../utils/privateFiles");

const migrate = async ({ apply = false } = {}) => {
  const report = { scanned: 0, migrated: 0, skipped: 0, failed: [] };
  const cursor = BillingInvoice.find({ screenshot: { $exists: true, $ne: "" }, proofPath: { $in: [null, ""] } })
    .select("+screenshot +proofPath schoolId")
    .cursor();

  for await (const invoice of cursor) {
    report.scanned += 1;
    const parsed = parseImageDataUrl(invoice.screenshot, 8 * 1024 * 1024);
    if (parsed.error) {
      report.skipped += 1;
      report.failed.push({ id: String(invoice._id), reason: parsed.error });
      continue;
    }
    if (!apply) {
      report.migrated += 1;
      continue;
    }
    try {
      const rel = await saveImage(`payment-proofs/${String(invoice.schoolId)}`, String(invoice._id), parsed);
      const check = await readAsDataUrl(rel, parsed.mime);
      if (!check) throw new Error("Written file could not be read back");
      await BillingInvoice.updateOne(
        { _id: invoice._id },
        { $set: { proofPath: rel, proofMime: parsed.mime }, $unset: { screenshot: "" } }
      );
      report.migrated += 1;
    } catch (err) {
      report.failed.push({ id: String(invoice._id), reason: err.message });
    }
  }
  return report;
};

module.exports = { migrate };

if (require.main === module) {
  require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
  const apply = process.argv.includes("--apply");
  mongoose
    .connect(process.env.MONGO_URI || process.env.MONGODB_URI)
    .then(() => migrate({ apply }))
    .then((report) => {
      console.log(apply ? "Applied:" : "Dry run:", report);
      return mongoose.disconnect();
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
