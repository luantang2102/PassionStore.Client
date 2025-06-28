import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../layout/App";
import ServerError from "../errors/ServerError";
import NotFound from "../errors/NotFound";
import AuthLayout from "../layout/Auth";
import Home from "../../features/Home/Home";
import SignIn from "../../features/Auth/SignIn";
import Products from "../../features/Products/Product";
import ProductDetailPage from "../../features/Products/ProductDetails";
import Cart from "../../features/Cart/Cart";
import Profile from "../../features/Profile/Profile";
import ProtectedRoute from "./ProtectedRoute";
import Orders from "../../features/Orders/Order";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "products",
        element: <Products />,
      },
      {
        path: "products/:id",
        element: <ProductDetailPage />,
      },
      {
        path: "cart",
        element: (
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        ),
      },
      {
        path: "server-error",
        element: <ServerError />,
      },
      {
        path: "not-found",
        element: <NotFound />,
      },
      {
        path: "/*",
        element: <Navigate replace to="/not-found" />,
      },
    ],
  },
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      {
        path: "signin",
        element: <SignIn />,
      },
    ],
  },
]);