export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  specificAddress: string;
  isDefault: boolean;
  createdDate: string;
  updatedDate?: string;
}