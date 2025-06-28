import { SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppDispatch } from "../store/store";
import { useEffect } from "react";
import { setSidebarOpen } from "../layout/uiSlice";

export default function NotFound() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setSidebarOpen(false));
  }, [dispatch]);

  return (
    <div
      className="bg-white shadow-lg rounded-lg p-6 mt-8 flex flex-col justify-center items-center full-h max-w-2xl mx-auto"
    >
      <SearchX className="h-24 w-24 text-blue-600 mb-4" />
      <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
        Oops - We could not find what you were looking for :(
      </h2>
      <Link to="/">
        <button
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full py-3 px-6 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
        >
          Go back to the homepage
        </button>
      </Link>
    </div>
  );
}