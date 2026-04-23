import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setDarkMode(true);
    }
    
    if (role === "student" && token && location.pathname !== "/" && location.pathname !== "/signup") {
      api.get("/student/notifications").then(res => {
        if (res.data) {
          setNotifications(res.data);
          const lastRead = localStorage.getItem("lastReadNotif");
          if (lastRead) {
            const unread = res.data.filter(n => new Date(n.updatedAt) > new Date(lastRead));
            setUnreadCount(unread.length);
          } else {
            setUnreadCount(res.data.length);
          }
        }
      }).catch(err => console.error(err));
    }
  }, [role, token, location.pathname]);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  };

  const handleBellClick = () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs && unreadCount > 0) {
      setUnreadCount(0);
      localStorage.setItem("lastReadNotif", new Date().toISOString());
    }
  };

  if (location.pathname === "/" || location.pathname === "/signup" || !token) {
    return null;
  }

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const getRoleLabel = () => {
    if (role === "admin") return "Administrator";
    if (role === "hod") return "Head of Department";
    if (role === "staff") return "Staff Member";
    if (role === "student") return "Student";
    return "User";
  };

  return (
    <nav className="bg-indigo-700 dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <span className="text-white text-2xl font-bold tracking-wider">
              EduLeave
            </span>
          </div>
          
          <div className="flex items-center space-x-6 relative">
            
            {/* DARK MODE TOGGLE */}
            <button 
              onClick={toggleDarkMode} 
              className="text-white focus:outline-none text-xl hover:text-yellow-300 transition"
              title="Toggle Dark Mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* NOTIFICATION BELL (Students Only) */}
            {role === "student" && (
              <div className="relative">
                <button 
                  onClick={handleBellClick}
                  className="text-white text-xl focus:outline-none hover:text-indigo-200 transition relative"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-indigo-700 dark:border-gray-900">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 overflow-hidden z-50">
                    <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 font-bold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600">
                      Notifications
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No new notifications
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.map(n => (
                          <div key={n._id} className="p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-default">
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                              Your leave request for <b>{new Date(n.fromDate).toLocaleDateString()}</b> was <span className={n.status.includes("Approved") ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{n.status}</span>.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.updatedAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="hidden sm:block">
              <span className="bg-indigo-800 dark:bg-gray-700 px-3 py-1 rounded-full text-white text-sm font-medium shadow-sm transition-colors duration-300">
                Role: {getRoleLabel()}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white dark:bg-gray-700 text-indigo-700 dark:text-white hover:bg-indigo-50 dark:hover:bg-gray-600 px-4 py-2 rounded-md text-sm font-bold shadow transition-colors duration-150 ease-in-out"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
