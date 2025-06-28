// components/AuthInitializer.tsx
import { JSX, useEffect } from "react";
import { useCheckAuthQuery } from "../../api/authApi";
import { useAppDispatch } from "../../store/store";
import { clearAuth, setAuth } from "../../store/authSlice";

const AuthInitializer = ({ children }: { children: JSX.Element }) => {
  const dispatch = useAppDispatch();
  const { data, error, isLoading } = useCheckAuthQuery();

  useEffect(() => {
    if (data) {
      dispatch(setAuth(data));
    } else if (error) {
      dispatch(clearAuth());
    }
  }, [data, error, dispatch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return children;
};

export default AuthInitializer;