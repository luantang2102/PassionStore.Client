import { Color } from "./color";
import { Size } from "./size";

export interface CartItem {
  id: string;
  productId: string;
  productImage: string;
  productName: string;
  productDescription: string;
  productVariantId: string;
  quantity: number;
  price: number;
  color: Color;
  size: Size;
}