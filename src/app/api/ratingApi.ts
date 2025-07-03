import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "./baseApi";
import { PaginationParams } from "../models/params/pagination";
import { Rating } from "../models/responses/rating";
import { RatingParams } from "../models/params/ratingParams";

export const ratingApi = createApi({
  reducerPath: "ratingApi",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["Ratings"],
  endpoints: (builder) => ({
    fetchRatings: builder.query<{ items: Rating[]; pagination: PaginationParams | null }, RatingParams>({
      query: (ratingParams) => ({
        url: "Ratings",
        params: ratingParams,
      }),
      transformResponse: (response: Rating[], meta) => {
        const paginationHeader = meta?.response?.headers.get("Pagination");
        const pagination = paginationHeader ? JSON.parse(paginationHeader) as PaginationParams : null;

        return {
          items: response,
          pagination,
        };
      },
      providesTags: ["Ratings"],
    }),
    fetchRatingsByProductId: builder.query<{ items: Rating[]; pagination: PaginationParams | null }, { productId: string; ratingParams: RatingParams }>({
      query: ({ productId, ratingParams }) => ({
        url: `Ratings/product/${productId}`,
        params: ratingParams,
      }),
      transformResponse: (response: Rating[], meta) => {
        const paginationHeader = meta?.response?.headers.get("Pagination");
        const pagination = paginationHeader ? JSON.parse(paginationHeader) as PaginationParams : null;

        return {
          items: response,
          pagination,
        };
      },
      providesTags: ["Ratings"],
    }),
    getRatingById: builder.query<Rating, string>({
      query: (id) => ({
        url: `Ratings/${id}`,
        method: "GET",
      }),
      providesTags: ["Ratings"],
    }),
    createRating: builder.mutation<Rating, FormData>({
      query: (data) => ({
        url: "Ratings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Ratings"],
    }),
    updateRating: builder.mutation<Rating, { id: string; data: FormData }>({
      query: ({ id, data }) => ({
        url: `Ratings/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Ratings"],
    }),
    deleteRating: builder.mutation<void, string>({
      query: (id) => ({
        url: `Ratings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ratings"],
    }),
    toggleHelpful: builder.mutation<void, string>({
      query: (id) => ({
        url: `Ratings/${id}/helpful`,
        method: "POST",
      }),
      invalidatesTags: ["Ratings"],
    }),
    getUserRatingForProduct: builder.query<Rating | null, string>({
      query: (productId) => ({
        url: `Ratings/has-rated/${productId}`,
        method: "GET",
      }),
      providesTags: ["Ratings"],
    }),
  }),
});

export const {
  useFetchRatingsQuery,
  useFetchRatingsByProductIdQuery,
  useGetRatingByIdQuery,
  useCreateRatingMutation,
  useUpdateRatingMutation,
  useDeleteRatingMutation,
  useToggleHelpfulMutation,
  useGetUserRatingForProductQuery,
} = ratingApi;