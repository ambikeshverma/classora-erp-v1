const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");

const Exam = require("../models/Exam");
const ExamMarksSetup = require("../models/ExamMarksSetup");
const ExamTimetable = require("../models/ExamTimetable");
const Class = require("../models/Class");
const ClassSubjectMapping = require("../models/ClassSubjectMapping");
const StudentSubjectMapping = require("../models/StudentSubjectMapping");
const Admission = require("../models/Admission");

const { escapeRegex } = require("../utils/feeEngine");

// Every exam record is stored against the school/campus resolved from the access token (schoolAuth)
router.use(schoolAuth, schoolAuth.checkModule("exam_tools"));

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const serverError = (res, error) => res.status(500).json({ success: false, message: error.message });
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const owner = (req) => ({ schoolId: req.schoolId, campusId: req.campusId });
const exactNameRegex = (name) => new RegExp(`^${escapeRegex(String(name).trim())}$`, "i");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const schoolInfoOf = (school) => ({
  schoolName: school?.schoolName || "",
  address: school?.address || "",
  email: school?.email || "",
  phone: school?.contactNo || "",
  website: school?.website || "",
  logo: school?.schoolLogo || "",
});

// Classes with their sections and the scholastic subjects mapped to each class (Academic Zone)
const loadClassContext = async (campusId) => {
  const [classes, mappings] = await Promise.all([
    Class.find({ campusId }).select("className sections").sort({ className: 1 }).lean(),
    ClassSubjectMapping.find({ campusId }).select("className scholasticSubjects").lean(),
  ]);

  const subjectsByClass = new Map(mappings.map((item) => [item.className, item.scholasticSubjects || []]));

  const list = classes.map((item) => ({
    className: item.className,
    sections: (item.sections || []).map((section) => section.sectionName),
    subjects: subjectsByClass.get(item.className) || [],
  }));

  return { list, map: new Map(list.map((item) => [item.className, item])) };
};

const findExam = (req, id) => Exam.findOne({ _id: id, campusId: req.campusId }).lean();

// Class, optional section and optional subject must exist, and the exam must apply to the class
const checkTarget = (exam, classMap, { className, sectionName, subjectName }) => {
  const info = classMap.get(className);
  if (!info) return `${className} was not found`;
  if (!exam.applicableClasses.includes(className)) return `${exam.examName} is not applicable to ${className}`;
  if (sectionName && !info.sections.includes(sectionName)) return `Section ${sectionName} was not found in ${className}`;
  if (subjectName && !info.subjects.includes(subjectName)) return `${subjectName} is not mapped to ${className}`;
  return "";
};

/* ==========================================================
   META — exams, classes (with sections and subjects) in one call
========================================================== */
router.get("/meta", async (req, res) => {
  try {
    const [exams, context] = await Promise.all([
      Exam.find({ campusId: req.campusId }).select("examName applicableClasses allowCoScholastic").sort({ examName: 1 }).lean(),
      loadClassContext(req.campusId),
    ]);

    res.status(200).json({
      success: true,
      data: { exams, classes: context.list, schoolInfo: schoolInfoOf(req.school) },
    });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   EXAM SETUP
========================================================== */
const examIsUsed = async (campusId, examId) => {
  const [hasMarks, hasTimetable] = await Promise.all([
    ExamMarksSetup.exists({ campusId, examId }),
    ExamTimetable.exists({ campusId, examId }),
  ]);
  return Boolean(hasMarks || hasTimetable);
};

const parseExamBody = async (req) => {
  const examName = String(req.body.examName || "").trim();
  const applicableClasses = [...new Set((Array.isArray(req.body.applicableClasses) ? req.body.applicableClasses : []).map(String))];

  if (!examName) return { error: "Please enter exam name" };
  if (applicableClasses.length === 0) return { error: "Please select applicable classes" };

  const context = await loadClassContext(req.campusId);
  const unknown = applicableClasses.find((name) => !context.map.has(name));
  if (unknown) return { error: `${unknown} was not found` };

  return { value: { examName, applicableClasses, allowCoScholastic: Boolean(req.body.allowCoScholastic) } };
};

router.get("/exams", async (req, res) => {
  try {
    const campusId = req.campusId;

    const [exams, marksUsed, timetableUsed] = await Promise.all([
      Exam.find({ campusId }).sort({ examName: 1 }).lean(),
      ExamMarksSetup.distinct("examId", { campusId }),
      ExamTimetable.distinct("examId", { campusId }),
    ]);

    const used = new Set([...marksUsed, ...timetableUsed].map(String));

    res.status(200).json({
      success: true,
      data: exams.map((exam) => ({ ...exam, isUsed: used.has(String(exam._id)) })),
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/exams", async (req, res) => {
  try {
    const { value, error } = await parseExamBody(req);
    if (error) return fail(res, 400, error);

    if (await Exam.exists({ campusId: req.campusId, examName: exactNameRegex(value.examName) })) {
      return fail(res, 400, "Exam name already exists");
    }

    const exam = await Exam.create({ ...owner(req), ...value });
    res.status(201).json({ success: true, message: "Exam added successfully", data: exam });
  } catch (error) {
    serverError(res, error);
  }
});

router.put("/exams/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid exam id");

    const exam = await findExam(req, req.params.id);
    if (!exam) return fail(res, 404, "Exam not found");

    if (await examIsUsed(req.campusId, exam._id)) {
      return fail(res, 400, "This exam is already used in other records. You cannot edit or delete it.");
    }

    const { value, error } = await parseExamBody(req);
    if (error) return fail(res, 400, error);

    if (await Exam.exists({ campusId: req.campusId, _id: { $ne: exam._id }, examName: exactNameRegex(value.examName) })) {
      return fail(res, 400, "Exam name already exists");
    }

    const updated = await Exam.findOneAndUpdate({ _id: exam._id, campusId: req.campusId }, { $set: value }, { new: true }).lean();
    res.status(200).json({ success: true, message: "Exam updated successfully", data: updated });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/exams/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid exam id");

    const exam = await findExam(req, req.params.id);
    if (!exam) return fail(res, 404, "Exam not found");

    if (await examIsUsed(req.campusId, exam._id)) {
      return fail(res, 400, "This exam is already used in other records. You cannot edit or delete it.");
    }

    await Exam.deleteOne({ _id: exam._id });
    res.status(200).json({ success: true, message: "Exam deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   EXAM MARKS SETUP (grouped by exam + class + section)
========================================================== */
router.get("/marks-setups", async (req, res) => {
  try {
    const { examId, className, sectionName, subjectName } = req.query;

    const match = { campusId: req.campusId };
    if (examId && isValidId(examId)) match.examId = new mongoose.Types.ObjectId(examId);
    if (className) match.className = className;
    if (sectionName) match.sectionName = sectionName;
    if (subjectName) match.subjectName = subjectName;

    const groups = await ExamMarksSetup.aggregate([
      { $match: match },
      {
        $group: {
          _id: { examId: "$examId", className: "$className", sectionName: "$sectionName" },
          examName: { $first: "$examName" },
          subjectCount: { $sum: 1 },
          marksEntryStarted: { $max: "$marksEntryStarted" },
          resultGenerated: { $max: "$resultGenerated" },
        },
      },
      { $sort: { examName: 1, "_id.className": 1, "_id.sectionName": 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: groups.map((group) => ({
        examId: group._id.examId,
        examName: group.examName,
        className: group._id.className,
        sectionName: group._id.sectionName,
        subjectCount: group.subjectCount,
        marksEntryStarted: Boolean(group.marksEntryStarted),
        resultGenerated: Boolean(group.resultGenerated),
      })),
    });
  } catch (error) {
    serverError(res, error);
  }
});

// Subjects mapped to the class, merged with any marks already set for the exam / section
router.get("/marks-setups/detail", async (req, res) => {
  try {
    const { examId, className } = req.query;
    const sectionName = req.query.sectionName || "";

    if (!examId || !isValidId(examId) || !className) return fail(res, 400, "Exam and class are required");

    const [exam, context, existing] = await Promise.all([
      findExam(req, examId),
      loadClassContext(req.campusId),
      ExamMarksSetup.find({ campusId: req.campusId, examId, className, sectionName }).lean(),
    ]);

    if (!exam) return fail(res, 404, "Exam not found");

    const classInfo = context.map.get(className);
    if (!classInfo) return fail(res, 404, "Class not found");

    const byName = new Map(existing.map((item) => [item.subjectName, item]));

    res.status(200).json({
      success: true,
      data: {
        applicable: exam.applicableClasses.includes(className),
        subjects: classInfo.subjects.map((subjectName) => {
          const setup = byName.get(subjectName);
          return {
            subjectName,
            maximumMarks: setup?.maximumMarks ?? "",
            passingMarks: setup?.passingMarks ?? "",
            marksEntryStarted: Boolean(setup?.marksEntryStarted),
            resultGenerated: Boolean(setup?.resultGenerated),
          };
        }),
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/marks-setups", async (req, res) => {
  try {
    const { examId, className } = req.body;
    const sectionName = String(req.body.sectionName || "");
    const subjects = Array.isArray(req.body.subjects) ? req.body.subjects : [];

    if (!examId || !isValidId(examId) || !className) return fail(res, 400, "Please select exam and class");
    if (subjects.length === 0) return fail(res, 400, "No subject mapped with selected class");

    const [exam, context] = await Promise.all([findExam(req, examId), loadClassContext(req.campusId)]);
    if (!exam) return fail(res, 404, "Exam not found");

    const targetError = checkTarget(exam, context.map, { className, sectionName });
    if (targetError) return fail(res, 400, targetError);

    const allowed = new Set(context.map.get(className).subjects);
    const clean = [];

    for (const item of subjects) {
      const maximumMarks = Number(item.maximumMarks);
      const hasPassing = item.passingMarks !== "" && item.passingMarks != null;
      const passingMarks = hasPassing ? Number(item.passingMarks) : null;

      if (!allowed.has(item.subjectName)) return fail(res, 400, `${item.subjectName} is not mapped to ${className}`);
      if (!(maximumMarks > 0)) return fail(res, 400, "Please fill maximum marks for all subjects");
      if (hasPassing && !(passingMarks >= 0)) return fail(res, 400, "Invalid passing marks");
      if (hasPassing && passingMarks > maximumMarks) return fail(res, 400, "Passing marks cannot exceed maximum marks");

      clean.push({ subjectName: item.subjectName, maximumMarks, passingMarks });
    }

    // Once marks entry has started the maximum marks of that subject are locked
    const existing = await ExamMarksSetup.find({ campusId: req.campusId, examId, className, sectionName })
      .select("subjectName maximumMarks marksEntryStarted")
      .lean();
    const locked = new Map(existing.filter((item) => item.marksEntryStarted).map((item) => [item.subjectName, item.maximumMarks]));

    const changedLocked = clean.find((item) => locked.has(item.subjectName) && locked.get(item.subjectName) !== item.maximumMarks);
    if (changedLocked) {
      return fail(res, 400, `Maximum marks of ${changedLocked.subjectName} cannot be changed because marks entry has started`);
    }

    await ExamMarksSetup.bulkWrite(
      clean.map((item) => ({
        updateOne: {
          filter: { campusId: req.campusId, examId: exam._id, className, sectionName, subjectName: item.subjectName },
          update: {
            $set: { schoolId: req.schoolId, examName: exam.examName, maximumMarks: item.maximumMarks, passingMarks: item.passingMarks },
            $setOnInsert: { marksEntryStarted: false, resultGenerated: false },
          },
          upsert: true,
        },
      }))
    );

    res.status(200).json({ success: true, message: "Marks setup saved successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/marks-setups", async (req, res) => {
  try {
    const { examId, className } = req.query;
    const sectionName = req.query.sectionName || "";

    if (!examId || !isValidId(examId) || !className) return fail(res, 400, "Select setup");

    const filter = { campusId: req.campusId, examId, className, sectionName };

    if (await ExamMarksSetup.exists({ ...filter, $or: [{ marksEntryStarted: true }, { resultGenerated: true }] })) {
      return fail(res, 400, "Marks entry/result already exists. Setup cannot be deleted.");
    }

    const result = await ExamMarksSetup.deleteMany(filter);
    if (result.deletedCount === 0) return fail(res, 404, "Marks setup not found");

    res.status(200).json({ success: true, message: "Marks setup deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   EXAM TIMETABLE
========================================================== */
const validateSchedule = ({ examDate, startTime, endTime, subjectName }) => {
  if (!subjectName || !examDate || !startTime || !endTime) return "Please fill all required fields";
  if (!DATE_PATTERN.test(String(examDate))) return "Valid exam date is required";
  if (!TIME_PATTERN.test(String(startTime)) || !TIME_PATTERN.test(String(endTime))) return "Valid start and end time are required";
  if (endTime <= startTime) return "End time cannot be before start time";
  return "";
};

// Another paper of the same exam for the same class section at an overlapping time
const findClash = (req, examId, targets, { examDate, startTime, endTime }, excludeId) =>
  ExamTimetable.findOne({
    campusId: req.campusId,
    examId,
    examDate,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
    $or: targets.map((target) => ({ className: target.className, sectionName: target.sectionName })),
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

router.get("/timetables", async (req, res) => {
  try {
    const { examId, className, sectionName } = req.query;

    const filter = { campusId: req.campusId };
    if (examId && isValidId(examId)) filter.examId = examId;
    if (className) filter.className = className;
    if (sectionName) filter.sectionName = sectionName;

    const items = await ExamTimetable.find(filter)
      .select("-schoolId -campusId")
      .sort({ examName: 1, className: 1, sectionName: 1, examDate: 1, startTime: 1 })
      .lean();

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/timetables", async (req, res) => {
  try {
    const { examId, subjectName, examDate, startTime, endTime } = req.body;
    const targets = Array.isArray(req.body.targets) ? req.body.targets : [];

    if (!examId || !isValidId(examId)) return fail(res, 400, "Please fill all required fields");
    if (targets.length === 0) return fail(res, 400, "Please select class and section");

    const scheduleError = validateSchedule({ examDate, startTime, endTime, subjectName });
    if (scheduleError) return fail(res, 400, scheduleError);

    const [exam, context] = await Promise.all([findExam(req, examId), loadClassContext(req.campusId)]);
    if (!exam) return fail(res, 404, "Exam not found");

    const seen = new Set();
    for (const target of targets) {
      const key = `${target.className}|${target.sectionName}`;
      if (!target.sectionName) return fail(res, 400, "Please select class and section");
      if (seen.has(key)) return fail(res, 400, "Duplicate class section selected");
      seen.add(key);

      const targetError = checkTarget(exam, context.map, { ...target, subjectName });
      if (targetError) return fail(res, 400, targetError);
    }

    const duplicate = await ExamTimetable.findOne({
      campusId: req.campusId,
      examId,
      subjectName,
      $or: targets.map((target) => ({ className: target.className, sectionName: target.sectionName })),
    }).lean();
    if (duplicate) {
      return fail(res, 400, `Duplicate timetable not allowed (${duplicate.className} - ${duplicate.sectionName} already has ${subjectName})`);
    }

    const clash = await findClash(req, examId, targets, { examDate, startTime, endTime });
    if (clash) {
      return fail(res, 400, `${clash.className} - ${clash.sectionName} already has ${clash.subjectName} at that time`);
    }

    await ExamTimetable.insertMany(
      targets.map((target) => ({
        ...owner(req),
        examId: exam._id,
        examName: exam.examName,
        className: target.className,
        sectionName: target.sectionName,
        subjectName,
        examDate,
        startTime,
        endTime,
      }))
    );

    res.status(201).json({
      success: true,
      message: targets.length > 1 ? "Multi class timetable added successfully" : "Timetable added successfully",
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.put("/timetables/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid timetable id");

    const { examId, className, sectionName, subjectName, examDate, startTime, endTime } = req.body;
    if (!examId || !isValidId(examId) || !className || !sectionName) return fail(res, 400, "Please fill all required fields");

    const scheduleError = validateSchedule({ examDate, startTime, endTime, subjectName });
    if (scheduleError) return fail(res, 400, scheduleError);

    const [exam, context, current] = await Promise.all([
      findExam(req, examId),
      loadClassContext(req.campusId),
      ExamTimetable.findOne({ _id: req.params.id, campusId: req.campusId }).select("_id").lean(),
    ]);
    if (!current) return fail(res, 404, "Timetable not found");
    if (!exam) return fail(res, 404, "Exam not found");

    const targetError = checkTarget(exam, context.map, { className, sectionName, subjectName });
    if (targetError) return fail(res, 400, targetError);

    if (
      await ExamTimetable.exists({
        campusId: req.campusId,
        _id: { $ne: current._id },
        examId,
        className,
        sectionName,
        subjectName,
      })
    ) {
      return fail(res, 400, "Duplicate timetable not allowed");
    }

    const clash = await findClash(req, examId, [{ className, sectionName }], { examDate, startTime, endTime }, current._id);
    if (clash) return fail(res, 400, `${clash.className} - ${clash.sectionName} already has ${clash.subjectName} at that time`);

    const updated = await ExamTimetable.findOneAndUpdate(
      { _id: current._id, campusId: req.campusId },
      { $set: { examId: exam._id, examName: exam.examName, className, sectionName, subjectName, examDate, startTime, endTime } },
      { new: true }
    ).lean();

    res.status(200).json({ success: true, message: "Timetable updated successfully", data: updated });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/timetables", async (req, res) => {
  try {
    const ids = String(req.query.ids || "")
      .split(",")
      .filter(Boolean);

    if (ids.length === 0 || !ids.every(isValidId)) return fail(res, 400, "Please select timetable");

    const result = await ExamTimetable.deleteMany({ _id: { $in: ids }, campusId: req.campusId });
    if (result.deletedCount === 0) return fail(res, 404, "Timetable not found");

    res.status(200).json({ success: true, message: "Timetable deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   ADMIT CARD AND DESKSLIP — class timetable plus its active students
========================================================== */
router.get("/admit-cards", async (req, res) => {
  try {
    const { examId, className, sectionName } = req.query;
    if (!examId || !isValidId(examId) || !className || !sectionName) {
      return fail(res, 400, "Select exam, class and section");
    }

    const exam = await findExam(req, examId);
    if (!exam) return fail(res, 404, "Exam not found");

    const [timetable, students] = await Promise.all([
      ExamTimetable.find({ campusId: req.campusId, examId, className, sectionName })
        .select("subjectName examDate startTime endTime")
        .sort({ examDate: 1, startTime: 1 })
        .lean(),
      Admission.find({ schoolId: req.schoolId, status: "Active", className, section: sectionName })
        .select("studentName fatherName motherName dob gender srNo schoolAdmissionNo rollNumber rollNo")
        .lean(),
    ]);

    // Students with their own subject choice only get those papers on the admit card
    const mappings = students.length
      ? await StudentSubjectMapping.find({ campusId: req.campusId, studentId: { $in: students.map((s) => s._id) } })
          .select("studentId scholasticSubjects")
          .lean()
      : [];
    const subjectsByStudent = new Map(mappings.map((item) => [String(item.studentId), item.scholasticSubjects || []]));

    const rows = students
      .map((student) => ({
        _id: student._id,
        studentName: student.studentName,
        fatherName: student.fatherName,
        motherName: student.motherName,
        dob: student.dob,
        gender: student.gender,
        srNo: student.srNo,
        admissionNo: student.schoolAdmissionNo || "",
        rollNo: student.rollNumber || student.rollNo || "",
        subjects: subjectsByStudent.has(String(student._id)) ? subjectsByStudent.get(String(student._id)) : null,
      }))
      .sort((a, b) => {
        const ra = Number(a.rollNo) || Infinity;
        const rb = Number(b.rollNo) || Infinity;
        return ra !== rb ? ra - rb : a.studentName.localeCompare(b.studentName);
      });

    res.status(200).json({
      success: true,
      data: { exam: { _id: exam._id, examName: exam.examName }, timetable, students: rows, schoolInfo: schoolInfoOf(req.school) },
    });
  } catch (error) {
    serverError(res, error);
  }
});

module.exports = router;
