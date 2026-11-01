const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");

const TransportRoute = require("../models/TransportRoute");
const StudentTransport = require("../models/StudentTransport");
const Vehicle = require("../models/Vehicle");
const Admission = require("../models/Admission");
const Staff = require("../models/Staff");
const Position = require("../models/Position");
const Class = require("../models/Class");
const FeeScheme = require("../models/FeeScheme");
const FeeReceipt = require("../models/FeeReceipt");

const { getPeriods, getCurrentSession, escapeRegex, TRANSPORT_HEAD } = require("../utils/feeEngine");

// Records are stored against the school/campus resolved from the access token
router.use(
  schoolAuth,
  schoolAuth.guardRoutes("transport", [
    { re: /^\/meta/, sub: null },
    { re: /^\/routes/, method: "GET", sub: null },
    { re: /^\/routes/, sub: "route_management" },
    { re: /^\/(vehicles|staff-options)/, sub: "vehicle_management" },
    { re: /^\/allocations/, sub: "student_transport_allocation" },
    { re: /^\/reports/, sub: "transport_reports" },
  ])
);

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const serverError = (res, error) => res.status(500).json({ success: false, message: error.message });
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const exactNameRegex = (name) => new RegExp(`^${escapeRegex(String(name).trim())}$`, "i");
const owner = (req) => ({ schoolId: req.schoolId, campusId: req.campusId });

const NOT_ASSIGNED = "Not Assigned";

/* ==========================================================
   META — everything the transport screens need in one call
========================================================== */
router.get("/meta", async (req, res) => {
  try {
    const campusId = req.campusId;

    const [routes, vehicles, classes, scheme] = await Promise.all([
      TransportRoute.find({ campusId }).select("routeName monthlyFee").sort({ routeName: 1 }).lean(),
      Vehicle.find({ campusId }).select("vehicleName vehicleNo totalSeats").sort({ vehicleName: 1 }).lean(),
      Class.find({ campusId }).select("className sections").sort({ className: 1 }).lean(),
      FeeScheme.findOne({ campusId }).select("schemeType installmentCount").lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        routes,
        vehicles,
        classes: classes.map((item) => ({
          className: item.className,
          sections: (item.sections || []).map((section) => section.sectionName),
        })),
        // Periods follow the school's fee scheme so removed periods line up with fee collection
        periods: getPeriods(scheme?.schemeType || "Monthly", scheme?.installmentCount),
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   ROUTES
========================================================== */
const validateRoute = (body) => {
  const routeName = String(body.routeName || "").trim();
  const monthlyFee = Number(body.monthlyFee);
  const distance = body.distance === "" || body.distance == null ? 0 : Number(body.distance);

  if (!routeName) return { error: "Route name is required" };
  if (!(monthlyFee > 0)) return { error: "Monthly fee must be greater than zero" };
  if (!(distance >= 0)) return { error: "Distance cannot be negative" };

  return {
    value: {
      routeName,
      startPoint: String(body.startPoint || "").trim(),
      endPoint: String(body.endPoint || "").trim(),
      distance,
      monthlyFee,
    },
  };
};

// GET all routes with whether students are allocated to each (lets the UI block deletes)
router.get("/routes", async (req, res) => {
  try {
    const [routes, allocations] = await Promise.all([
      TransportRoute.find({ campusId: req.campusId }).sort({ routeName: 1 }).lean(),
      StudentTransport.aggregate([
        { $match: { campusId: req.campusId } },
        { $group: { _id: "$routeId", students: { $sum: 1 } } },
      ]),
    ]);

    const counts = new Map(allocations.map((a) => [String(a._id), a.students]));

    res.status(200).json({
      success: true,
      data: routes.map((route) => ({
        ...route,
        isAssigned: (counts.get(String(route._id)) || 0) > 0,
      })),
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/routes", async (req, res) => {
  try {
    const { value, error } = validateRoute(req.body);
    if (error) return fail(res, 400, error);

    if (await TransportRoute.exists({ campusId: req.campusId, routeName: exactNameRegex(value.routeName) })) {
      return fail(res, 400, "Route name already exists");
    }

    const created = await TransportRoute.create({ ...owner(req), ...value });
    res.status(201).json({ success: true, message: "Route added successfully", data: created });
  } catch (error) {
    serverError(res, error);
  }
});

router.put("/routes/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid route id");

    const { value, error } = validateRoute(req.body);
    if (error) return fail(res, 400, error);

    if (
      await TransportRoute.exists({
        campusId: req.campusId,
        _id: { $ne: req.params.id },
        routeName: exactNameRegex(value.routeName),
      })
    ) {
      return fail(res, 400, "Route name already exists");
    }

    const existing = await TransportRoute.findOne({ _id: req.params.id, campusId: req.campusId }).select("routeName").lean();
    if (!existing) return fail(res, 404, "Route not found");

    const updated = await TransportRoute.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: value },
      { new: true }
    ).lean();

    // The route name is also stored with allocations and student profiles, so renames are carried over
    if (existing.routeName !== value.routeName) {
      await Promise.all([
        StudentTransport.updateMany({ campusId: req.campusId, routeId: updated._id }, { $set: { routeName: value.routeName } }),
        Admission.updateMany({ schoolId: req.schoolId, routeName: existing.routeName }, { $set: { routeName: value.routeName } }),
      ]);
    }

    res.status(200).json({ success: true, message: "Route updated successfully", data: updated });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/routes/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid route id");

    if (await StudentTransport.exists({ campusId: req.campusId, routeId: req.params.id })) {
      return fail(res, 400, "This route is assigned to students and cannot be deleted.");
    }

    const removed = await TransportRoute.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!removed) return fail(res, 404, "Route not found");

    res.status(200).json({ success: true, message: "Route deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   VEHICLES (driver and conductor come from HR & Staff)
========================================================== */
const MAX_DOCUMENT_CHARS = 8 * 1024 * 1024; // data URL length, roughly a 6MB file
const ALLOWED_DOCUMENT_TYPES = ["data:application/pdf", "data:image/jpeg", "data:image/jpg", "data:image/png"];

// Staff holding a position that contains "driver" / "conductor" (e.g. "Bus Driver")
router.get("/staff-options", async (req, res) => {
  try {
    const campusId = req.campusId;
    const positions = await Position.find({ campusId, positionName: { $regex: /driver|conductor/i } })
      .select("positionName")
      .lean();

    const staff = positions.length
      ? await Staff.find({
          campusId,
          positionId: { $in: positions.map((item) => item._id) },
          isActive: { $ne: false },
          lastWorkingDate: { $in: ["", null] },
        })
          .select("employeeName mobile positionId")
          .sort({ employeeName: 1 })
          .lean()
      : [];

    const positionName = new Map(positions.map((item) => [String(item._id), item.positionName]));
    const pick = (pattern) =>
      staff
        .filter((item) => pattern.test(positionName.get(String(item.positionId)) || ""))
        .map((item) => ({ _id: item._id, name: item.employeeName, mobile: item.mobile }));

    res.status(200).json({ success: true, data: { drivers: pick(/driver/i), conductors: pick(/conductor/i) } });
  } catch (error) {
    serverError(res, error);
  }
});

const documentMeta = (doc) => ({
  _id: doc._id,
  documentType: doc.documentType,
  fileName: doc.fileName,
  uploadedAt: doc.uploadedAt,
});

// Resolves driver/conductor details from HR so the vehicle always shows current names and mobiles
const resolveCrew = async (req, driverId, conductorId) => {
  const ids = [driverId, conductorId].filter((id) => id && isValidId(id));
  const staff = ids.length
    ? await Staff.find({ _id: { $in: ids }, campusId: req.campusId }).select("employeeName mobile").lean()
    : [];
  const byId = new Map(staff.map((item) => [String(item._id), item]));

  const crew = (id) => {
    const member = id ? byId.get(String(id)) : null;
    return { id: member ? member._id : null, name: member?.employeeName || "", mobile: member?.mobile || "" };
  };

  return { driver: crew(driverId), conductor: crew(conductorId), missing: ids.some((id) => !byId.has(String(id))) };
};

const parseVehicleBody = (body) => {
  const vehicleName = String(body.vehicleName || "").trim();
  const vehicleNo = String(body.vehicleNo || "").trim().toUpperCase();
  const totalSeats = Number(body.totalSeats);

  if (!vehicleName || !totalSeats) return { error: "Vehicle name and total seats are required" };
  if (!(totalSeats > 0)) return { error: "Total seats must be greater than zero" };

  return { value: { vehicleName, vehicleNo: vehicleNo || undefined, totalSeats, madeYear: String(body.madeYear || "") } };
};

const validateNewDocuments = (items) => {
  for (const doc of items) {
    if (!doc.documentType || !doc.fileUrl) return "Document type and file are required";
    if (!ALLOWED_DOCUMENT_TYPES.some((prefix) => String(doc.fileUrl).startsWith(prefix))) {
      return "Only PDF, JPG, JPEG and PNG files are allowed";
    }
    if (String(doc.fileUrl).length > MAX_DOCUMENT_CHARS) return "File is too large (max 6 MB)";
  }
  return "";
};

// Applies document changes: removed types first, then uploads replace documents of the same type
const applyDocumentChanges = (documents, newDocuments, removeTypes) => {
  let next = documents.filter((doc) => !removeTypes.includes(doc.documentType));
  newDocuments.forEach((doc) => {
    next = next.filter((item) => item.documentType !== doc.documentType);
    next.push({ documentType: doc.documentType, fileName: doc.fileName || "", fileUrl: doc.fileUrl, uploadedAt: new Date() });
  });
  return next;
};

router.get("/vehicles", async (req, res) => {
  try {
    const [vehicles, allocations] = await Promise.all([
      Vehicle.find({ campusId: req.campusId }).select("-documents.fileUrl").sort({ vehicleName: 1 }).lean(),
      StudentTransport.aggregate([
        { $match: { campusId: req.campusId, vehicleId: { $ne: null } } },
        { $group: { _id: "$vehicleId", students: { $sum: 1 } } },
      ]),
    ]);

    const counts = new Map(allocations.map((a) => [String(a._id), a.students]));
    const staffIds = [...new Set(vehicles.flatMap((v) => [v.driverId, v.conductorId]).filter(Boolean).map(String))];
    const staff = staffIds.length
      ? await Staff.find({ _id: { $in: staffIds } }).select("employeeName mobile").lean()
      : [];
    const staffMap = new Map(staff.map((item) => [String(item._id), item]));

    res.status(200).json({
      success: true,
      data: vehicles.map((vehicle) => {
        const driver = staffMap.get(String(vehicle.driverId));
        const conductor = staffMap.get(String(vehicle.conductorId));
        return {
          ...vehicle,
          driverName: driver?.employeeName || vehicle.driverName,
          driverMobile: driver?.mobile || vehicle.driverMobile,
          conductorName: conductor?.employeeName || vehicle.conductorName,
          conductorMobile: conductor?.mobile || vehicle.conductorMobile,
          documents: (vehicle.documents || []).map(documentMeta),
          studentCount: counts.get(String(vehicle._id)) || 0,
          isAssigned: (counts.get(String(vehicle._id)) || 0) > 0,
        };
      }),
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/vehicles", async (req, res) => {
  try {
    const { value, error } = parseVehicleBody(req.body);
    if (error) return fail(res, 400, error);

    const newDocuments = Array.isArray(req.body.newDocuments) ? req.body.newDocuments : [];
    const documentError = validateNewDocuments(newDocuments);
    if (documentError) return fail(res, 400, documentError);

    if (await Vehicle.exists({ campusId: req.campusId, vehicleName: exactNameRegex(value.vehicleName) })) {
      return fail(res, 400, "Vehicle name already exists");
    }
    if (value.vehicleNo && (await Vehicle.exists({ campusId: req.campusId, vehicleNo: value.vehicleNo }))) {
      return fail(res, 400, "Vehicle number already exists");
    }

    const crew = await resolveCrew(req, req.body.driverId, req.body.conductorId);
    if (crew.missing) return fail(res, 400, "Selected driver or conductor was not found in staff");

    const vehicle = await Vehicle.create({
      ...owner(req),
      ...value,
      driverId: crew.driver.id,
      driverName: crew.driver.name,
      driverMobile: crew.driver.mobile,
      conductorId: crew.conductor.id,
      conductorName: crew.conductor.name,
      conductorMobile: crew.conductor.mobile,
      documents: applyDocumentChanges([], newDocuments, []),
    });

    res.status(201).json({ success: true, message: "Vehicle added successfully", data: { _id: vehicle._id } });
  } catch (error) {
    serverError(res, error);
  }
});

router.put("/vehicles/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid vehicle id");

    const { value, error } = parseVehicleBody(req.body);
    if (error) return fail(res, 400, error);

    const newDocuments = Array.isArray(req.body.newDocuments) ? req.body.newDocuments : [];
    const removeTypes = Array.isArray(req.body.removeDocumentTypes) ? req.body.removeDocumentTypes : [];
    const documentError = validateNewDocuments(newDocuments);
    if (documentError) return fail(res, 400, documentError);

    const vehicle = await Vehicle.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!vehicle) return fail(res, 404, "Vehicle not found");

    if (
      await Vehicle.exists({
        campusId: req.campusId,
        _id: { $ne: vehicle._id },
        vehicleName: exactNameRegex(value.vehicleName),
      })
    ) {
      return fail(res, 400, "Vehicle name already exists");
    }
    if (value.vehicleNo && (await Vehicle.exists({ campusId: req.campusId, _id: { $ne: vehicle._id }, vehicleNo: value.vehicleNo }))) {
      return fail(res, 400, "Vehicle number already exists");
    }

    // Seats cannot drop below the students already travelling in this vehicle
    const allocated = await StudentTransport.countDocuments({ campusId: req.campusId, vehicleId: vehicle._id });
    if (value.totalSeats < allocated) {
      return fail(res, 400, `${allocated} students are allocated to this vehicle. Seats cannot be fewer than that.`);
    }

    const crew = await resolveCrew(req, req.body.driverId, req.body.conductorId);
    if (crew.missing) return fail(res, 400, "Selected driver or conductor was not found in staff");

    const oldName = vehicle.vehicleName;
    const oldNo = vehicle.vehicleNo || "";

    vehicle.vehicleName = value.vehicleName;
    vehicle.vehicleNo = value.vehicleNo;
    vehicle.totalSeats = value.totalSeats;
    vehicle.madeYear = value.madeYear;
    vehicle.driverId = crew.driver.id;
    vehicle.driverName = crew.driver.name;
    vehicle.driverMobile = crew.driver.mobile;
    vehicle.conductorId = crew.conductor.id;
    vehicle.conductorName = crew.conductor.name;
    vehicle.conductorMobile = crew.conductor.mobile;
    vehicle.documents = applyDocumentChanges(vehicle.documents.map((d) => d.toObject()), newDocuments, removeTypes);
    await vehicle.save();

    // Allocations and student profiles store the vehicle label, so renames are carried over
    if (oldName !== value.vehicleName || oldNo !== (value.vehicleNo || "")) {
      const label = value.vehicleName || value.vehicleNo;
      await Promise.all([
        StudentTransport.updateMany(
          { campusId: req.campusId, vehicleId: vehicle._id },
          { $set: { vehicleName: value.vehicleName, vehicleNo: value.vehicleNo || "" } }
        ),
        Admission.updateMany(
          { schoolId: req.schoolId, vehicleName: oldName || oldNo },
          { $set: { vehicleName: label } }
        ),
      ]);
    }

    res.status(200).json({ success: true, message: "Vehicle updated successfully", data: { _id: vehicle._id } });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/vehicles/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid vehicle id");

    if (await StudentTransport.exists({ campusId: req.campusId, vehicleId: req.params.id })) {
      return fail(res, 400, "Assigned vehicle cannot be deleted");
    }

    const removed = await Vehicle.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!removed) return fail(res, 404, "Vehicle not found");

    res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.get("/vehicles/:id/documents/:docId", async (req, res) => {
  try {
    if (!isValidId(req.params.id) || !isValidId(req.params.docId)) return fail(res, 400, "Invalid id");

    const vehicle = await Vehicle.findOne({ _id: req.params.id, campusId: req.campusId }).select("documents").lean();
    const doc = vehicle?.documents?.find((item) => String(item._id) === req.params.docId);
    if (!doc) return fail(res, 404, "Document not found");

    res.status(200).json({ success: true, data: { fileName: doc.fileName, fileUrl: doc.fileUrl } });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   STUDENT TRANSPORT ALLOCATION
   (same StudentTransport records that drive Transport Fee in Fee Manager)
========================================================== */
const vehicleLabel = (vehicle) => vehicle.vehicleName || vehicle.vehicleNo;

// A period (or the whole allocation) cannot be removed once its transport fee has been collected
const transportPaid = (req, studentId, session, periodKey) => {
  const rowMatch = { source: "Transport", paid: { $gt: 0 } };
  if (periodKey) rowMatch.rowKey = `Transport|${periodKey}|${TRANSPORT_HEAD}|`;

  return FeeReceipt.exists({
    campusId: req.campusId,
    studentId,
    session,
    status: "Active",
    rows: { $elemMatch: rowMatch },
  });
};

// Active students with their current-session allocation; loaded only for a search (never the whole school)
router.get("/allocations", async (req, res) => {
  try {
    const { className, section, q } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);

    const filter = { schoolId: req.schoolId, status: "Active" };
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (q && String(q).trim()) {
      const rx = new RegExp(escapeRegex(String(q).trim()), "i");
      filter.$or = [{ studentName: rx }, { fatherName: rx }, { srNo: rx }, { schoolAdmissionNo: rx }, { mobile: rx }];
    }

    const [students, total] = await Promise.all([
      Admission.find(filter)
        .select("studentName fatherName mobile srNo schoolAdmissionNo className section session")
        .sort({ studentName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Admission.countDocuments(filter),
    ]);

    const allocations = students.length
      ? await StudentTransport.find({ campusId: req.campusId, studentId: { $in: students.map((s) => s._id) } })
          .select("studentId session routeId routeName monthlyFee vehicleId vehicleName vehicleNo removedPeriods")
          .lean()
      : [];

    const byStudent = new Map();
    allocations.forEach((item) => byStudent.set(`${item.studentId}|${item.session}`, item));

    const items = students.map((student) => {
      const session = student.session || getCurrentSession();
      const allocation = byStudent.get(`${student._id}|${session}`);
      return {
        _id: student._id,
        studentName: student.studentName,
        fatherName: student.fatherName,
        mobile: student.mobile,
        srNo: student.srNo,
        admissionNo: student.schoolAdmissionNo || "",
        className: student.className,
        section: student.section,
        session,
        allocation: allocation
          ? {
              routeId: allocation.routeId,
              routeName: allocation.routeName,
              monthlyFee: allocation.monthlyFee,
              vehicleId: allocation.vehicleId,
              vehicleName: allocation.vehicleName,
              vehicleNo: allocation.vehicleNo,
              removedPeriods: allocation.removedPeriods || [],
            }
          : null,
      };
    });

    res.status(200).json({ success: true, data: { items, total, page, pages: Math.max(Math.ceil(total / limit), 1) } });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/allocations/bulk", async (req, res) => {
  try {
    const { studentIds, routeId, vehicleId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0 || !studentIds.every(isValidId)) {
      return fail(res, 400, "Select student");
    }
    if (!routeId || !vehicleId || !isValidId(routeId) || !isValidId(vehicleId)) {
      return fail(res, 400, "Select route and vehicle");
    }

    const [route, vehicle, students] = await Promise.all([
      TransportRoute.findOne({ _id: routeId, campusId: req.campusId, isActive: true }).lean(),
      Vehicle.findOne({ _id: vehicleId, campusId: req.campusId }).lean(),
      Admission.find({ _id: { $in: studentIds }, schoolId: req.schoolId, status: "Active" })
        .select("session")
        .lean(),
    ]);

    if (!route || !vehicle) return fail(res, 400, "Invalid route or vehicle");
    if (students.length === 0) return fail(res, 404, "No active student found");

    const sessionOf = (student) => student.session || getCurrentSession();
    const existing = await StudentTransport.find({
      campusId: req.campusId,
      studentId: { $in: students.map((s) => s._id) },
    })
      .select("studentId session routeId vehicleId")
      .lean();
    const existingByKey = new Map(existing.map((item) => [`${item.studentId}|${item.session}`, item]));

    // Seat check per session: students already in the vehicle stay, newly added ones need free seats
    const sessions = [...new Set(students.map(sessionOf))];
    for (const session of sessions) {
      const alreadyInVehicle = await StudentTransport.countDocuments({
        campusId: req.campusId,
        vehicleId: vehicle._id,
        session,
      });
      const newcomers = students.filter(
        (student) =>
          sessionOf(student) === session &&
          String(existingByKey.get(`${student._id}|${session}`)?.vehicleId || "") !== String(vehicle._id)
      ).length;

      if (alreadyInVehicle + newcomers > vehicle.totalSeats) {
        return fail(
          res,
          400,
          `${vehicleLabel(vehicle)} has ${vehicle.totalSeats} seats and ${alreadyInVehicle} are already taken for ${session}.`
        );
      }
    }

    const allocated = [];
    const skipped = [];

    for (const student of students) {
      const session = sessionOf(student);
      const current = existingByKey.get(`${student._id}|${session}`);

      // Changing the route after transport fee was collected would change paid months
      if (current && String(current.routeId) !== String(route._id) && (await transportPaid(req, student._id, session))) {
        skipped.push(String(student._id));
        continue;
      }

      await StudentTransport.findOneAndUpdate(
        { campusId: req.campusId, studentId: student._id, session },
        {
          $set: {
            schoolId: req.schoolId,
            routeId: route._id,
            routeName: route.routeName,
            monthlyFee: route.monthlyFee,
            vehicleId: vehicle._id,
            vehicleName: vehicle.vehicleName,
            vehicleNo: vehicle.vehicleNo || "",
          },
        },
        { upsert: true, setDefaultsOnInsert: true }
      );

      allocated.push(student._id);
    }

    // Student profiles show the route and vehicle currently allocated
    if (allocated.length) {
      await Admission.updateMany(
        { _id: { $in: allocated }, schoolId: req.schoolId },
        { $set: { routeName: route.routeName, vehicleName: vehicleLabel(vehicle) } }
      );
    }

    res.status(200).json({
      success: true,
      message:
        skipped.length > 0
          ? `${allocated.length} student(s) allocated. ${skipped.length} skipped because their transport fee is already collected for another route.`
          : "Transport allocated successfully",
      data: { allocated: allocated.length, skipped: skipped.length },
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/allocations/remove", async (req, res) => {
  try {
    const { studentId, mode } = req.body;
    const periods = Array.isArray(req.body.periods) ? req.body.periods : [];

    if (!studentId || !isValidId(studentId)) return fail(res, 400, "Select one student");
    if (!["FULL", "MONTHS"].includes(mode)) return fail(res, 400, "Invalid remove type");

    const student = await Admission.findOne({ _id: studentId, schoolId: req.schoolId }).select("session").lean();
    if (!student) return fail(res, 404, "Student not found");

    const session = student.session || getCurrentSession();
    const allocation = await StudentTransport.findOne({ campusId: req.campusId, studentId, session }).lean();
    if (!allocation) return fail(res, 400, "Transport is not allocated to this student");

    if (mode === "FULL") {
      if (await transportPaid(req, studentId, session)) {
        return fail(res, 400, "Transport fee is already collected for this student. Cancel those receipts first.");
      }

      await StudentTransport.deleteOne({ _id: allocation._id });
      await Admission.updateOne({ _id: studentId }, { $set: { routeName: NOT_ASSIGNED, vehicleName: NOT_ASSIGNED } });

      return res.status(200).json({ success: true, message: "Full transport removed successfully" });
    }

    // Periods must be ones the school's fee scheme really has
    const scheme = await FeeScheme.findOne({ campusId: req.campusId }).select("schemeType installmentCount").lean();
    const valid = new Set(getPeriods(scheme?.schemeType || "Monthly", scheme?.installmentCount).map((p) => p.key));

    if (periods.some((key) => !valid.has(key))) return fail(res, 400, "Invalid period selected");

    // Only newly removed periods are checked; periods removed earlier stay as they are
    const previous = new Set(allocation.removedPeriods || []);
    for (const key of periods.filter((item) => !previous.has(item))) {
      if (await transportPaid(req, studentId, session, key)) {
        return fail(res, 400, `Transport fee for ${key} is already paid and cannot be removed.`);
      }
    }

    await StudentTransport.updateOne({ _id: allocation._id }, { $set: { removedPeriods: [...new Set(periods)] } });

    res.status(200).json({ success: true, message: "Selected months transport fee removed successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   REPORTS — routes, vehicles and allocations in one call
========================================================== */
router.get("/reports", async (req, res) => {
  try {
    const campusId = req.campusId;

    const [routes, vehicles, allocations, classes] = await Promise.all([
      TransportRoute.find({ campusId }).sort({ routeName: 1 }).lean(),
      Vehicle.find({ campusId }).select("-documents").sort({ vehicleName: 1 }).lean(),
      StudentTransport.find({ campusId }).lean(),
      Class.find({ campusId }).select("className sections").sort({ className: 1 }).lean(),
    ]);

    const students = allocations.length
      ? await Admission.find({
          _id: { $in: allocations.map((item) => item.studentId) },
          schoolId: req.schoolId,
          status: "Active",
        })
          .select("studentName fatherName mobile gender className section admissionDate session")
          .lean()
      : [];
    const studentMap = new Map(students.map((student) => [String(student._id), student]));

    const staffIds = [...new Set(vehicles.flatMap((v) => [v.driverId, v.conductorId]).filter(Boolean).map(String))];
    const staff = staffIds.length ? await Staff.find({ _id: { $in: staffIds } }).select("employeeName mobile").lean() : [];
    const staffMap = new Map(staff.map((item) => [String(item._id), item]));

    const vehicleRows = vehicles.map((vehicle) => {
      const driver = staffMap.get(String(vehicle.driverId));
      const conductor = staffMap.get(String(vehicle.conductorId));
      return {
        ...vehicle,
        driverName: driver?.employeeName || vehicle.driverName,
        driverMobile: driver?.mobile || vehicle.driverMobile,
        conductorName: conductor?.employeeName || vehicle.conductorName,
        conductorMobile: conductor?.mobile || vehicle.conductorMobile,
      };
    });
    const vehicleMap = new Map(vehicleRows.map((vehicle) => [String(vehicle._id), vehicle]));

    // Only each student's current-session allocation counts as a live allocation
    const allocationRows = allocations
      .map((item) => {
        const student = studentMap.get(String(item.studentId));
        if (!student || (student.session || getCurrentSession()) !== item.session) return null;

        const vehicle = vehicleMap.get(String(item.vehicleId));
        return {
          _id: item._id,
          admissionDate: student.admissionDate,
          className: student.className,
          section: student.section,
          studentName: student.studentName,
          fatherName: student.fatherName,
          mobileNumber: student.mobile,
          gender: student.gender,
          routeName: item.routeName,
          vehicleId: item.vehicleId,
          vehicleName: vehicle?.vehicleName || item.vehicleName || "",
          vehicleNo: vehicle?.vehicleNo || item.vehicleNo || "",
          driverName: vehicle?.driverName || "",
          driverMobile: vehicle?.driverMobile || "",
          monthlyTransportFee: item.monthlyFee,
        };
      })
      .filter(Boolean);

    const counts = new Map();
    allocationRows.forEach((row) => {
      if (row.vehicleId) counts.set(String(row.vehicleId), (counts.get(String(row.vehicleId)) || 0) + 1);
    });

    res.status(200).json({
      success: true,
      data: {
        routes,
        vehicles: vehicleRows.map((vehicle) => ({ ...vehicle, totalStudents: counts.get(String(vehicle._id)) || 0 })),
        allocations: allocationRows,
        classes: classes.map((item) => ({
          className: item.className,
          sections: (item.sections || []).map((section) => section.sectionName),
        })),
        schoolInfo: {
          schoolName: req.school?.schoolName || "",
          address: req.school?.address || "",
          email: req.school?.email || "",
          phone: req.school?.contactNo || "",
          website: req.school?.website || "",
          logo: req.school?.schoolLogo || "",
        },
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

module.exports = router;
