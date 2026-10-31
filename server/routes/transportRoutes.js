const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");
const TransportRoute = require("../models/TransportRoute");
const StudentTransport = require("../models/StudentTransport");

// Records are stored against the school/campus resolved from the access token
router.use(schoolAuth, schoolAuth.checkModule("transport"));

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const validate = (body) => {
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

// GET all routes with the number of students allocated to each (lets the UI block deletes)
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
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/routes", async (req, res) => {
  try {
    const { value, error } = validate(req.body);
    if (error) return fail(res, 400, error);

    const duplicate = await TransportRoute.exists({
      campusId: req.campusId,
      routeName: { $regex: new RegExp(`^${value.routeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (duplicate) return fail(res, 400, "Route name already exists");

    const created = await TransportRoute.create({
      schoolId: req.schoolId,
      campusId: req.campusId,
      ...value,
    });

    res.status(201).json({ success: true, message: "Route added successfully", data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/routes/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 400, "Invalid route id");

    const { value, error } = validate(req.body);
    if (error) return fail(res, 400, error);

    const duplicate = await TransportRoute.exists({
      campusId: req.campusId,
      _id: { $ne: req.params.id },
      routeName: { $regex: new RegExp(`^${value.routeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (duplicate) return fail(res, 400, "Route name already exists");

    const updated = await TransportRoute.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: value },
      { new: true }
    ).lean();

    if (!updated) return fail(res, 404, "Route not found");

    res.status(200).json({ success: true, message: "Route updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/routes/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 400, "Invalid route id");

    const assigned = await StudentTransport.exists({ campusId: req.campusId, routeId: req.params.id });
    if (assigned) return fail(res, 400, "This route is assigned to students and cannot be deleted.");

    const removed = await TransportRoute.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!removed) return fail(res, 404, "Route not found");

    res.status(200).json({ success: true, message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
