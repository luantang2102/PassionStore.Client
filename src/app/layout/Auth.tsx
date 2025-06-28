import { Outlet } from "react-router-dom";
import { useAppSelector } from "../store/store";

const AuthLayout = () => {
  const { darkMode } = useAppSelector((state) => state.ui);

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-gradient-to-br from-slate-800 to-slate-900"
          : "bg-gradient-to-br from-blue-50 to-purple-50"
      } flex items-center justify-center p-4 relative overflow-hidden`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>
      <div className="relative z-10 w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;