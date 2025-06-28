import { useLocation } from "react-router-dom";
import { useAppDispatch } from "../store/store";
import { useEffect } from "react";
import { setSidebarOpen } from "../layout/uiSlice";

export default function ServerError() {
  const { state } = useLocation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setSidebarOpen(false));
  }, [dispatch]);

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mt-8 max-w-2xl mx-auto">
      {state.error ? (
        <>
          <h2 className="text-3xl font-bold text-purple-600 px-4 pt-2 mb-4">{state.error.title}</h2>
          <hr className="border-gray-200 mb-4" />
          <p className="text-base text-gray-700 px-4">{state.error.detail}</p>
        </>
      ) : (
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Server Error</h2>
      )}
    </div>
  );
}