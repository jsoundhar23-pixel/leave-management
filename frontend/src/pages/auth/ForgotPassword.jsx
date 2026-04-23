export default function ForgotPassword() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow w-96 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Forgot Password</h2>
        <p className="text-gray-600 mb-4">Contact admin to reset your password.</p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Back to Login
        </button>
      </div>
    </div>
  );
}
