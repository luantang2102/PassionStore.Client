export interface Rating {
    id: string;
    value: number;
    comment?: string;
    helpful: number;
    createdDate: string;
    updatedDate?: string;
    userId: string;
    userName?: string;
    imageUrl?: string;
    email?: string;
    productId: string;
}