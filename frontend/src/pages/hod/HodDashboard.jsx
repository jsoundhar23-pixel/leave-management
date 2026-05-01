import { useEffect, useState, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import api from "../../services/api";

const COLORS = ['#10B981', '#EF4444', '#F59E0B']; // Approved, Rejected, Pending

export default function HodDashboard() {
  const [data, setData] = useState(null);
  const [semester, setSemester] = useState(null);
  const [stats, setStats] = useState(null);

  const [pages, setPages] = useState({
    sp: 1, stp: 1, shp: 1, sthp: 1
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(
        `/hod/dashboard?sp=${pages.sp}&stp=${pages.stp}&shp=${pages.shp}&sthp=${pages.sthp}`
      );
      setData(res.data);
      setSemester(res.data.semester);

      const statsRes = await api.get("/hod/stats");
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  }, [pages]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const decide = async (id, status) => {
    try {
      const response = await api.put(`/hod/leave/${id}`, { status });
      alert(response.data.message || "Leave updated successfully");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating leave");
    }
  };


  const downloadCSV = () => {
    if (!stats || !stats.leaves) return;
    
    const headers = ["Name", "Role", "From Date", "To Date", "Total Days", "Reason", "Status"];
    
    const rows = stats.leaves.map(l => {
      const name = l.student?.name || l.staff?.name || "Unknown";
      const role = l.student ? "Student" : "Staff";
      const reason = (l.reason || "").replace(/,/g, " "); // prevent csv comma break
      return `"${name}","${role}","${new Date(l.fromDate).toLocaleDateString()}","${new Date(l.toDate).toLocaleDateString()}",${l.totalDays},"${reason}","${l.status}"`;
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leave_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pieData = stats ? [
    { name: "Approved", value: stats.approved },
    { name: "Rejected", value: stats.rejected },
    { name: "Pending", value: stats.pending },
  ] : [];

  if (!data) return <p className="text-center mt-10">Loading Dashboard...</p>;

  const fmt = d => new Date(d).toLocaleDateString("en-IN");

  const getStatusBadge = (status) => {
    const statusStyles = {
      "Pending-Staff": "bg-yellow-100 text-yellow-800",
      "Approved-Staff": "bg-blue-100 text-blue-800",
      "Rejected-Staff": "bg-red-100 text-red-800",
      "Pending-HOD": "bg-yellow-100 text-yellow-800",
      "Approved-HOD": "bg-green-100 text-green-800",
      "Rejected-HOD": "bg-red-100 text-red-800",
    };
    return statusStyles[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 space-y-8">

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">HOD Dashboard</h1>
        <button 
          onClick={downloadCSV}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded shadow transition"
        >
          Download CSV Report
        </button>
      </div>



      {/* ✅ HOD INFO CARD */}

      <div className="bg-white shadow p-4 rounded">
        <p><b>Name:</b> {data.hod.name}</p>
        <p><b>Department:</b> {data.hod.department?.name}</p>
      </div>

      {/* ✅ SEMESTER CARD */}

      {semester && (
        <div className="bg-blue-50 border p-4 rounded">
          <h3 className="font-semibold text-lg">{semester.name}</h3>
          <p>
            <b>Duration:</b> {fmt(semester.startDate)} – {fmt(semester.endDate)}
          </p>
          <p><b>Max Leave:</b> {semester.maxLeaveDays} days</p>
        </div>
      )}

      <Table title="Student Requests"
        rows={data.studentLeaves}
        nameKey="student"
        decide={decide}
        fmt={fmt}
        getStatusBadge={getStatusBadge}
        page={pages.sp}
        setPage={p => setPages({ ...pages, sp: p })}
        total={data.pagination.studentReq.total}
      />

      <Table title="Staff Requests"
        rows={data.staffLeaves}
        nameKey="staff"
        decide={decide}
        fmt={fmt}
        getStatusBadge={getStatusBadge}
        page={pages.stp}
        setPage={p => setPages({ ...pages, stp: p })}
        total={data.pagination.staffReq.total}
      />

      <History title="Student History"
        rows={data.studentHistory}
        nameKey="student"
        fmt={fmt}
        getStatusBadge={getStatusBadge}
        page={pages.shp}
        setPage={p => setPages({ ...pages, shp: p })}
        total={data.pagination.studentHis.total}
      />

      <History title="Staff History"
        rows={data.staffHistory}
        nameKey="staff"
        fmt={fmt}
        getStatusBadge={getStatusBadge}
        page={pages.sthp}
        setPage={p => setPages({ ...pages, sthp: p })}
        total={data.pagination.staffHis.total}
      />
    </div>
  );
}

/* ---------- TABLE ---------- */

function Table({ title, rows, nameKey, decide, fmt, getStatusBadge, page, setPage, total }) {
  return (
    <div className="bg-white shadow p-4 rounded">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-xl">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border min-w-[700px]">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">From</th>
            <th className="border p-2">To</th>
            <th className="border p-2">Days</th>
            <th className="border p-2">Reason</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="7" className="p-4 text-center text-gray-500">No requests found.</td></tr>
          ) : (
            rows.map(l => (
              <tr key={l._id}>
                <td className="border p-2">{l[nameKey]?.name}</td>
                <td className="border p-2">{fmt(l.fromDate)}</td>
                <td className="border p-2">{fmt(l.toDate)}</td>
                <td className="border p-2 text-center">{l.totalDays}</td>
                <td className="border p-2">{l.reason}</td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusBadge(l.status)}`}>
                    {l.status}
                  </span>
                </td>
                <td className="border p-2 flex gap-2">
                  <button onClick={() => decide(l._id, "Approved-HOD")}
                    className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700">
                    Approve
                  </button>
                  <button onClick={() => decide(l._id, "Rejected-HOD")}
                    className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700">
                    Reject
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      <Pager page={page} setPage={setPage} total={total} />
    </div>
  );
}

/* ---------- HISTORY ---------- */

function History({ title, rows, nameKey, fmt, getStatusBadge, page, setPage, total }) {
  return (
    <div className="bg-white shadow p-4 rounded">
      <h2 className="font-bold text-xl mb-3">{title}</h2>

      <div className="overflow-x-auto">
        <table className="w-full border min-w-[600px]">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">From</th>
            <th className="border p-2">To</th>
            <th className="border p-2">Days</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>

        <tbody>
          {rows.map(l => (
            <tr key={l._id}>
              <td className="border p-2">{l[nameKey]?.name}</td>
              <td className="border p-2">{fmt(l.fromDate)}</td>
              <td className="border p-2">{fmt(l.toDate)}</td>
              <td className="border p-2 text-center">{l.totalDays}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusBadge(l.status)}`}>
                  {l.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <Pager page={page} setPage={setPage} total={total} />
    </div>
  );
}

/* ---------- PAGER ---------- */

function Pager({ page, setPage, total }) {
  return (
    <div className="mt-3 flex gap-3 justify-center">
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
      <span>{page} / {total}</span>
      <button disabled={page === total} onClick={() => setPage(page + 1)}>Next</button>
    </div>
  );
}
