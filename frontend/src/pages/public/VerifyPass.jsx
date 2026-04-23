import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

export default function VerifyPass() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPass = async () => {
      try {
        const res = await api.get(`/public/verify/${id}`);
        setData(res.data);
      } catch (err) {
        setData({ valid: false, message: "Invalid Verification Link" });
      } finally {
        setLoading(false);
      }
    };
    verifyPass();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-xl font-semibold text-gray-600 animate-pulse">Verifying Gate Pass...</p>
      </div>
    );
  }

  if (!data || !data.valid) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center border-t-8 border-red-500">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Pass</h2>
          <p className="text-gray-600 font-medium">{data?.message || "This Gate Pass is not valid or has not been approved."}</p>
        </div>
      </div>
    );
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-md w-full border border-gray-200">
        
        <div className="bg-green-500 p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white mb-3 shadow">
            <span className="text-3xl text-green-500">✓</span>
          </div>
          <h2 className="text-white text-2xl font-bold tracking-wide">VERIFIED PASS</h2>
          <p className="text-green-100 text-sm mt-1">Official EduLeave Record</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="border-b pb-4">
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Name</p>
            <p className="text-xl font-bold text-gray-900">{data.data.name}</p>
            <p className="text-md text-indigo-600 font-medium">{data.data.role} • {data.data.department}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">From</p>
              <p className="font-medium text-gray-800">{fmtDate(data.data.fromDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">To</p>
              <p className="font-medium text-gray-800">{fmtDate(data.data.toDate)}</p>
            </div>
          </div>

          <div className="border-b pb-4">
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Reason</p>
            <p className="text-gray-800">{data.data.reason}</p>
            <p className="text-sm text-gray-600 mt-2 font-medium">Total: {data.data.totalDays} Days</p>
          </div>

          <div className="pt-2 text-center">
            <p className="text-xs text-gray-400">Approved by HOD</p>
            <p className="text-xs text-gray-400">{new Date(data.data.approvedAt).toLocaleString()}</p>
            <p className="text-[10px] text-gray-300 mt-2 font-mono">{data.data.id}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
