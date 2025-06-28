import { createApi } from "@reduxjs/toolkit/query/react";
import { PaginationParams } from "../models/params/pagination";
import { baseQueryWithErrorHandling } from "./baseApi";
import { UserParams } from "../models/params/userParams";
import { User } from "../models/responses/user";
import { UserProfile } from "../models/responses/userProfile";
import { UserProfileRequest } from "../models/requests/userProfileRequest";
import { UserRequest } from "../models/requests/userRequest";

export interface UserProfileParams extends PaginationParams {
  searchTerm?: string;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["Users", "UserProfiles"],
  endpoints: (builder) => ({
    fetchUsers: builder.query<{ items: User[]; pagination: PaginationParams | null }, UserParams>({
      query: (userParams) => ({
        url: "users",
        params: userParams,
      }),
      transformResponse: (response: User[], meta) => {
        const paginationHeader = meta?.response?.headers.get("Pagination");
        const pagination = paginationHeader ? JSON.parse(paginationHeader) as PaginationParams : null;

        return {
          items: response,
          pagination,
        };
      },
      providesTags: ["Users"],
    }),

    fetchUserById: builder.query<User, string>({
      query: (userId) => `users/${userId}`,
      providesTags: ["Users", "UserProfiles"],
    }),
    
    updateUser: builder.mutation<User, { id: string; user: UserRequest }>({
      query: ({ id, user }) => {
        const formData = new FormData();
        if (user.image) formData.append("Image", user.image);
        if (user.gender) formData.append("Gender", user.gender);
        if (user.dateOfBirth) formData.append("DateOfBirth", user.dateOfBirth);
        return {
          url: `/users/${id}`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: ["Users"],
    }),

    fetchUserProfiles: builder.query<{ items: UserProfile[]; pagination: PaginationParams | null }, UserProfileParams>({
      query: (params) => ({
        url: "users/me/profiles",
        params,
      }),
      transformResponse: (response: UserProfile[], meta) => {
        const paginationHeader = meta?.response?.headers.get("Pagination");
        const pagination = paginationHeader ? JSON.parse(paginationHeader) as PaginationParams : null;

        return {
          items: response,
          pagination,
        };
      },
      providesTags: ["UserProfiles"],
    }),

    fetchUserProfileById: builder.query<UserProfile, string>({
      query: (profileId) => `users/me/profiles/${profileId}`,
      providesTags: ["UserProfiles"],
    }),

    createUserProfile: builder.mutation<UserProfile, UserProfileRequest>({
      query: (profile) => {
        const formData = new FormData();
        formData.append("FullName", profile.fullName);
        formData.append("PhoneNumber", profile.phoneNumber);
        formData.append("Province", profile.province);
        formData.append("District", profile.district);
        formData.append("Ward", profile.ward);
        formData.append("SpecificAddress", profile.specificAddress);
        formData.append("IsDefault", profile.isDefault.toString());

        return {
          url: "users/me/profiles",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["UserProfiles", "Users"],
    }),

    updateUserProfile: builder.mutation<UserProfile, { id: string; profile: UserProfileRequest }>({
      query: ({ id, profile }) => {
        const formData = new FormData();
        formData.append("FullName", profile.fullName);
        formData.append("PhoneNumber", profile.phoneNumber);
        formData.append("Province", profile.province);
        formData.append("District", profile.district);
        formData.append("Ward", profile.ward);
        formData.append("SpecificAddress", profile.specificAddress);
        formData.append("IsDefault", profile.isDefault.toString());

        return {
          url: `users/me/profiles/${id}`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: ["UserProfiles", "Users"],
    }),

    deleteUserProfile: builder.mutation<void, string>({
      query: (profileId) => ({
        url: `users/me/profiles/${profileId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserProfiles", "Users"],
    }),
  }),
});

export const {
  useFetchUsersQuery,
  useFetchUserByIdQuery,
  useFetchUserProfilesQuery,
  useFetchUserProfileByIdQuery,
  useCreateUserProfileMutation,
  useUpdateUserProfileMutation,
  useDeleteUserProfileMutation,
  useUpdateUserMutation,
} = userApi;