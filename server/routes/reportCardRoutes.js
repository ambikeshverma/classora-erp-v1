const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");

const Exam = require("../models/Exam");
const ExamMarksSetup = require("../models/ExamMarksSetup");
const Class = require("../models/Class");
const ClassSubjectMapping = require("../models/ClassSubjectMapping");
const StudentSubjectMapping = require("../models/StudentSubjectMapping");
const Admission = require("../models/Admission");
const ScholasticMark = require("../models/ScholasticMark");
const CoScholasticGrade = require("../models/CoScholasticGrade");
const ReportResult = require("../models/ReportResult");
const ResultStatus = require("../models/ResultStatus");

const { getCurrentSession } = require("../utils/feeEngine");

// Every report card record is stored against the school/campus resolved from the access token (schoolAuth)
router.use(schoolAuth, schoolAuth.checkModule("report_cards"));

const GRADES = ["A+", "A", "B+", "B", "C", "D"];
const MARK_CODES = ["AB", "ML"]; // absent, medical leave
const RESULT_VALUES = ["PASS", "FAIL", "NA"];
const DIVISIONS = ["First", "Second", "Third", "Fail", "-"];
const STUDENT_FIELDS = "studentName fatherName motherName srNo schoolAdmissionNo rollNumber rollNo session";

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const serverError = (res, error) => res.status(500).json({ success: false, message: error.message });
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const owner = (req) => ({ schoolId: req.schoolId, campusId: req.campusId });

const schoolInfoOf = (school) => ({
  schoolName: school?.schoolName || "",
  address: school?.address || "",
  email: school?.email || "",
  phone: school?.contactNo || "",
  website: school?.website || "",
  logo: school?.schoolLogo || "",
});

const rollOf = (student) => student.rollNumber || student.rollNo || "";

const byRoll = (a, b) => {
  const ra = Number(rollOf(a)) || Infinity;
  const rb = Number(rollOf(b)) || Infinity;
  return ra !== rb ? ra - rb : a.studentName.localeCompare(b.studentName);
};

const divisionOf = (percentage) => {
  if (percentage >= 60) return "First";
  if (percentage >= 45) return "Second";
  if (percentage >= 33) return "Third";
  return "Fail";
};

// Class + section must exist; returns the active students of the section
const loadSection = async (req, className, sectionName) => {
  const classDoc = await Class.findOne({ campusId: req.campusId, className }).select("sections").lean();
  if (!classDoc) return { error: `${className} was not found` };
  if (!(classDoc.sections || []).some((section) => section.sectionName === sectionName)) {
    return { error: `Section ${sectionName} was not found in ${className}` };
  }

  const students = await Admission.find({ schoolId: req.schoolId, status: "Active", className, section: sectionName })
    .select(STUDENT_FIELDS)
    .lean();

  return { students: students.sort(byRoll) };
};

// A student's own subject choice wins; otherwise the class's mapped subjects apply
const loadSubjectMap = async (req, className, students) => {
  const [classMapping, studentMappings] = await Promise.all([
    ClassSubjectMapping.findOne({ campusId: req.campusId, className }).select("scholasticSubjects coScholasticSubjects").lean(),
    students.length
      ? StudentSubjectMapping.find({ campusId: req.campusId, studentId: { $in: students.map((s) => s._id) } })
          .select("studentId scholasticSubjects coScholasticSubjects")
          .lean()
      : [],
  ]);

  const map = new Map();
  students.forEach((student) =>
    map.set(String(student._id), {
      scholastic: classMapping?.scholasticSubjects || [],
      co: classMapping?.coScholasticSubjects || [],
    })
  );
  studentMappings.forEach((item) =>
    map.set(String(item.studentId), { scholastic: item.scholasticSubjects || [], co: item.coScholasticSubjects || [] })
  );

  return map;
};

// Section specific marks setup overrides the class-wide one (sectionName "")
const effectiveSetups = (setupDocs, sectionName) => {
  const map = new Map();
  [...setupDocs.filter((s) => !s.sectionName), ...setupDocs.filter((s) => s.sectionName === sectionName)].forEach((setup) => {
    map.set(`${setup.examId}|${setup.subjectName}`, setup);
  });
  return map;
};

// Most students of a class section share one session; that session keys results and locks
const sessionOf = (students) => {
  const counts = new Map();
  students.forEach((student) => {
    if (student.session) counts.set(student.session, (counts.get(student.session) || 0) + 1);
  });
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : getCurrentSession();
};

const loadStatus = (req, session, className, sectionName) =>
  ResultStatus.findOne({ campusId: req.campusId, session, className, sectionName }).lean();

const findExam = (req, examId) => Exam.findOne({ _id: examId, campusId: req.campusId }).lean();

/* ==========================================================
   META
========================================================== */
router.get("/meta", async (req, res) => {
  try {
    const [exams, classes] = await Promise.all([
      Exam.find({ campusId: req.campusId }).select("examName applicableClasses allowCoScholastic").sort({ examName: 1 }).lean(),
      Class.find({ campusId: req.campusId }).select("className sections").sort({ className: 1 }).lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        exams,
        classes: classes.map((item) => ({
          className: item.className,
          sections: (item.sections || []).map((section) => section.sectionName),
        })),
        schoolInfo: schoolInfoOf(req.school),
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   SCHOLASTIC MARKS ENTRY
========================================================== */
const prepareEntry = async (req, { examId, className, sectionName }, { needCo = false } = {}) => {
  if (!examId || !isValidId(examId) || !className || !sectionName) return { status: 400, error: "Select exam, class and section" };

  const exam = await findExam(req, examId);
  if (!exam) return { status: 404, error: "Exam not found" };
  if (!exam.applicableClasses.includes(className)) return { status: 400, error: `${exam.examName} is not applicable to ${className}` };
  if (needCo && !exam.allowCoScholastic) return { status: 400, error: `Co-scholastic entry is not allowed for ${exam.examName}` };

  const section = await loadSection(req, className, sectionName);
  if (section.error) return { status: 404, error: section.error };

  const session = sessionOf(section.students);

  const [subjectMap, setupDocs, status] = await Promise.all([
    loadSubjectMap(req, className, section.students),
    ExamMarksSetup.find({ campusId: req.campusId, examId, className, sectionName: { $in: ["", sectionName] } }).lean(),
    loadStatus(req, session, className, sectionName),
  ]);

  return {
    exam,
    students: section.students,
    subjectMap,
    setups: effectiveSetups(setupDocs, sectionName),
    session,
    locked: Boolean(status?.isLocked),
  };
};

router.get("/marks-entry", async (req, res) => {
  try {
    const { className, sectionName, examId } = req.query;
    const ctx = await prepareEntry(req, { examId, className, sectionName });
    if (ctx.error) return fail(res, ctx.status, ctx.error);

    const markDocs = ctx.students.length
      ? await ScholasticMark.find({ campusId: req.campusId, examId, studentId: { $in: ctx.students.map((s) => s._id) } })
          .select("studentId subjectName marks")
          .lean()
      : [];
    const marks = new Map(markDocs.map((doc) => [`${doc.studentId}|${doc.subjectName}`, doc.marks]));

    const subjectSet = new Set();

    const rows = ctx.students.map((student) => {
      const subjects = (ctx.subjectMap.get(String(student._id))?.scholastic || [])
        .filter((subjectName) => ctx.setups.has(`${examId}|${subjectName}`))
        .map((subjectName) => {
          subjectSet.add(subjectName);
          return {
            subjectName,
            maximumMarks: ctx.setups.get(`${examId}|${subjectName}`).maximumMarks,
            marks: marks.get(`${student._id}|${subjectName}`) || "",
          };
        });

      return { _id: student._id, rollNo: rollOf(student), studentName: student.studentName, subjects };
    });

    res.status(200).json({
      success: true,
      data: { students: rows, subjectOptions: [...subjectSet].sort(), setupMissing: ctx.setups.size === 0, locked: ctx.locked },
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/marks-entry", async (req, res) => {
  try {
    const { examId, className, sectionName } = req.body;
    const entries = Array.isArray(req.body.marks) ? req.body.marks : [];

    const ctx = await prepareEntry(req, { examId, className, sectionName });
    if (ctx.error) return fail(res, ctx.status, ctx.error);
    if (ctx.locked) return fail(res, 400, "Result is locked. Marks cannot be edited.");

    const studentIds = new Set(ctx.students.map((s) => String(s._id)));
    const operations = [];
    const savedBySection = new Map(); // setup section -> subjects that now have marks

    for (const entry of entries) {
      const studentKey = String(entry.studentId);
      const key = `${examId}|${entry.subjectName}`;
      const setup = ctx.setups.get(key);

      if (!studentIds.has(studentKey)) return fail(res, 400, "Student does not belong to the selected class section");
      if (!setup || !(ctx.subjectMap.get(studentKey)?.scholastic || []).includes(entry.subjectName)) {
        return fail(res, 400, `${entry.subjectName} is not set up for this student`);
      }

      const raw = String(entry.marks ?? "").trim().toUpperCase();
      const filter = { campusId: req.campusId, examId, studentId: entry.studentId, subjectName: entry.subjectName };

      if (raw === "") {
        operations.push({ deleteOne: { filter } });
        continue;
      }

      let value = null;
      if (!MARK_CODES.includes(raw)) {
        if (!/^\d+(\.\d+)?$/.test(raw)) return fail(res, 400, "Only numbers, AB and ML are allowed");
        value = Number(raw);
        if (value > setup.maximumMarks) {
          return fail(res, 400, `Maximum marks for ${entry.subjectName} is ${setup.maximumMarks}`);
        }
      }

      operations.push({
        updateOne: {
          filter,
          update: { $set: { schoolId: req.schoolId, marks: raw, value, className, sectionName } },
          upsert: true,
        },
      });

      if (!savedBySection.has(setup.sectionName)) savedBySection.set(setup.sectionName, new Set());
      savedBySection.get(setup.sectionName).add(entry.subjectName);
    }

    if (operations.length > 0) await ScholasticMark.bulkWrite(operations);

    // From now on the maximum marks of these subjects are locked in Exam Marks Setup
    await Promise.all(
      [...savedBySection.entries()].map(([setupSection, subjects]) =>
        ExamMarksSetup.updateMany(
          { campusId: req.campusId, examId, className, sectionName: setupSection, subjectName: { $in: [...subjects] } },
          { $set: { marksEntryStarted: true } }
        )
      )
    );

    res.status(200).json({ success: true, message: "Scholastic marks saved successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   CO-SCHOLASTIC GRADE ENTRY
========================================================== */
router.get("/co-scholastic-entry", async (req, res) => {
  try {
    const { className, sectionName, examId } = req.query;
    const ctx = await prepareEntry(req, { examId, className, sectionName }, { needCo: true });
    if (ctx.error) return fail(res, ctx.status, ctx.error);

    const ids = ctx.students.map((s) => s._id);
    const [gradeDocs, markDocs] = ids.length
      ? await Promise.all([
          CoScholasticGrade.find({ campusId: req.campusId, examId, studentId: { $in: ids } }).select("studentId subjectName grade").lean(),
          ScholasticMark.find({ campusId: req.campusId, examId, studentId: { $in: ids } }).select("studentId subjectName value").lean(),
        ])
      : [[], []];

    const grades = new Map(gradeDocs.map((doc) => [`${doc.studentId}|${doc.subjectName}`, doc.grade]));

    const marksByStudent = new Map();
    markDocs.forEach((doc) => {
      const list = marksByStudent.get(String(doc.studentId)) || [];
      list.push(doc);
      marksByStudent.set(String(doc.studentId), list);
    });

    const subjectSet = new Set();

    const rows = ctx.students.map((student) => {
      const mapping = ctx.subjectMap.get(String(student._id)) || { scholastic: [], co: [] };

      // Scholastic total of this exam, shown beside the grades
      let obtained = 0;
      let maximum = 0;
      mapping.scholastic.forEach((subjectName) => {
        const setup = ctx.setups.get(`${examId}|${subjectName}`);
        if (!setup) return;
        const mark = (marksByStudent.get(String(student._id)) || []).find((doc) => doc.subjectName === subjectName);
        maximum += setup.maximumMarks;
        if (mark && mark.value != null) obtained += mark.value;
      });

      mapping.co.forEach((subjectName) => subjectSet.add(subjectName));

      return {
        _id: student._id,
        rollNo: rollOf(student),
        studentName: student.studentName,
        scholasticTotal: { obtained: round2(obtained), maximum },
        subjects: mapping.co.map((subjectName) => ({ subjectName, grade: grades.get(`${student._id}|${subjectName}`) || "" })),
      };
    });

    res.status(200).json({
      success: true,
      data: { students: rows, subjectOptions: [...subjectSet].sort(), locked: ctx.locked },
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/co-scholastic-entry", async (req, res) => {
  try {
    const { examId, className, sectionName } = req.body;
    const entries = Array.isArray(req.body.grades) ? req.body.grades : [];

    const ctx = await prepareEntry(req, { examId, className, sectionName }, { needCo: true });
    if (ctx.error) return fail(res, ctx.status, ctx.error);
    if (ctx.locked) return fail(res, 400, "Result is locked. Grades cannot be edited.");

    const studentIds = new Set(ctx.students.map((s) => String(s._id)));
    const operations = [];

    for (const entry of entries) {
      const studentKey = String(entry.studentId);
      if (!studentIds.has(studentKey)) return fail(res, 400, "Student does not belong to the selected class section");
      if (!(ctx.subjectMap.get(studentKey)?.co || []).includes(entry.subjectName)) {
        return fail(res, 400, `${entry.subjectName} is not mapped for this student`);
      }

      const grade = String(entry.grade ?? "").trim().toUpperCase();
      const filter = { campusId: req.campusId, examId, studentId: entry.studentId, subjectName: entry.subjectName };

      if (grade === "") {
        operations.push({ deleteOne: { filter } });
        continue;
      }

      if (!GRADES.includes(grade)) return fail(res, 400, `Invalid grade. Allowed: ${GRADES.join(", ")}`);

      operations.push({
        updateOne: { filter, update: { $set: { schoolId: req.schoolId, grade, className, sectionName } }, upsert: true },
      });
    }

    if (operations.length > 0) await CoScholasticGrade.bulkWrite(operations);

    res.status(200).json({ success: true, message: "Co-Scholastic grades saved successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   RESULT GENERATION
========================================================== */

// Pass/fail, totals and ranks for every student of the class (section) from the saved marks
const buildResults = async (req, className, sectionName, rankMode) => {
  const classWide = rankMode === "CLASS";

  const students = await Admission.find({
    schoolId: req.schoolId,
    status: "Active",
    className,
    ...(classWide ? {} : { section: sectionName }),
  })
    .select(STUDENT_FIELDS + " section")
    .lean();

  const ids = students.map((s) => s._id);

  const [subjectMap, setupDocs, markDocs] = await Promise.all([
    loadSubjectMap(req, className, students),
    ExamMarksSetup.find({ campusId: req.campusId, className }).lean(),
    ids.length
      ? ScholasticMark.find({ campusId: req.campusId, studentId: { $in: ids } }).select("studentId examId subjectName marks").lean()
      : [],
  ]);

  const marksByStudent = new Map();
  markDocs.forEach((doc) => {
    const key = String(doc.studentId);
    if (!marksByStudent.has(key)) marksByStudent.set(key, new Map());
    marksByStudent.get(key).set(`${doc.examId}|${doc.subjectName}`, doc.marks);
  });

  const setupsBySection = new Map();
  const setupsFor = (section) => {
    if (!setupsBySection.has(section)) setupsBySection.set(section, effectiveSetups(setupDocs, section));
    return setupsBySection.get(section);
  };

  const rows = students.map((student) => {
    const setups = setupsFor(student.section);
    const studentMarks = marksByStudent.get(String(student._id)) || new Map();
    const subjects = subjectMap.get(String(student._id))?.scholastic || [];
    const examIds = [...new Set([...setups.values()].map((setup) => String(setup.examId)))];

    let obtained = 0;
    let maximum = 0;
    let failed = false;

    examIds.forEach((examId) => {
      const relevant = subjects
        .map((subjectName) => ({ subjectName, setup: setups.get(`${examId}|${subjectName}`) }))
        .filter((item) => item.setup);

      // An exam the student has no marks for at all has not been taken yet, so it is left out
      if (!relevant.some((item) => studentMarks.has(`${examId}|${item.subjectName}`))) return;

      relevant.forEach(({ subjectName, setup }) => {
        const mark = studentMarks.get(`${examId}|${subjectName}`);
        if (mark === "ML") return; // medical leave: neither counted nor failed

        maximum += setup.maximumMarks;

        if (mark === undefined || mark === "AB") {
          if (setup.passingMarks != null) failed = true;
          return;
        }

        const value = Number(mark);
        obtained += value;
        if (setup.passingMarks != null && value < setup.passingMarks) failed = true;
      });
    });

    const percentage = maximum > 0 ? round2((obtained / maximum) * 100) : 0;

    return {
      studentId: student._id,
      className,
      sectionName: student.section,
      totalMarks: round2(obtained),
      maximumMarks: maximum,
      percentage,
      division: maximum > 0 ? divisionOf(percentage) : "-",
      result: maximum > 0 ? (failed ? "FAIL" : "PASS") : "NA",
      rank: null,
    };
  });

  // Same percentage shares a rank; students without any marks are not ranked
  const ranked = rows.filter((row) => row.maximumMarks > 0).sort((a, b) => b.percentage - a.percentage);
  rows.forEach((row) => {
    if (row.maximumMarks > 0) row.rank = ranked.findIndex((item) => item.percentage === row.percentage) + 1;
  });

  return {
    rows: rows.filter((row) => row.sectionName === sectionName),
    sectionSetups: setupsFor(sectionName),
  };
};

const presentResult = (result, student) => ({
  studentId: result.studentId,
  rollNo: rollOf(student),
  srNo: student.srNo,
  studentName: student.studentName,
  fatherName: student.fatherName,
  motherName: student.motherName,
  totalMarks: result.totalMarks,
  maximumMarks: result.maximumMarks,
  percentage: result.percentage,
  division: result.division,
  rank: result.rank,
  result: result.result,
  isManual: result.isManual,
  isLive: result.isLive,
});

router.get("/results", async (req, res) => {
  try {
    const { className, sectionName } = req.query;
    if (!className || !sectionName) return fail(res, 400, "Please select class and section");

    const section = await loadSection(req, className, sectionName);
    if (section.error) return fail(res, 404, section.error);

    const session = sessionOf(section.students);
    const ids = section.students.map((s) => s._id);

    const [results, status] = await Promise.all([
      ids.length ? ReportResult.find({ campusId: req.campusId, session, studentId: { $in: ids } }).lean() : [],
      loadStatus(req, session, className, sectionName),
    ]);

    const resultByStudent = new Map(results.map((item) => [String(item.studentId), item]));

    res.status(200).json({
      success: true,
      data: {
        session,
        studentCount: section.students.length,
        isLocked: Boolean(status?.isLocked),
        isClassLive: Boolean(status?.isClassLive),
        results: section.students
          .filter((student) => resultByStudent.has(String(student._id)))
          .map((student) => presentResult(resultByStudent.get(String(student._id)), student)),
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/results/generate", async (req, res) => {
  try {
    const { className, sectionName } = req.body;
    const rankMode = req.body.rankMode === "CLASS" ? "CLASS" : "SECTION";

    if (!className || !sectionName) return fail(res, 400, "Please select class and section");

    const section = await loadSection(req, className, sectionName);
    if (section.error) return fail(res, 404, section.error);
    if (section.students.length === 0) return fail(res, 400, "No students found");

    const session = sessionOf(section.students);

    const status = await loadStatus(req, session, className, sectionName);
    if (status?.isLocked) return fail(res, 400, "Result is locked. Unlock it before generating again.");

    const { rows, sectionSetups } = await buildResults(req, className, sectionName, rankMode);

    await ReportResult.bulkWrite(
      rows.map((row) => ({
        updateOne: {
          filter: { campusId: req.campusId, studentId: row.studentId, session },
          update: {
            $set: {
              schoolId: req.schoolId,
              className: row.className,
              sectionName: row.sectionName,
              totalMarks: row.totalMarks,
              maximumMarks: row.maximumMarks,
              percentage: row.percentage,
              division: row.division,
              rank: row.rank,
              result: row.result,
              isManual: false,
            },
            $setOnInsert: { isLive: false },
          },
          upsert: true,
        },
      }))
    );

    // Marks setups behind these results can no longer be deleted
    const setupIds = [...sectionSetups.values()].map((setup) => setup._id);
    if (setupIds.length > 0) await ExamMarksSetup.updateMany({ _id: { $in: setupIds } }, { $set: { resultGenerated: true } });

    res.status(200).json({ success: true, message: "Result generated successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.put("/results/manual", async (req, res) => {
  try {
    const { className, sectionName } = req.body;
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];

    if (!className || !sectionName) return fail(res, 400, "Please select class and section");
    if (rows.length === 0) return fail(res, 400, "No result to save");

    const section = await loadSection(req, className, sectionName);
    if (section.error) return fail(res, 404, section.error);

    const session = sessionOf(section.students);
    const status = await loadStatus(req, session, className, sectionName);
    if (status?.isLocked) return fail(res, 400, "Result is locked. Marks cannot be edited.");

    const studentIds = new Set(section.students.map((s) => String(s._id)));
    const operations = [];

    for (const row of rows) {
      const totalMarks = Number(row.totalMarks);
      const maximumMarks = Number(row.maximumMarks);
      const percentage = Number(row.percentage);
      const rank = row.rank === "" || row.rank == null ? null : Number(row.rank);

      if (!studentIds.has(String(row.studentId))) return fail(res, 400, "Student does not belong to the selected class section");
      if (!(totalMarks >= 0) || !(maximumMarks >= 0) || totalMarks > maximumMarks) return fail(res, 400, "Invalid total marks");
      if (!(percentage >= 0 && percentage <= 100)) return fail(res, 400, "Percentage must be between 0 and 100");
      if (rank !== null && !(Number.isInteger(rank) && rank >= 1)) return fail(res, 400, "Invalid rank");
      if (!DIVISIONS.includes(row.division)) return fail(res, 400, "Invalid division");
      if (!RESULT_VALUES.includes(row.result)) return fail(res, 400, "Invalid result");

      operations.push({
        updateOne: {
          filter: { campusId: req.campusId, studentId: row.studentId, session },
          update: {
            $set: {
              schoolId: req.schoolId,
              className,
              sectionName,
              totalMarks: round2(totalMarks),
              maximumMarks,
              percentage: round2(percentage),
              division: row.division,
              rank,
              result: row.result,
              isManual: true,
            },
            $setOnInsert: { isLive: false },
          },
          upsert: true,
        },
      });
    }

    await ReportResult.bulkWrite(operations);

    res.status(200).json({ success: true, message: "Result saved successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.patch("/results/lock", async (req, res) => {
  try {
    const { className, sectionName } = req.body;
    const locked = Boolean(req.body.locked);

    if (!className || !sectionName) return fail(res, 400, "Please select class and section");

    const section = await loadSection(req, className, sectionName);
    if (section.error) return fail(res, 404, section.error);

    const session = sessionOf(section.students);

    if (locked && !(await ReportResult.exists({ campusId: req.campusId, session, className, sectionName }))) {
      return fail(res, 400, "Generate the result before locking it");
    }

    await ResultStatus.findOneAndUpdate(
      { campusId: req.campusId, session, className, sectionName },
      { $set: { schoolId: req.schoolId, isLocked: locked } },
      { upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, message: locked ? "Result locked" : "Result unlocked" });
  } catch (error) {
    serverError(res, error);
  }
});

router.patch("/results/live", async (req, res) => {
  try {
    const { className, sectionName } = req.body;
    const live = Boolean(req.body.live);
    const studentIds = Array.isArray(req.body.studentIds) ? req.body.studentIds : null;

    if (!className || !sectionName) return fail(res, 400, "Please select class and section");

    const section = await loadSection(req, className, sectionName);
    if (section.error) return fail(res, 404, section.error);

    const session = sessionOf(section.students);

    if (!(await ReportResult.exists({ campusId: req.campusId, session, className, sectionName }))) {
      return fail(res, 400, "Generate the result before making it live");
    }

    if (studentIds) {
      if (studentIds.length === 0 || !studentIds.every(isValidId)) return fail(res, 400, "Please select students");

      const allowed = new Set(section.students.map((s) => String(s._id)));
      if (!studentIds.every((id) => allowed.has(String(id)))) return fail(res, 400, "Student does not belong to the selected class section");

      await ReportResult.updateMany({ campusId: req.campusId, session, studentId: { $in: studentIds } }, { $set: { isLive: live } });
    } else {
      await ResultStatus.findOneAndUpdate(
        { campusId: req.campusId, session, className, sectionName },
        { $set: { schoolId: req.schoolId, isClassLive: live } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    res.status(200).json({ success: true, message: live ? "Result is now live" : "Result is no longer live" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   REPORT CARDS
========================================================== */

// Exams that have marks set up for the class section
router.get("/report-cards/exams", async (req, res) => {
  try {
    const { className, sectionName } = req.query;
    if (!className || !sectionName) return fail(res, 400, "Please select class and section");

    const examIds = await ExamMarksSetup.distinct("examId", {
      campusId: req.campusId,
      className,
      sectionName: { $in: ["", sectionName] },
    });

    const exams = examIds.length
      ? await Exam.find({ _id: { $in: examIds }, campusId: req.campusId }).select("examName").sort({ examName: 1 }).lean()
      : [];

    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    serverError(res, error);
  }
});

router.get("/report-cards/data", async (req, res) => {
  try {
    const { className, sectionName } = req.query;
    const examIds = String(req.query.examIds || "").split(",").filter(Boolean);

    if (!className || !sectionName) return fail(res, 400, "Please select class and section");
    if (examIds.length === 0 || !examIds.every(isValidId)) return fail(res, 400, "Please select at least one exam");

    const section = await loadSection(req, className, sectionName);
    if (section.error) return fail(res, 404, section.error);

    const session = sessionOf(section.students);
    const ids = section.students.map((s) => s._id);

    const [exams, subjectMap, setupDocs, markDocs, gradeDocs, results] = await Promise.all([
      Exam.find({ _id: { $in: examIds }, campusId: req.campusId }).select("examName").lean(),
      loadSubjectMap(req, className, section.students),
      ExamMarksSetup.find({ campusId: req.campusId, className, examId: { $in: examIds }, sectionName: { $in: ["", sectionName] } }).lean(),
      ids.length
        ? ScholasticMark.find({ campusId: req.campusId, examId: { $in: examIds }, studentId: { $in: ids } })
            .select("studentId examId subjectName marks")
            .lean()
        : [],
      ids.length
        ? CoScholasticGrade.find({ campusId: req.campusId, examId: { $in: examIds }, studentId: { $in: ids } })
            .select("studentId examId subjectName grade")
            .lean()
        : [],
      ids.length ? ReportResult.find({ campusId: req.campusId, session, studentId: { $in: ids } }).lean() : [],
    ]);

    const examOrder = new Map(examIds.map((id, index) => [id, index]));
    const orderedExams = exams.sort((a, b) => examOrder.get(String(a._id)) - examOrder.get(String(b._id)));

    const setups = effectiveSetups(setupDocs, sectionName);
    const maxMarks = {};
    setups.forEach((setup) => {
      const examKey = String(setup.examId);
      if (!maxMarks[examKey]) maxMarks[examKey] = {};
      maxMarks[examKey][setup.subjectName] = setup.maximumMarks;
    });

    const marksByStudent = new Map();
    markDocs.forEach((doc) => {
      const key = String(doc.studentId);
      if (!marksByStudent.has(key)) marksByStudent.set(key, {});
      const byExam = marksByStudent.get(key);
      if (!byExam[doc.examId]) byExam[doc.examId] = {};
      byExam[doc.examId][doc.subjectName] = doc.marks;
    });

    const gradesByStudent = new Map();
    gradeDocs.forEach((doc) => {
      const key = String(doc.studentId);
      if (!gradesByStudent.has(key)) gradesByStudent.set(key, {});
      const byExam = gradesByStudent.get(key);
      if (!byExam[doc.examId]) byExam[doc.examId] = {};
      byExam[doc.examId][doc.subjectName] = doc.grade;
    });

    const resultByStudent = new Map(results.map((item) => [String(item.studentId), item]));

    const students = section.students.map((student) => {
      const key = String(student._id);
      const mapping = subjectMap.get(key) || { scholastic: [], co: [] };
      const result = resultByStudent.get(key);

      return {
        _id: student._id,
        rollNo: rollOf(student),
        srNo: student.srNo,
        studentName: student.studentName,
        fatherName: student.fatherName,
        motherName: student.motherName,
        subjects: mapping.scholastic.filter((subjectName) =>
          orderedExams.some((exam) => maxMarks[String(exam._id)]?.[subjectName] !== undefined)
        ),
        marks: marksByStudent.get(key) || {},
        coScholastic: gradesByStudent.get(key) || {},
        result: result
          ? {
              totalMarks: result.totalMarks,
              maximumMarks: result.maximumMarks,
              percentage: result.percentage,
              division: result.division,
              rank: result.rank,
              result: result.result,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data: { session, exams: orderedExams, maxMarks, students, schoolInfo: schoolInfoOf(req.school) },
    });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   ANALYTICS — results, subject performance and entry progress
========================================================== */
router.get("/analytics", async (req, res) => {
  try {
    const campusId = req.campusId;

    const [exams, classes, results, markStats, entryStats, setups, studentCounts] = await Promise.all([
      Exam.find({ campusId }).select("examName").lean(),
      Class.find({ campusId }).select("className sections").sort({ className: 1 }).lean(),
      ReportResult.find({ campusId }).lean(),
      ScholasticMark.aggregate([
        { $match: { campusId } },
        {
          $group: {
            _id: { examId: "$examId", className: "$className", sectionName: "$sectionName", subjectName: "$subjectName" },
            entered: { $sum: 1 },
            absent: { $sum: { $cond: [{ $eq: ["$marks", "AB"] }, 1, 0] } },
            sum: { $sum: { $ifNull: ["$value", 0] } },
            scored: { $sum: { $cond: [{ $ne: ["$value", null] }, 1, 0] } },
            highest: { $max: "$value" },
            lowest: { $min: "$value" },
          },
        },
      ]),
      ScholasticMark.aggregate([
        { $match: { campusId } },
        {
          $group: {
            _id: { examId: "$examId", className: "$className", sectionName: "$sectionName", studentId: "$studentId" },
          },
        },
        {
          $group: {
            _id: { examId: "$_id.examId", className: "$_id.className", sectionName: "$_id.sectionName" },
            students: { $sum: 1 },
          },
        },
      ]),
      ExamMarksSetup.find({ campusId }).select("examId className sectionName subjectName maximumMarks").lean(),
      Admission.aggregate([
        { $match: { schoolId: req.schoolId, status: "Active" } },
        { $group: { _id: { className: "$className", sectionName: "$section" }, students: { $sum: 1 } } },
      ]),
    ]);

    const examName = new Map(exams.map((item) => [String(item._id), item.examName]));
    const countOf = new Map(studentCounts.map((item) => [`${item._id.className}|${item._id.sectionName}`, item.students]));

    const students = results.length
      ? await Admission.find({ _id: { $in: results.map((r) => r.studentId) } })
          .select("studentName fatherName srNo rollNumber rollNo")
          .lean()
      : [];
    const studentMap = new Map(students.map((student) => [String(student._id), student]));

    const resultRows = results
      .filter((item) => studentMap.has(String(item.studentId)))
      .map((item) => {
        const student = studentMap.get(String(item.studentId));
        return {
          session: item.session,
          className: item.className,
          sectionName: item.sectionName,
          rollNo: rollOf(student),
          srNo: student.srNo,
          studentName: student.studentName,
          fatherName: student.fatherName,
          totalMarks: item.totalMarks,
          maximumMarks: item.maximumMarks,
          percentage: item.percentage,
          division: item.division,
          rank: item.rank,
          result: item.result,
          isLive: item.isLive,
        };
      });

    // Effective maximum marks for a subject: section specific setup wins over the class-wide one
    const maxOf = (examId, className, sectionName, subjectName) => {
      const matches = setups.filter(
        (s) => String(s.examId) === String(examId) && s.className === className && s.subjectName === subjectName
      );
      return (matches.find((s) => s.sectionName === sectionName) || matches.find((s) => !s.sectionName))?.maximumMarks ?? null;
    };

    const subjectRows = markStats.map((item) => {
      const maximum = maxOf(item._id.examId, item._id.className, item._id.sectionName, item._id.subjectName);
      const average = item.scored > 0 ? round2(item.sum / item.scored) : 0;
      return {
        examName: examName.get(String(item._id.examId)) || "-",
        className: item._id.className,
        sectionName: item._id.sectionName,
        subjectName: item._id.subjectName,
        maximumMarks: maximum,
        entered: item.entered,
        absent: item.absent,
        average,
        averagePercent: maximum ? round2((average / maximum) * 100) : null,
        highest: item.highest ?? 0,
        lowest: item.lowest ?? 0,
      };
    });

    const progressRows = entryStats.map((item) => ({
      examName: examName.get(String(item._id.examId)) || "-",
      className: item._id.className,
      sectionName: item._id.sectionName,
      students: countOf.get(`${item._id.className}|${item._id.sectionName}`) || 0,
      studentsWithMarks: item.students,
    }));

    res.status(200).json({
      success: true,
      data: {
        classes: classes.map((item) => ({
          className: item.className,
          sections: (item.sections || []).map((section) => section.sectionName),
        })),
        exams: exams.map((item) => item.examName).sort(),
        results: resultRows,
        subjects: subjectRows,
        progress: progressRows,
        schoolInfo: schoolInfoOf(req.school),
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

module.exports = router;
