import { Color } from "./color";
import { Size } from "./size";

export interface ProductVariant {
    id: string;
    price : number;
    stockQuantity: number;
    size: Size;
    color: Color;
    createdDate: string;
    updatedDate: string | null;
}