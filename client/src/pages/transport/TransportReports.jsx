import React from "react";
import MasterReport from "../../components/reports/MasterReport";

function TransportReports() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const schoolProfiles = [
    {
      schoolId: "SCH001",
      schoolName: "Chandra Shekhar Azad Inter College",
      address: "Azad Nagar, Barabanki",
      email: "school@gmail.com",
      website: "www.school.com",
      phone: "9876543210",
      logo: "",
    },
  ];

  const currentUser = {
    name: localStorage.getItem("userName") || "School Admin",
  };

  const routes = [
    {
      id: 1,
      schoolId: "SCH001",
      routeName: "Rasauli Route",
      startPoint: "Rasauli",
      endPoint: "Barabanki",
      distance: "12",
      monthlyFee: 500,
    },
    {
      id: 2,
      schoolId: "SCH001",
      routeName: "Lucknow Route",
      startPoint: "Barabanki",
      endPoint: "Lucknow",
      distance: "30",
      monthlyFee: 800,
    },
  ];

  const vehicles = [
    {
      id: 1,
      schoolId: "SCH001",
      vehicleName: "Bus 1",
      vehicleNo: "UP32AB1234",
      madeYear: "2020-01-01",
      totalSeats: 40,
      driverName: "Mukesh Kumar",
      driverMobile: "9876543210",
      conductorName: "Suresh Verma",
      conductorMobile: "9876543220",
    },
    {
      id: 2,
      schoolId: "SCH001",
      vehicleName: "Van 1",
      vehicleNo: "UP41CD5678",
      madeYear: "2021-01-01",
      totalSeats: 20,
      driverName: "Ramesh Yadav",
      driverMobile: "9876543211",
      conductorName: "Amit Singh",
      conductorMobile: "9876543221",
    },
  ];

  const studentTransportAllocations = [
    {
      id: 1,
      schoolId: "SCH001",
      admissionDate: "12/04/2026",
      className: "Class 6",
      section: "A",
      studentName: "Priya Singh",
      fatherName: "Dinesh Singh",
      mobileNumber: "9876543211",
      gender: "Female",
      routeId: 1,
      routeName: "Rasauli Route",
      vehicleId: 1,
      vehicleName: "Bus 1",
      vehicleNo: "UP32AB1234",
      driverName: "Mukesh Kumar",
      driverMobile: "9876543210",
      monthlyTransportFee: 500,
    },
    {
      id: 2,
      schoolId: "SCH001",
      admissionDate: "14/04/2026",
      className: "Class 6",
      section: "A",
      studentName: "Rahul Kumar",
      fatherName: "Sunil Kumar",
      mobileNumber: "9876543210",
      gender: "Male",
      routeId: 1,
      routeName: "Rasauli Route",
      vehicleId: 1,
      vehicleName: "Bus 1",
      vehicleNo: "UP32AB1234",
      driverName: "Mukesh Kumar",
      driverMobile: "9876543210",
      monthlyTransportFee: 500,
    },
  ];

  const classOptions = [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
  ];

  const sectionOptions = ["A", "B", "C", "D"];

  const routeOptions = routes
    .filter((item) => item.schoolId === schoolId)
    .map((item) => ({
      label: item.routeName,
      value: item.routeName,
    }));

  const vehicleOptions = vehicles
    .filter((item) => item.schoolId === schoolId)
    .map((item) => ({
      label: item.vehicleName || item.vehicleNo,
      value: item.vehicleName || item.vehicleNo,
    }));

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "-";
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const formatDistance = (distance) => {
    if (!distance) return "-";
    return `${distance} KM`;
  };

  const formatMadeYear = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.getFullYear();
  };

  const countStudentsByVehicle = (vehicle) =>
    studentTransportAllocations.filter(
      (item) =>
        item.schoolId === schoolId &&
        item.vehicleId === vehicle.id
    ).length;

  const reports = [
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
        {
          key: "distance",
          label: "Distance",
          render: (row) => formatDistance(row.distance),
        },
        {
          key: "monthlyFee",
          label: "Monthly Fee",
          render: (row) => formatCurrency(row.monthlyFee),
        },
        {
          key: "yearlyFee",
          label: "Yearly Fee",
          render: (row) =>
            formatCurrency(Number(row.monthlyFee || 0) * 12),
        },
      ],
      getData: ({ schoolId }) =>
        routes
          .filter((item) => item.schoolId === schoolId)
          .sort((a, b) =>
            a.routeName.localeCompare(b.routeName)
          ),
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
        {
          key: "madeYear",
          label: "Made Year",
          render: (row) => formatMadeYear(row.madeYear),
        },
        { key: "totalSeats", label: "Total Seats" },
        { key: "driverName", label: "Driver Name" },
        { key: "driverMobile", label: "Driver Mobile" },
        { key: "conductorName", label: "Conductor Name" },
        { key: "conductorMobile", label: "Conductor Mobile" },
        {
          key: "totalStudents",
          label: "Total Students",
          render: (row) => countStudentsByVehicle(row),
        },
      ],
      getData: ({ schoolId }) =>
        vehicles
          .filter((item) => item.schoolId === schoolId)
          .sort((a, b) =>
            String(a.vehicleName || "").localeCompare(
              String(b.vehicleName || "")
            )
          ),
    },

    {
      id: "student-transport-allocation-report",
      title: "Student Transport Allocation Report",
      description: "View student-wise transport allocation details",
      icon: "🎒",
      filters: [
        {
          name: "className",
          label: "Class",
          type: "select",
          placeholder: "All Class",
          options: classOptions,
        },
        {
          name: "section",
          label: "Section",
          type: "select",
          placeholder: "All Section",
          options: sectionOptions,
        },
        {
          name: "routeName",
          label: "Route",
          type: "select",
          placeholder: "All Route",
          options: routeOptions,
        },
        {
          name: "vehicleName",
          label: "Vehicle",
          type: "select",
          placeholder: "All Vehicle",
          options: vehicleOptions,
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "admissionDate", label: "Admission Date" },
        { key: "className", label: "Class" },
        { key: "section", label: "Section" },
        { key: "studentName", label: "Student Name" },
        { key: "fatherName", label: "Father Name" },
        { key: "mobileNumber", label: "Mobile Number" },
        { key: "gender", label: "Gender" },
        { key: "routeName", label: "Route" },
        { key: "vehicleName", label: "Vehicle" },
        { key: "driverName", label: "Driver Name" },
        { key: "driverMobile", label: "Driver Mobile" },
        {
          key: "monthlyTransportFee",
          label: "Monthly Transport Fee",
          render: (row) => formatCurrency(row.monthlyTransportFee),
        },
      ],
      getData: ({ schoolId, filters }) =>
        studentTransportAllocations
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            filters.className ? item.className === filters.className : true
          )
          .filter((item) =>
            filters.section ? item.section === filters.section : true
          )
          .filter((item) =>
            filters.routeName ? item.routeName === filters.routeName : true
          )
          .filter((item) =>
            filters.vehicleName ? item.vehicleName === filters.vehicleName : true
          )
          .sort((a, b) =>
            a.studentName.localeCompare(b.studentName)
          ),
    },
  ];

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