import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/AppButton";
import MasterReport from "../../components/reports/MasterReport";
import { SkeletonList } from "../../components/Skeleton";
import { transportService } from "../../services/api";

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "-";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const formatDistance = (distance) => (distance ? `${distance} KM` : "-");

const formatMadeYear = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.getFullYear();
};

const formatDate = (value) => (value ? String(value).split("-").reverse().join("-") : "-");

function TransportReports() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    transportService
      .getReports()
      .then((res) => {
        if (active) setData(res.data?.data || null);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Failed to load transport reports");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const schoolProfiles = useMemo(
    () => [{ schoolId: localStorage.getItem("schoolId") || "SCH001", ...(data?.schoolInfo || {}) }],
    [data]
  );

  const currentUser = useMemo(() => ({ name: data?.schoolInfo?.schoolName || "" }), [data]);

  const reports = useMemo(() => {
    if (!data) return [];

    const { routes, vehicles, allocations, classes } = data;

    const classOptions = classes.map((item) => item.className);
    const sectionOptions = [...new Set(classes.flatMap((item) => item.sections))];
    const routeOptions = routes.map((item) => ({ label: item.routeName, value: item.routeName }));
    const vehicleOptions = vehicles.map((item) => {
      const label = item.vehicleName || item.vehicleNo;
      return { label, value: label };
    });

    return [
      {
        id: "route-report",
        title: "Route Report",
        description: "View transport route and fee details",
        icon: "🛣️",
        filters: [],
        columns: [
          { key: "routeName", label: "Route Name" },
          { key: "startPoint", label: "Start Point" },
          { key: "endPoint", label: "End Point" },
          { key: "distance", label: "Distance", render: (row) => formatDistance(row.distance) },
          { key: "monthlyFee", label: "Monthly Fee", render: (row) => formatCurrency(row.monthlyFee) },
          { key: "yearlyFee", label: "Yearly Fee", render: (row) => formatCurrency(Number(row.monthlyFee || 0) * 12) },
        ],
        getData: () => routes,
      },

      {
        id: "vehicle-report",
        title: "Vehicle Report",
        description: "View vehicle, driver and student count details",
        icon: "🚌",
        filters: [],
        columns: [
          { key: "vehicleName", label: "Vehicle Name" },
          { key: "vehicleNo", label: "Vehicle No" },
          { key: "madeYear", label: "Made Year", render: (row) => formatMadeYear(row.madeYear) },
          { key: "totalSeats", label: "Total Seats" },
          { key: "driverName", label: "Driver Name" },
          { key: "driverMobile", label: "Driver Mobile" },
          { key: "conductorName", label: "Conductor Name" },
          { key: "conductorMobile", label: "Conductor Mobile" },
          { key: "totalStudents", label: "Total Students" },
        ],
        getData: () => vehicles,
      },

      {
        id: "student-transport-allocation-report",
        title: "Student Transport Allocation Report",
        description: "View student-wise transport allocation details",
        icon: "🎒",
        filters: [
          { name: "className", label: "Class", type: "select", placeholder: "All Class", options: classOptions },
          { name: "section", label: "Section", type: "select", placeholder: "All Section", options: sectionOptions },
          { name: "routeName", label: "Route", type: "select", placeholder: "All Route", options: routeOptions },
          { name: "vehicleName", label: "Vehicle", type: "select", placeholder: "All Vehicle", options: vehicleOptions },
        ],
        columns: [
          { key: "sno", label: "S.No", render: (_, index) => index + 1 },
          { key: "admissionDateLabel", label: "Admission Date" },
          { key: "className", label: "Class" },
          { key: "section", label: "Section" },
          { key: "studentName", label: "Student Name" },
          { key: "fatherName", label: "Father Name" },
          { key: "mobileNumber", label: "Mobile Number" },
          { key: "gender", label: "Gender" },
          { key: "routeName", label: "Route" },
          { key: "vehicleLabel", label: "Vehicle" },
          { key: "driverName", label: "Driver Name" },
          { key: "driverMobile", label: "Driver Mobile" },
          {
            key: "monthlyTransportFee",
            label: "Monthly Transport Fee",
            render: (row) => formatCurrency(row.monthlyTransportFee),
          },
        ],
        getData: ({ filters }) =>
          allocations
            .map((item) => ({
              ...item,
              admissionDateLabel: formatDate(item.admissionDate),
              vehicleLabel: item.vehicleName || item.vehicleNo || "-",
            }))
            .filter((item) => !filters.className || item.className === filters.className)
            .filter((item) => !filters.section || item.section === filters.section)
            .filter((item) => !filters.routeName || item.routeName === filters.routeName)
            .filter((item) => !filters.vehicleName || item.vehicleLabel === filters.vehicleName)
            .sort((a, b) => a.studentName.localeCompare(b.studentName)),
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <SkeletonList count={4} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "20px" }}>
        <AppButton type="back" onClick={() => navigate("/transport-system")}>
          ←
        </AppButton>

        <p>{error || "Transport reports are not available"}</p>
      </div>
    );
  }

  return (
    <MasterReport
      moduleTitle="Transport Analytics & Reports"
      reports={reports}
      schoolProfiles={schoolProfiles}
      currentUser={currentUser}
    />
  );
}

export default TransportReports;
