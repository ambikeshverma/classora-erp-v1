const Subscription = require("../models/Subscription");
const Student = require("../models/Student");

const STALE_MS = 5 * 60 * 1000;
const NOOP = { ok: true, release: async () => {} };

const limitError = (limit) => ({
  success: false,
  code: "STUDENT_LIMIT_REACHED",
  message: `The student limit for your school (${limit}) has been reached. Please contact Super Admin to increase it.`,
  msg: `The student limit for your school (${limit}) has been reached. Please contact Super Admin to increase it.`,
});

/**
 * Reserves room for new students when Super Admin has switched the restriction on.
 * Reservation is atomic ($inc on the subscription), so simultaneous requests cannot slip past the limit:
 * the in-flight counter is raised first and the committed count is read afterwards. The check can be
 * conservative under heavy concurrency, but it can never allow more students than the limit.
 * Without an enabled restriction this is a no-op and nothing is ever blocked.
 */
const reserveStudentSlot = async (schoolId, count = 1) => {
  const sub = await Subscription.findOne({ schoolId })
    .select("studentLimit restrictStudentAdditions inflightStudents inflightUpdatedAt")
    .lean();

  if (!sub || !sub.restrictStudentAdditions || !(sub.studentLimit > 0)) return NOOP;

  // A crashed request could leave a reservation behind; expire old ones
  if (sub.inflightStudents > 0 && sub.inflightUpdatedAt && Date.now() - new Date(sub.inflightUpdatedAt) > STALE_MS) {
    await Subscription.updateOne(
      { schoolId, inflightUpdatedAt: sub.inflightUpdatedAt },
      { $set: { inflightStudents: 0 } }
    );
  }

  const reserved = await Subscription.findOneAndUpdate(
    { schoolId },
    { $inc: { inflightStudents: count }, $set: { inflightUpdatedAt: new Date() } },
    { returnDocument: "after" }
  );

  let released = false;
  const release = async () => {
    if (released) return;
    released = true;
    await Subscription.updateOne({ schoolId, inflightStudents: { $gte: count } }, { $inc: { inflightStudents: -count } });
  };

  const current = await Student.countDocuments({ schoolId, status: "Active" });
  if (current + reserved.inflightStudents > sub.studentLimit) {
    await release();
    return { ok: false, error: limitError(sub.studentLimit), limit: sub.studentLimit, current };
  }

  return { ok: true, release, limit: sub.studentLimit, current };
};

module.exports = { reserveStudentSlot, limitError };
