// api/baseApi.ts
import { BaseQueryApi, FetchArgs, fetchBaseQuery } from "@reduxjs/toolkit/query";
import { setLoading } from "../layout/uiSlice";
import { toast } from "react-toastify";
import { router } from "../routes/Routes";
import { Mutex } from "async-mutex";

const mutex = new Mutex();

export const customBaseQuery = fetchBaseQuery({
  baseUrl: "https://passionstore-hwajfcfqb8gbbng8.southeastasia-01.azurewebsites.net/api",
  credentials: "include",
});

interface ErrorResponse {
  code?: string;
  message?: string;
}

export const baseQueryWithErrorHandling = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: object
) => {
  await mutex.waitForUnlock();
  api.dispatch(setLoading(true));

  let result = await customBaseQuery(args, api, extraOptions);

  // Check if the request is for the cart endpoint and has skipRedirectOn401
  const isCartRequest = typeof args === "object" && args.url.includes("carts/me");
  const skipRedirectOn401 = typeof args === "object" && args.params?.skipRedirectOn401 === true;

  if (result.error && result.error.status === 401 && isCartRequest && skipRedirectOn401) {
    // Skip redirect for Navbar's getCart request
    api.dispatch(setLoading(false));
    return result; // Return the error without redirecting
  }

  if (result.error && result.error.status === 401 && !api.endpoint.includes("auth/")) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await customBaseQuery(
          { url: "auth/refresh-token", method: "GET" },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          result = await customBaseQuery(args, api, extraOptions);
        } else {
          toast.error("Session expired. Please log in again.");
          router.navigate("/signin");
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await customBaseQuery(args, api, extraOptions);
    }
  }

  api.dispatch(setLoading(false));

  if (result.error) {
    const originalStatus =
      result.error.status === "PARSING_ERROR" && result.error.originalStatus
        ? result.error.originalStatus
        : result.error.status;

    const resData = result.error.data as ErrorResponse;

    switch (originalStatus) {
      case 400:
        if (resData.message) toast.error(resData.message);
        else if (resData.code) toast.error(resData.code);
        else toast.error("Bad request. Please check your input.");
        break;
      case 401:
        break; // Handled above
      case 403:
        toast.error("Forbidden. You do not have permission to access this resource.");
        router.navigate("/forbidden");
        break;
      case 404:
        router.navigate("/not-found");
        break;
      case 500:
        router.navigate("/server-error", { state: { error: resData } });
        break;
      default:
        break;
    }
  }

  return result;
};