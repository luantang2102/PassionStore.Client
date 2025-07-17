import { Brand } from "./brand";
import { Category } from "./category";
import { ProductImage } from "./productImage";
import { ProductVariant } from "./productVariant";

export interface Product {
    id: string;
    name: string;
    description: string;
    maxPrice: number;
    minPrice: number;
    brand: Brand;
    inStock: boolean;
    stockQuantity: number;
    averageRating: number;
    numberOfRatings: number;
    productImages: ProductImage[];
    categories: Category[];
    isFeatured: boolean;
    isSale: boolean;
    isNew: boolean;
    isNotHadVariants: boolean;
    totalReviews: number;
    productVariants: ProductVariant[];
    createdDate: string;
    updatedDate: string | null;
}