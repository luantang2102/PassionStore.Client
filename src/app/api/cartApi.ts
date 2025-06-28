// api/cartApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "./baseApi";
import { Cart } from "../models/responses/cart";
import { CartItemRequest } from "../models/requests/cartItemRequest";

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["Cart", "Auth"],
  endpoints: (builder) => ({
    getCart: builder.query<Cart, { skipRedirectOn401?: boolean }>({ // Add skipRedirectOn401 parameter
      query: ({ skipRedirectOn401 = false }) => ({
        url: "carts/me",
        method: "GET",
        params: { skipRedirectOn401 }, // Pass as a query param or use another method
      }),
      providesTags: ["Cart"],
    }),
    addCartItem: builder.mutation<Cart, CartItemRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("ProductVariantId", data.productVariantId);
        formData.append("Quantity", data.quantity.toString());
        return {
          url: "carts/me",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Cart", "Auth"],
    }),
    updateCartItem: builder.mutation<Cart, { id: string; data: CartItemRequest }>({
      query: ({ id, data }) => {
        const formData = new FormData();
        formData.append("ProductVariantId", data.productVariantId);
        formData.append("Quantity", data.quantity.toString());
        return {
          url: `carts/item/${id}`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: ["Cart", "Auth"],
    }),
    deleteCartItem: builder.mutation<void, string>({
      query: (id) => ({
        url: `carts/item/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart", "Auth"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useDeleteCartItemMutation,
} = cartApi;