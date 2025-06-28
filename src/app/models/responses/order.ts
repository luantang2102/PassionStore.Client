import { Color } from "./color";
import { Size } from "./size";

export enum ShippingMethod {
  Standard = "Standard",
  Express = "Express",
  SameDay = "SameDay",
}

export enum PaymentMethod {
  COD = "COD",
  VietQR = "PayOS",
}

export interface Order {
  id: string;
  totalAmount: number;
  status: string;
  orderDate: string;
  paymentMethod: PaymentMethod;
  paymentLink?: string;
  paymentTransactionId?: string;
  userProfileId: string;
  userFullName: string;
  shippingAddress: string;
  shippingMethod: ShippingMethod;
  shippingCost: number;
  note: string;
  orderItems: OrderItem[];
  createdDate: string;
  updatedDate?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productDescription: string;
  productVariantId: string;
  productImage: string;
  quantity: number;
  price: number;
  color: Color;
  size: Size;
}

