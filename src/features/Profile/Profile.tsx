/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Camera,
  Save,
  X,
  Star,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAppSelector } from "../../app/store/store";
import {
  useFetchUserByIdQuery,
  useCreateUserProfileMutation,
  useUpdateUserProfileMutation,
  useDeleteUserProfileMutation,
  useUpdateUserMutation,
} from "../../app/api/userApi";
import { UserProfile } from "../../app/models/responses/userProfile";
import { UserProfileRequest } from "../../app/models/requests/userProfileRequest";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface AddressForm {
  fullName: string;
  phoneNumber: string;
  province: string;
  provinceCode: string;
  district: string;
  districtCode: string;
  ward: string;
  wardCode: string;
  specificAddress: string;
  isDefault: boolean;
  fullAddress?: string;
}

interface UserForm {
  gender: string | null;
  dateOfBirth: string | null;
  image: File | null;
}

interface Province {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  phone_code: number;
  districts: District[];
}

interface District {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  province_code: number;
  wards: Ward[];
}

interface Ward {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  district_code: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { darkMode } = useAppSelector((state) => state.ui);
  const { isAuthenticated, user, loading: authLoading } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<"personal" | "addresses">("personal");
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUserEditDialogOpen, setIsUserEditDialogOpen] = useState(false);
  const [isImageEditDialogOpen, setIsImageEditDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<UserProfile | null>(null);
  const [showAddressDropdowns, setShowAddressDropdowns] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    fullName: user?.userName || "",
    phoneNumber: "",
    province: "",
    provinceCode: "",
    district: "",
    districtCode: "",
    ward: "",
    wardCode: "",
    specificAddress: "",
    isDefault: false,
    fullAddress: "",
  });
  const [userForm, setUserForm] = useState<UserForm>({
    gender: null,
    dateOfBirth: null,
    image: null,
  });
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isFetchingProvinces, setIsFetchingProvinces] = useState(false);
  const [isFetchingDistricts, setIsFetchingDistricts] = useState(false);
  const [isFetchingWards, setIsFetchingWards] = useState(false);
  const [crop, setCrop] = useState<Crop>({ unit: "%", x: 0, y: 0, width: 50, height: 50 });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<File | null>(null);

  // Fetch user data
  const { data: userData, isLoading: isUserLoading, error: userError } = useFetchUserByIdQuery(user?.id || "", {
    skip: !isAuthenticated || !user?.id || authLoading,
  });

  const profiles = userData?.userProfiles || [];

  // Mutations
  const [createUserProfile, { isLoading: isCreating }] = useCreateUserProfileMutation();
  const [updateUserProfile, { isLoading: isUpdatingProfile }] = useUpdateUserProfileMutation();
  const [deleteUserProfile, { isLoading: isDeleting }] = useDeleteUserProfileMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsFetchingProvinces(true);
      try {
        const response = await fetch("https://provinces.open-api.vn/api/p/");
        if (!response.ok) throw new Error("Failed to fetch provinces");
        const data: Province[] = await response.json();
        setProvinces(data);
      } catch (error) {
        toast.error("Không thể tải danh sách tỉnh/thành phố. Vui lòng thử lại.");
      } finally {
        setIsFetchingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch districts when province is selected
  useEffect(() => {
    if (!addressForm.provinceCode) {
      setDistricts([]);
      setWards([]);
      setAddressForm((prev) => ({ ...prev, district: "", districtCode: "", ward: "", wardCode: "" }));
      return;
    }

    const fetchDistricts = async () => {
      setIsFetchingDistricts(true);
      try {
        const response = await fetch(`https://provinces.open-api.vn/api/p/${addressForm.provinceCode}?depth=2`);
        if (!response.ok) throw new Error("Failed to fetch districts");
        const data: Province = await response.json();
        setDistricts(data.districts || []);
        setWards([]);
        setAddressForm((prev) => ({ ...prev, district: "", districtCode: "", ward: "", wardCode: "" }));
      } catch (error) {
        toast.error("Không thể tải danh sách quận/huyện. Vui lòng thử lại.");
      } finally {
        setIsFetchingDistricts(false);
      }
    };
    fetchDistricts();
  }, [addressForm.provinceCode]);

  // Fetch wards when district is selected
  useEffect(() => {
    if (!addressForm.districtCode) {
      setWards([]);
      setAddressForm((prev) => ({ ...prev, ward: "", wardCode: "" }));
      return;
    }

    const fetchWards = async () => {
      setIsFetchingWards(true);
      try {
        const response = await fetch(`https://provinces.open-api.vn/api/d/${addressForm.districtCode}?depth=2`);
        if (!response.ok) throw new Error("Failed to fetch wards");
        const data: District = await response.json();
        setWards(data.wards || []);
        setAddressForm((prev) => ({ ...prev, ward: "", wardCode: "" }));
      } catch (error) {
        toast.error("Không thể tải danh sách phường/xã. Vui lòng thử lại.");
      } finally {
        setIsFetchingWards(false);
      }
    };
    fetchWards();
  }, [addressForm.districtCode]);

  // Initialize user form when user data is loaded
  useEffect(() => {
    if (userData) {
      setUserForm({
        gender: userData.gender || null,
        dateOfBirth: userData.dateOfBirth || null,
        image: null,
      });
    }
  }, [userData]);

  // Handle errors
  if (userError) {
    toast.error("Không thể tải thông tin cá nhân. Vui lòng thử lại.");
  }

  // Initialize or reset address form
  const openAddressDialog = (address?: UserProfile) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        fullName: address.fullName,
        phoneNumber: address.phoneNumber,
        province: address.province,
        provinceCode: "",
        district: address.district,
        districtCode: "",
        ward: address.ward,
        wardCode: "",
        specificAddress: address.specificAddress,
        isDefault: address.isDefault,
        fullAddress: `${address.province}, ${address.district}, ${address.ward}`,
      });
      setShowAddressDropdowns(false);
    } else {
      setEditingAddress(null);
      setAddressForm({
        fullName: user?.userName || "",
        phoneNumber: "",
        province: "",
        provinceCode: "",
        district: "",
        districtCode: "",
        ward: "",
        wardCode: "",
        specificAddress: "",
        isDefault: false,
        fullAddress: "",
      });
      setShowAddressDropdowns(true);
    }
    setIsAddressDialogOpen(true);
  };

  const closeAddressDialog = () => {
    setIsAddressDialogOpen(false);
    setEditingAddress(null);
    setShowAddressDropdowns(false);
    setAddressForm({
      fullName: user?.userName || "",
      phoneNumber: "",
      province: "",
      provinceCode: "",
      district: "",
      districtCode: "",
      ward: "",
      wardCode: "",
      specificAddress: "",
      isDefault: false,
      fullAddress: "",
    });
  };

  // Open user edit dialog
  const openUserEditDialog = () => {
    setIsUserEditDialogOpen(true);
  };

  const closeUserEditDialog = () => {
    setIsUserEditDialogOpen(false);
    setUserForm({
      gender: userData?.gender || null,
      dateOfBirth: userData?.dateOfBirth || null,
      image: null,
    });
  };

  // Open image edit dialog
  const openImageEditDialog = () => {
    setImageSrc(user?.imageUrl || null);
    setCroppedImage(null);
    setCrop({ unit: "%", x: 0, y: 0, width: 50, height: 50 });
    setIsImageEditDialogOpen(true);
  };

  const closeImageEditDialog = () => {
    setIsImageEditDialogOpen(false);
    setImageSrc(null);
    setCroppedImage(null);
    setCrop({ unit: "%", x: 0, y: 0, width: 50, height: 50 });
  };

  // Phone number validation
  const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  };

  // Save address
  const handleSaveAddress = useCallback(async () => {
    if (
      !addressForm.fullName ||
      !addressForm.phoneNumber ||
      !addressForm.province ||
      !addressForm.district ||
      !addressForm.ward ||
      !addressForm.specificAddress
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (!isValidPhoneNumber(addressForm.phoneNumber)) {
      toast.error("Số điện thoại không hợp lệ! Vui lòng nhập 10 hoặc 11 chữ số.");
      return;
    }

    setIsMutating(true);
    try {
      const profileData: UserProfileRequest = {
        fullName: addressForm.fullName,
        phoneNumber: addressForm.phoneNumber,
        province: addressForm.province,
        district: addressForm.district,
        ward: addressForm.ward,
        specificAddress: addressForm.specificAddress,
        isDefault: addressForm.isDefault,
      };

      if (editingAddress) {
        await updateUserProfile({ id: editingAddress.id, profile: profileData }).unwrap();
        toast.success("Cập nhật địa chỉ thành công!");
      } else {
        await createUserProfile(profileData).unwrap();
        toast.success("Thêm địa chỉ thành công!");
      }
      closeAddressDialog();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || "Không thể lưu địa chỉ. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  }, [addressForm, editingAddress, createUserProfile, updateUserProfile]);

  // Save user info
  const handleSaveUser = useCallback(async () => {
    if (!user?.id) {
      toast.error("Không tìm thấy thông tin người dùng!");
      return;
    }

    setIsMutating(true);
    try {
      await updateUser({
        id: user.id,
        user: {
          image: userForm.image || null,
          gender: userForm.gender || null,
          dateOfBirth: userForm.dateOfBirth || null,
        },
      }).unwrap();
      toast.success("Cập nhật thông tin cá nhân thành công!");
      closeUserEditDialog();
      window.location.reload();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || "Không thể cập nhật thông tin. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  }, [userForm, user, updateUser]);

  // Open delete confirmation dialog
  const openDeleteDialog = (id: string) => {
    setAddressToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setAddressToDelete(null);
  };

  // Delete address
  const handleDeleteAddress = useCallback(async () => {
    if (!addressToDelete) return;

    const address = profiles.find((addr) => addr.id === addressToDelete);
    if (address?.isDefault && profiles.length > 1) {
      toast.error("Không thể xóa địa chỉ mặc định! Vui lòng đặt địa chỉ khác làm mặc định trước.");
      closeDeleteDialog();
      return;
    }

    setIsMutating(true);
    try {
      await deleteUserProfile(addressToDelete).unwrap();
      toast.success("Xóa địa chỉ thành công!");
      closeDeleteDialog();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || "Không thể xóa địa chỉ. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  }, [addressToDelete, profiles, deleteUserProfile]);

  // Set default address
  const handleSetDefaultAddress = useCallback(async (id: string) => {
    const address = profiles.find((addr) => addr.id === id);
    if (!address) return;

    setIsMutating(true);
    try {
      const updatePromises = profiles
        .filter((addr) => addr.id !== id && addr.isDefault)
        .map((addr) =>
          updateUserProfile({
            id: addr.id,
            profile: { ...addr, isDefault: false },
          }).unwrap()
        );

      await Promise.all(updatePromises);

      await updateUserProfile({
        id,
        profile: { ...address, isDefault: true },
      }).unwrap();
      toast.success("Đặt địa chỉ mặc định thành công!");
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || "Không thể đặt địa chỉ mặc định. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  }, [profiles, updateUserProfile]);

  // Handle avatar change in edit dialog
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUserForm({ ...userForm, image: file });
      toast.info("Ảnh đã được chọn, nhấn Cập nhật để lưu.");
    }
  };

  // Handle image selection in image edit dialog
  const handleImageEditChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
      setCroppedImage(null);
    }
  };

  // Handle image crop
  const handleCropComplete = useCallback(
    async (crop: Crop, pixelCrop: { x: number; y: number; width: number; height: number }) => {
      if (!imageSrc) return;

      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" });
          setCroppedImage(croppedFile);
          setUserForm({ ...userForm, image: croppedFile });
        }
      }, "image/jpeg", 0.8);
    },
    [imageSrc, userForm]
  );

  // Save cropped image
  const handleSaveImage = useCallback(async () => {
    if (!croppedImage && !userForm.image) {
      toast.error("Vui lòng chọn hoặc cắt ảnh trước khi lưu!");
      return;
    }

    setIsMutating(true);
    try {
      await updateUser({
        id: user?.id || "",
        user: {
          image: croppedImage || userForm.image || null,
          gender: userForm.gender || null,
          dateOfBirth: userForm.dateOfBirth || null,
        },
      }).unwrap();
      toast.success("Cập nhật ảnh đại diện thành công!");
      closeImageEditDialog();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || "Không thể cập nhật ảnh đại diện. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  }, [croppedImage, userForm, user, updateUser]);

  // Reset image to default
  const handleResetImage = () => {
    setImageSrc(null);
    setCroppedImage(null);
    setUserForm({ ...userForm, image: null });
    toast.info("Đã đặt lại ảnh đại diện.");
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-gradient-to-br from-gray-800 to-gray-900"
          : "bg-gradient-to-br from-slate-50 to-blue-50"
      }`}
    >
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Quay lại"
            >
              <X className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hồ sơ cá nhân</h1>
              <p className="text-gray-600 dark:text-gray-300">Quản lý thông tin cá nhân và địa chỉ giao hàng</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden cursor-pointer">
                    <img
                      src={
                        userForm.image
                          ? URL.createObjectURL(userForm.image)
                          : user?.imageUrl || "/placeholder.svg?height=100&width=100&text=Avatar"
                      }
                      alt="Avatar"
                      className="w-full h-full object-cover"
                 
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" onClick={openImageEditDialog}>
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.userName || "Người dùng"}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{user?.email || "email@example.com"}</p>
                  <span className="inline-block mt-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded-full">
                    Thành viên từ {user?.createdDate ? new Date(user.createdDate).getFullYear() : "N/A"}
                  </span>
                </div>
                <nav className="space-y-2 mt-3">
                  <button
                    onClick={() => setActiveTab("personal")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === "personal"
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    aria-current={activeTab === "personal" ? "page" : undefined}
                  >
                    <User className="h-5 w-5" />
                    Thông tin cá nhân
                  </button>
                  <button
                    onClick={() => setActiveTab("addresses")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === "addresses"
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    aria-current={activeTab === "addresses" ? "page" : undefined}
                  >
                    <MapPin className="h-5 w-5" />
                    Sổ địa chỉ
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {/* Personal Information Tab */}
              {activeTab === "personal" && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg p-6"
                >
                  <div className="flex flex-row items-center justify-between mb-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                      <User className="h-5 w-5" />
                      Thông tin cá nhân
                    </h2>
                    <button
                      onClick={openUserEditDialog}
                      className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4 inline mr-2" />
                      Chỉnh sửa
                    </button>
                  </div>
                  <div className="space-y-6">
                    {authLoading || isUserLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-300 mt-4">Đang tải thông tin...</p>
                      </div>
                    ) : !user ? (
                      <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-300">Không tìm thấy thông tin người dùng.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tên người dùng
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              id="userName"
                              value={user.userName || ""}
                              disabled
                              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              id="email"
                              type="email"
                              value={user.email || ""}
                              disabled
                              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Giới tính
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              id="gender"
                              value={userData?.gender || ""}
                              disabled
                              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Ngày sinh
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              id="dateOfBirth"
                              value={userData?.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString("vi-VN") : ""}
                              disabled
                              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="roles" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Vai trò
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              id="roles"
                              value={user.roles.join(", ") || "Không có vai trò"}
                              disabled
                              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300"
                            />
                          </div>
                        </div>
                        
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Address Profiles Tab */}
              {activeTab === "addresses" && (
                <motion.div
                  key="addresses"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg p-6"
                >
                  <div className="flex flex-row items-center justify-between mb-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                      <MapPin className="h-5 w-5" />
                      Sổ địa chỉ ({profiles.length})
                    </h2>
                    <button
                      onClick={() => openAddressDialog()}
                      className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center"
                      aria-label="Thêm địa chỉ mới"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm địa chỉ mới
                    </button>
                  </div>
                  <div>
                    {authLoading || isUserLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-300 mt-4">Đang tải địa chỉ...</p>
                      </div>
                    ) : profiles.length === 0 ? (
                      <div className="text-center py-12">
                        <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có địa chỉ nào</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">Nhấn vào nút "Thêm địa chỉ mới" để thêm địa chỉ giao hàng mới.</p>
                        <button
                          onClick={() => openAddressDialog()}
                          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center mx-auto"
                          aria-label="Thêm địa chỉ đầu tiên"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm địa chỉ đầu tiên
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                          Nhấn vào nút "Thêm địa chỉ mới" để thêm địa chỉ giao hàng mới.
                        </p>
                        {profiles.map((address) => (
                          <motion.div
                            key={address.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{address.fullName}</h4>
                                  {address.isDefault && (
                                    <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-sm px-2 py-1 rounded">
                                      <Star className="h-3 w-3 inline mr-1" />
                                      Mặc định
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-1">{address.phoneNumber}</p>
                                <p className="text-gray-700 dark:text-gray-200">
                                  {address.specificAddress}, {address.ward}, {address.district}, {address.province}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {!address.isDefault && (
                                  <button
                                    onClick={() => handleSetDefaultAddress(address.id)}
                                    className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm flex items-center"
                                    disabled={isMutating || isUpdatingProfile || isDeleting}
                                    aria-label={`Đặt ${address.fullName} làm địa chỉ mặc định`}
                                  >
                                    <Star className="h-4 w-4 mr-1" />
                                    Đặt mặc định
                                  </button>
                                )}
                                <button
                                  onClick={() => openAddressDialog(address)}
                                  className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                                  disabled={isMutating || isUpdatingProfile || isDeleting}
                                  aria-label={`Chỉnh sửa địa chỉ ${address.fullName}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteDialog(address.id)}
                                  className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                                  disabled={isMutating || isUpdatingProfile || isDeleting}
                                  aria-label={`Xóa địa chỉ ${address.fullName}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* User Edit Dialog */}
        {isUserEditDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-edit-dialog-title"
            onClick={closeUserEditDialog}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 id="user-edit-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chỉnh sửa thông tin cá nhân
                </h2>
                <button
                  onClick={closeUserEditDialog}
                  className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="userAvatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ảnh đại diện
                  </label>
                  <div className="relative">
                    <input
                      id="userAvatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="userGender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Giới tính
                  </label>
                  <select
                    id="userGender"
                    value={userForm.gender || ""}
                    onChange={(e) => setUserForm({ ...userForm, gender: e.target.value || null })}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="userDateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ngày sinh
                  </label>
                  <input
                    id="userDateOfBirth"
                    type="date"
                    value={userForm.dateOfBirth || ""}
                    onChange={(e) => setUserForm({ ...userForm, dateOfBirth: e.target.value || null })}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={closeUserEditDialog}
                  className="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  aria-label="Hủy"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveUser}
                  className={`flex-1 px-4 py-2 rounded-md text-white ${
                    isMutating || isUpdatingUser
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } flex items-center justify-center`}
                  disabled={isMutating || isUpdatingUser}
                  aria-label="Cập nhật thông tin"
                >
                  {isMutating || isUpdatingUser ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Cập nhật
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Image Edit Dialog */}
        {isImageEditDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-edit-dialog-title"
            onClick={closeImageEditDialog}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 id="image-edit-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chỉnh sửa ảnh đại diện
                </h2>
                <button
                  onClick={closeImageEditDialog}
                  className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tải lên ảnh mới
                  </label>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageEditChange}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                  />
                </div>
                {imageSrc && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cắt ảnh
                    </label>
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={handleCropComplete}
                      circularCrop
                      aspect={1}
                    >
                      <img src={imageSrc} alt="Crop preview" className="max-w-full" />
                    </ReactCrop>
                  </div>
                )}
                <button
                  onClick={handleResetImage}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  aria-label="Đặt lại ảnh"
                >
                  Đặt lại ảnh
                </button>
              </div>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={closeImageEditDialog}
                  className="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  aria-label="Hủy"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveImage}
                  className={`flex-1 px-4 py-2 rounded-md text-white ${
                    isMutating || isUpdatingUser
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } flex items-center justify-center`}
                  disabled={isMutating || isUpdatingUser}
                  aria-label="Lưu ảnh"
                >
                  {isMutating || isUpdatingUser ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu ảnh
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Address Dialog */}
        {isAddressDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-dialog-title"
            onClick={closeAddressDialog}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 id="address-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
                </h2>
                <button
                  onClick={closeAddressDialog}
                  className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="addressFullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Họ và tên *
                    </label>
                    <input
                      id="addressFullName"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      placeholder="Nhập họ và tên"
                      className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="addressPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Số điện thoại *
                    </label>
                    <input
                      id="addressPhone"
                      value={addressForm.phoneNumber}
                      onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                      placeholder="Nhập số điện thoại"
                      className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                {editingAddress ? (
                  <div>
                    <label htmlFor="fullAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Địa chỉ *
                    </label>
                    <input
                      id="fullAddress"
                      value={addressForm.fullAddress}
                      onChange={(e) => setAddressForm({ ...addressForm, fullAddress: e.target.value })}
                      placeholder="Nhập tỉnh/thành phố, quận/huyện, phường/xã"
                      className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                      disabled={showAddressDropdowns}
                    />
                    <button
                      onClick={() => setShowAddressDropdowns(!showAddressDropdowns)}
                      className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      aria-label={showAddressDropdowns ? "Ẩn danh sách địa chỉ" : "Chọn địa chỉ từ danh sách"}
                    >
                      {showAddressDropdowns ? "Ẩn danh sách" : "Chọn từ danh sách"}
                    </button>
                    {showAddressDropdowns && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div className="relative">
                          <select
                            id="addressProvinceSelect"
                            value={addressForm.provinceCode}
                            onChange={(e) => {
                              const selectedProvince = provinces.find((p) => p.code.toString() === e.target.value);
                              setAddressForm({
                                ...addressForm,
                                province: selectedProvince?.name || "",
                                provinceCode: e.target.value,
                                district: "",
                                districtCode: "",
                                ward: "",
                                wardCode: "",
                                fullAddress: selectedProvince?.name || "",
                              });
                            }}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white appearance-none"
                            disabled={isFetchingProvinces}
                          >
                            <option value="">Chọn tỉnh/thành phố</option>
                            {provinces.map((province) => (
                              <option key={province.code} value={province.code}>
                                {province.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          {isFetchingProvinces && (
                            <div className="absolute right-8 top-1/2 transform -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                        <div className="relative">
                          <select
                            id="addressDistrictSelect"
                            value={addressForm.districtCode}
                            onChange={(e) => {
                              const selectedDistrict = districts.find((d) => d.code.toString() === e.target.value);
                              setAddressForm({
                                ...addressForm,
                                district: selectedDistrict?.name || "",
                                districtCode: e.target.value,
                                ward: "",
                                wardCode: "",
                                fullAddress: `${addressForm.province}, ${selectedDistrict?.name || ""}`,
                              });
                            }}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white appearance-none"
                            disabled={isFetchingDistricts || !addressForm.provinceCode}
                          >
                            <option value="">Chọn quận/huyện</option>
                            {districts.map((district) => (
                              <option key={district.code} value={district.code}>
                                {district.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          {isFetchingDistricts && (
                            <div className="absolute right-8 top-1/2 transform -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                        <div className="relative">
                          <select
                            id="addressWardSelect"
                            value={addressForm.wardCode}
                            onChange={(e) => {
                              const selectedWard = wards.find((w) => w.code.toString() === e.target.value);
                              setAddressForm({
                                ...addressForm,
                                ward: selectedWard?.name || "",
                                wardCode: e.target.value,
                                fullAddress: `${addressForm.province}, ${addressForm.district}, ${selectedWard?.name || ""}`,
                              });
                            }}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white appearance-none"
                            disabled={isFetchingWards || !addressForm.districtCode}
                          >
                            <option value="">Chọn phường/xã</option>
                            {wards.map((ward) => (
                              <option key={ward.code} value={ward.code}>
                                {ward.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          {isFetchingWards && (
                            <div className="absolute right-8 top-1/2 transform -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <label htmlFor="addressProvince" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tỉnh/Thành phố *
                      </label>
                      <select
                        id="addressProvince"
                        value={addressForm.provinceCode}
                        onChange={(e) => {
                          const selectedProvince = provinces.find((p) => p.code.toString() === e.target.value);
                          setAddressForm({
                            ...addressForm,
                            province: selectedProvince?.name || "",
                            provinceCode: e.target.value,
                            district: "",
                            districtCode: "",
                            ward: "",
                            wardCode: "",
                          });
                        }}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white appearance-none"
                        disabled={isFetchingProvinces}
                      >
                        <option value="">Chọn tỉnh/thành phố</option>
                        {provinces.map((province) => (
                          <option key={province.code} value={province.code}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      {isFetchingProvinces && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                    <div className="relative">
                      <label htmlFor="addressDistrict" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quận/Huyện *
                      </label>
                      <select
                        id="addressDistrict"
                        value={addressForm.districtCode}
                        onChange={(e) => {
                          const selectedDistrict = districts.find((d) => d.code.toString() === e.target.value);
                          setAddressForm({
                            ...addressForm,
                            district: selectedDistrict?.name || "",
                            districtCode: e.target.value,
                            ward: "",
                            wardCode: "",
                          });
                        }}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white appearance-none"
                        disabled={isFetchingDistricts || !addressForm.provinceCode}
                      >
                        <option value="">Chọn quận/huyện</option>
                        {districts.map((district) => (
                          <option key={district.code} value={district.code}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      {isFetchingDistricts && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                    <div className="relative">
                      <label htmlFor="addressWard" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phường/Xã *
                      </label>
                      <select
                        id="addressWard"
                        value={addressForm.wardCode}
                        onChange={(e) => {
                          const selectedWard = wards.find((w) => w.code.toString() === e.target.value);
                          setAddressForm({
                            ...addressForm,
                            ward: selectedWard?.name || "",
                            wardCode: e.target.value,
                          });
                        }}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white appearance-none"
                        disabled={isFetchingWards || !addressForm.districtCode}
                      >
                        <option value="">Chọn phường/xã</option>
                        {wards.map((ward) => (
                          <option key={ward.code} value={ward.code}>
                            {ward.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      {isFetchingWards && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Địa chỉ chi tiết *
                  </label>
                  <textarea
                    id="addressDetail"
                    value={addressForm.specificAddress}
                    onChange={(e) => setAddressForm({ ...addressForm, specificAddress: e.target.value })}
                    placeholder="Nhập địa chỉ chi tiết (số nhà, tên đường, tòa nhà...)"
                    rows={3}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="isDefault"
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={closeAddressDialog}
                  className="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  aria-label="Hủy"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveAddress}
                  className={`flex-1 px-4 py-2 rounded-md text-white ${
                    isMutating || isCreating || isUpdatingProfile
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } flex items-center justify-center`}
                  disabled={isMutating || isCreating || isUpdatingProfile}
                  aria-label={editingAddress ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
                >
                  {isMutating || isCreating || isUpdatingProfile ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingAddress ? "Cập nhật" : "Thêm địa chỉ"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        {isDeleteDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={closeDeleteDialog}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 id="delete-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                  Xác nhận xóa địa chỉ
                </h2>
                <button
                  onClick={closeDeleteDialog}
                  className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={closeDeleteDialog}
                  className="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  aria-label="Hủy"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteAddress}
                  className={`flex-1 px-4 py-2 rounded-md text-white ${
                    isMutating || isDeleting
                      ? "bg-red-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  } flex items-center justify-center`}
                  disabled={isMutating || isDeleting}
                  aria-label="Xóa địa chỉ"
                >
                  {isMutating || isDeleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Xóa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;