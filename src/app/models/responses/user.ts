import { Rating } from "./rating";
import { UserProfile } from "./userProfile";

export interface User {
    id: string;
    userName: string | null;
    fullName: string | null;
    imageUrl: string | null;
    publicId: string | null;
    email: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    roles: string[];
    emailConfirmed: boolean;
    cartItemsCount: number;
    wishListItemsCount: number;
    createdDate: string;
    updatedDate?: string;
    userProfiles: UserProfile[];
    ratings : Rating[];
}

