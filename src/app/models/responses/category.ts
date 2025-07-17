export  interface Category {
  id: string;
  name: string;
  description: string;
  level: number;
  isActive: boolean;
  imageUrl: string;
  publicId: string;
  totalProducts: number;
  createdDate: string;
  updatedDate?: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  subCategories: Category[];
}
 