export interface ProductParams {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    orderBy?: string;
    categories?: string;
    colors?: string;
    sizes?: string;
    brands?: string;
    isFeatured?: boolean;
    isSale?: boolean;
    isNew?: boolean;
    minPrice?: number;
    maxPrice?: number;
    ratings?: string;
}