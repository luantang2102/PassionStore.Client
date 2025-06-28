export interface UserProfileRequest {
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  specificAddress: string;
  isDefault: boolean;
}