// api/authApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { User } from "../models/responses/user";
import { ChangePasswordRequest } from "../models/requests/changePasswordRequest";
import { EmailRequest } from "../models/requests/emailRequest";
import { VerifyEmailRequest } from "../models/requests/verifyEmailRequest";
import { GoogleLoginRequest } from "../models/requests/googleLoginRequest";
import { customBaseQuery } from "./baseApi";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Auth", "User"],
  endpoints: (builder) => ({
    login: builder.mutation<User, FormData>({
      query: (formData) => ({
        url: "Auth/login",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
    register: builder.mutation<User, FormData>({
      query: (formData) => ({
        url: "Auth/register",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
    refreshToken: builder.mutation<User, void>({
      query: () => ({
        url: "Auth/refresh-token",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
    }),
    checkAuth: builder.query<User, void>({
      query: () => ({
        url: "Auth/check",
        method: "GET",
      }),
      providesTags: ["Auth", "User"],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "Auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
    }),
    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("CurrentPassword", data.currentPassword);
        formData.append("NewPassword", data.newPassword);
        return {
          url: "Auth/change-password",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Auth"],
    }),
    sendVerificationCode: builder.mutation<void, EmailRequest>({
      query: (data) => ({
        url: "Auth/send-verification-code",
        method: "POST",
        body: data,
      }),
    }),
    verifyEmail: builder.mutation<User, VerifyEmailRequest>({
      query: (data) => ({
        url: "Auth/verify-email",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
    googleLogin: builder.mutation<User, GoogleLoginRequest>({
      query: (data) => ({
        url: "Auth/google",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useCheckAuthQuery,
  useLogoutMutation,
  useChangePasswordMutation,
  useSendVerificationCodeMutation,
  useVerifyEmailMutation,
  useGoogleLoginMutation,
} = authApi;