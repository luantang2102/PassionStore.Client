export interface CategoryParams {
  pageNumber?: number;
  pageSize?: number;
  orderBy?: string;
  searchTerm?: string;
  level?: number;
  isActive?: boolean;
  parentCategoryId?: string;
}
