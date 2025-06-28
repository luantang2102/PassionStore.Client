export interface OrderRequest {
  paymentMethod: string;
  shippingMethod: string;
  note?: string;
}