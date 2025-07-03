import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "./baseApi";
import { OrderParams } from "../models/params/orderParams";
import { Order } from "../models/responses/order";
import { PaginationParams } from "../models/params/pagination";

// Define the PaymentCallbackParams type based on backend query parameters
interface PaymentCallbackParams {
  code: string;
  id: string;
  cancel: boolean;
  status: string;
  orderCode: number;
}

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["Orders"],
  endpoints: (builder) => ({
    fetchSelfOrders: builder.query<{ items: Order[]; pagination: PaginationParams | null }, OrderParams>({
      query: (OrderParams) => ({
        url: "Orders/me",
        params: OrderParams,
      }),
      transformResponse: (response: Order[], meta) => {
        const paginationHeader = meta?.response?.headers.get("Pagination");
        const pagination = paginationHeader ? JSON.parse(paginationHeader) as PaginationParams : null;

        return {
          items: response,
          pagination,
        };
      },
      providesTags: ["Orders"],
    }),
    getOrderById: builder.query<Order, string>({
      query: (id) => ({
        url: `Orders/${id}`, // Adjusted to match backend route
        method: "GET",
      }),
      providesTags: ["Orders"],
    }),
    createOrder: builder.mutation<Order, FormData>({
      query: (data) => ({
        url: "Orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Orders"],
    }),
    cancelOrder: builder.mutation<void, { id: string; cancellationReason?: string }>({
      query: ({ id, cancellationReason }) => ({
        url: `Orders/${id}/cancel`, // Fixed to match backend route
        method: "DELETE",
        params: cancellationReason ? { cancellationReason } : undefined, // Add optional cancellationReason as query param
      }),
      invalidatesTags: ["Orders"],
    }),
    handlePaymentCallback: builder.query<Order | null, PaymentCallbackParams>({
      query: (params) => ({
        url: "orders/payment-callback", // Added to match backend route
        method: "GET",
        params,
      }),
      providesTags: ["Orders"],
    }),
  }),
});

export const {
  useFetchSelfOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useHandlePaymentCallbackQuery,
} = orderApi;