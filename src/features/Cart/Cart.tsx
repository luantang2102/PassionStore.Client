/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Truck,
  MapPin,
  Gift,
  Tag,
  CheckCircle,
  Star,
  Edit,
  X,
  ChevronDown,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useDeleteCartItemMutation,
} from "../../app/api/cartApi";
import {
  useFetchUserByIdQuery,
  useCreateUserProfileMutation,
  useUpdateUserProfileMutation,
} from "../../app/api/userApi";
import {
  useCreateOrderMutation,
  useHandlePaymentCallbackQuery,
} from "../../app/api/orderApi";
import { useAppSelector } from "../../app/store/store";
import { CartItemRequest } from "../../app/models/requests/cartItemRequest";
import { UserProfile } from "../../app/models/responses/userProfile";
import { UserProfileRequest } from "../../app/models/requests/userProfileRequest";
import { PaymentMethod, ShippingMethod } from "../../app/models/responses/order";

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
}

const paymentMethods = [
  { id: PaymentMethod.COD, name: "Thanh toán khi nhận hàng (COD)", description: "Thanh toán bằng tiền mặt khi nhận hàng", icon: "💵", fee: 0 },
  { id: PaymentMethod.VietQR, name: "VietQR (hỗ trợ bởi PayOS)", description: "Quét mã QR để thanh toán", icon: "📱", fee: 0 },
];

const shippingMethods = [
  { id: ShippingMethod.Standard, name: "Tiêu chuẩn", description: "3-5 ngày làm việc", price: 30000, estimatedDays: "3-5" },
  { id: ShippingMethod.Express, name: "Nhanh", description: "1-2 ngày làm việc", price: 50000, estimatedDays: "1-2" },
  { id: ShippingMethod.SameDay, name: "Trong ngày", description: "Chỉ áp dụng nội thành HN, HCM", price: 80000, estimatedDays: "Trong ngày" },
];

const steps = [
  { id: 1, name: "Giỏ hàng", icon: ShoppingCart },
  { id: 2, name: "Thông tin giao hàng", icon: Truck },
  { id: 3, name: "Thanh toán", icon: CreditCard },
  { id: 4, name: "Xác nhận", icon: Check },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
};

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useAppSelector((state) => state.ui);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { data: cart, isLoading, error } = useGetCartQuery({});
  const { data: userData, isLoading: isUserLoading } = useFetchUserByIdQuery(user?.id || "", {
    skip: !isAuthenticated || !user?.id,
  });
  const [addCartItem, { isLoading: isAdding }] = useAddCartItemMutation();
  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation();
  const [deleteCartItem, { isLoading: isDeleting }] = useDeleteCartItemMutation();
  const [createUserProfile, { isLoading: isCreatingProfile }] = useCreateUserProfileMutation();
  const [updateUserProfile, { isLoading: isUpdatingProfile }] = useUpdateUserProfileMutation();
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();

  const [currentStep, setCurrentStep] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [note, setNote] = useState("");
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserProfile | null>(null);
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
  });
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isFetchingProvinces, setIsFetchingProvinces] = useState(false);
  const [isFetchingDistricts, setIsFetchingDistricts] = useState(false);
  const [isFetchingWards, setIsFetchingWards] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState(ShippingMethod.Standard);
  const [selectedPayment, setSelectedPayment] = useState(PaymentMethod.COD);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  // Handle payment callback query parameters
  const queryParams = new URLSearchParams(location.search);
  const paymentCallbackParams = {
    code: queryParams.get("code") || "",
    id: queryParams.get("id") || "",
    cancel: queryParams.get("cancel") === "true",
    status: queryParams.get("status") || "",
    orderCode: parseInt(queryParams.get("orderCode") || "0"),
  };
  const isPaymentCallback = queryParams.has("code") && queryParams.has("id") && queryParams.has("cancel") && queryParams.has("status") && queryParams.has("orderCode");
  const { data: paymentResult, isLoading: isPaymentCallbackLoading, error: paymentCallbackError } = useHandlePaymentCallbackQuery(paymentCallbackParams, {
    skip: !isPaymentCallback,
  });

  const profiles = userData?.userProfiles || [];

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

  // Select default profile on load
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      const defaultProfile = profiles.find((profile) => profile.isDefault) || profiles[0];
      setSelectedProfile(defaultProfile);
    }
  }, [profiles, selectedProfile]);

  // Handle payment callback result
  useEffect(() => {
    if (isPaymentCallback && !isPaymentCallbackLoading) {
      if (paymentCallbackError) {
        setPaymentFailed(true);
        setCurrentStep(3); // Redirect to payment step to retry
      } else if (paymentResult) {
        toast.success("Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.");
        setOrderId(paymentResult.id);
        setOrderPlaced(true);
        setCurrentStep(4);
      } else if (paymentCallbackParams.cancel && paymentCallbackParams.status === "CANCELLED") {
        setPaymentFailed(true);
        setCurrentStep(3); // Redirect to payment step to retry
      } else {
        setPaymentFailed(true);
        setCurrentStep(3); // Redirect to payment step to retry
      }
      // Clear query parameters
      navigate("/cart", { replace: true });
    }
  }, [paymentResult, isPaymentCallbackLoading, paymentCallbackError, navigate, isPaymentCallback, paymentCallbackParams]);

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
      });
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
        isDefault: profiles.length === 0,
      });
    }
    setIsAddressDialogOpen(true);
  };

  const closeAddressDialog = () => {
    setIsAddressDialogOpen(false);
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
      isDefault: profiles.length === 0,
    });
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

      let newProfile: UserProfile;
      if (editingAddress) {
        newProfile = await updateUserProfile({ id: editingAddress.id, profile: profileData }).unwrap();
        toast.success("Cập nhật địa chỉ thành công!");
      } else {
        newProfile = await createUserProfile(profileData).unwrap();
        toast.success("Thêm địa chỉ thành công!");
      }
      setSelectedProfile(newProfile);
      closeAddressDialog();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || "Không thể lưu địa chỉ. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  }, [addressForm, editingAddress, createUserProfile, updateUserProfile]);

  const updateQuantity = async (itemId: string, productVariantId: string, newQuantity: number) => {
    try {
      const request: CartItemRequest = { productVariantId, quantity: Math.max(1, newQuantity) };
      await updateCartItem({ id: itemId, data: request }).unwrap();
      toast.success("Cập nhật số lượng thành công!");
    } catch (err) {
      toast.error("Không thể cập nhật số lượng. Vui lòng thử lại.");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await deleteCartItem(itemId).unwrap();
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng!");
    } catch (err) {
      toast.error("Không thể xóa sản phẩm. Vui lòng thử lại.");
    }
  };

  const applyCoupon = () => {
    if (couponCode === "SAVE10") {
      setAppliedCoupon({ code: "SAVE10", discount: 0.1, description: "Giảm 10% tổng đơn hàng" });
      toast.success("Áp dụng mã giảm giá thành công!");
    } else if (couponCode === "FREESHIP") {
      setAppliedCoupon({ code: "FREESHIP", discount: 0, freeShipping: true, description: "Miễn phí vận chuyển" });
      toast.success("Áp dụng mã giảm giá thành công!");
    } else {
      toast.error("Mã giảm giá không hợp lệ!");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Đã xóa mã giảm giá.");
  };

  const subtotal = cart?.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const discount = appliedCoupon?.discount ? subtotal * appliedCoupon.discount : 0;
  const selectedShippingMethod = shippingMethods.find((method) => method.id === selectedShipping);
  const shippingFee = appliedCoupon?.freeShipping ? 0 : selectedShippingMethod?.price || 0;
  const total = subtotal - discount + shippingFee;

  const handleNextStep = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để tiếp tục!");
      navigate("/signin");
      return;
    }

    if (currentStep === 1 && (!cart || cart.cartItems.length === 0)) {
      toast.error("Giỏ hàng trống!");
      return;
    }

    if (currentStep === 2 && !selectedProfile) {
      toast.error("Vui lòng chọn một địa chỉ giao hàng!");
      return;
    }

    if (currentStep === 3 && !agreeTerms) {
      toast.error("Vui lòng đồng ý với điều khoản và điều kiện!");
      return;
    }

    if (currentStep === 3) {
      try {
        const formData = new FormData();
        formData.append("PaymentMethod", selectedPayment);
        formData.append("ShippingMethod", selectedShipping);
        if (note) formData.append("Note", note);
        const orderResponse = await createOrder(formData).unwrap();
        setOrderId(orderResponse.id);
        if (selectedPayment === PaymentMethod.VietQR && orderResponse.paymentLink) {
          window.location.href = orderResponse.paymentLink; // Redirect to VietQR payment link
        } else {
          setOrderPlaced(true);
          setCurrentStep(4);
        }
      } catch (error: any) {
        const errorMessage = error?.data?.message || "Không thể tạo đơn hàng. Vui lòng thử lại.";
        toast.error(errorMessage);
      }
      return;
    }

    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  if (isLoading || isUserLoading || (isPaymentCallback && isPaymentCallbackLoading)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-300 mt-4">{isPaymentCallback ? "Đang xử lý thanh toán..." : "Đang tải giỏ hàng..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
        <p className="text-gray-600 dark:text-gray-300">Không thể tải giỏ hàng. Vui lòng thử lại.</p>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
        <div className="container mx-auto px-4 pt-24 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="h-10 w-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Đặt hàng thành công!</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Cảm ơn bạn đã mua sắm tại Passion. Đơn hàng của bạn đã được xác nhận và đang được xử lý.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Mã đơn hàng:</span>
                    <div className="font-semibold text-lg text-gray-900 dark:text-white">{orderId}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Tổng tiền:</span>
                    <div className="font-semibold text-lg text-red-600">{formatPrice(total)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Phương thức thanh toán:</span>
                    <div className="font-medium text-gray-900 dark:text-white">{paymentMethods.find((method) => method.id === selectedPayment)?.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Thời gian giao hàng:</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedShippingMethod?.estimatedDays} ngày</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => navigate("/")}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-300"
                >
                  Tiếp tục mua sắm
                </button>
                <button
                  onClick={() => navigate("/orders")}
                  className="w-full border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  Xem đơn hàng của tôi
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (paymentFailed) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
        <div className="container mx-auto px-4 pt-24 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <XCircle className="h-10 w-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Thanh toán thất bại</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Rất tiếc, thanh toán của bạn không thành công. Vui lòng thử lại hoặc quay lại giỏ hàng để tiếp tục.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Mã đơn hàng:</span>
                    <div className="font-semibold text-lg text-gray-900 dark:text-white">{paymentCallbackParams.orderCode || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Tổng tiền:</span>
                    <div className="font-semibold text-lg text-red-600">{formatPrice(total)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Phương thức thanh toán:</span>
                    <div className="font-medium text-gray-900 dark:text-white">{paymentMethods.find((method) => method.id === selectedPayment)?.name || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Thời gian giao hàng:</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedShippingMethod?.estimatedDays || "N/A"} ngày</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setPaymentFailed(false);
                    setCurrentStep(3);
                  }}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-300"
                >
                  Thử lại thanh toán
                </button>
                <button
                  onClick={() => {
                    setPaymentFailed(false);
                    setCurrentStep(1);
                    navigate("/cart");
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  Quay lại giỏ hàng
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Giỏ hàng & Thanh toán</h1>
        </div>

        {/* Progress Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step.id ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-400"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`ml-3 font-medium ${currentStep >= step.id ? "text-blue-600" : "text-gray-400 dark:text-gray-400"}`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4 hidden sm:block">
                    <div className="h-0.5 bg-gray-200 dark:bg-gray-600">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: currentStep > step.id ? "100%" : "0%" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Cart */}
              {currentStep === 1 && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Giỏ hàng ({cart?.cartItems.length || 0} sản phẩm)</h2>
                    </div>
                    <div className="space-y-4">
                      {!cart || cart.cartItems.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingCart className="h-16 w-16 text-gray-300 dark:text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Giỏ hàng trống</h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục</p>
                          <button
                            onClick={() => navigate("/products")}
                            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300"
                          >
                            Tiếp tục mua sắm
                          </button>
                        </div>
                      ) : (
                        cart.cartItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg dark:border-gray-600">
                            <img
                              src={item.productImage || "/placeholder.svg?height=80&width=80"}
                              alt={item.productName}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{item.productName}</h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                                <span>Màu: {item.color.name}</span>
                                <span>Size: {item.size.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.id, item.productVariantId, item.quantity - 1)}
                                  className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                  disabled={item.quantity <= 1 || isUpdating}
                                >
                                  <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </button>
                                <span className="px-3 py-2 font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.productVariantId, item.quantity + 1)}
                                  className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                  disabled={isUpdating}
                                >
                                  <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </button>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-lg text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</div>
                              </div>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg disabled:opacity-50"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      {cart && cart.cartItems.length > 0 && (
                        <div className="border-t pt-4 dark:border-gray-600">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Nhập mã giảm giá"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            />
                            {appliedCoupon ? (
                              <button
                                onClick={removeCoupon}
                                className="border border-red-500 text-red-500 py-2 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-all duration-300"
                              >
                                Xóa mã
                              </button>
                            ) : (
                              <button
                                onClick={applyCoupon}
                                className="border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                              >
                                <Tag className="h-4 w-4 inline mr-2" />
                                Áp dụng
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Shipping Info */}
              {currentStep === 2 && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Truck className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thông tin giao hàng</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chọn địa chỉ giao hàng</h3>
                        <button
                          onClick={() => openAddressDialog()}
                          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center"
                          aria-label="Thêm địa chỉ mới"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm địa chỉ mới
                        </button>
                      </div>
                      {profiles.length === 0 ? (
                        <div className="text-center py-12">
                          <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có địa chỉ nào</h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">Nhấn vào nút "Thêm địa chỉ mới" để thêm địa chỉ giao hàng.</p>
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
                          {profiles.map((profile) => (
                            <div
                              key={profile.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                selectedProfile?.id === profile.id
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                                  : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                              onClick={() => setSelectedProfile(profile)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{profile.fullName}</h4>
                                    {profile.isDefault && (
                                      <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-sm px-2 py-1 rounded">
                                        <Star className="h-3 w-3 inline mr-1" />
                                        Mặc định
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-600 dark:text-gray-300 mb-1">{profile.phoneNumber}</p>
                                  <p className="text-gray-700 dark:text-gray-200">
                                    {profile.specificAddress}, {profile.ward}, {profile.district}, {profile.province}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAddressDialog(profile);
                                  }}
                                  className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                                  aria-label={`Chỉnh sửa địa chỉ ${profile.fullName}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          rows={3}
                          placeholder="Ghi chú cho đơn hàng (nếu có)"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Truck className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Phương thức vận chuyển</h2>
                      </div>
                      <div className="space-y-4">
                        {shippingMethods.map((method) => (
                          <label
                            key={method.id}
                            className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                              selectedShipping === method.id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name="shipping"
                              value={method.id}
                              checked={selectedShipping === method.id}
                              onChange={() => setSelectedShipping(method.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">{method.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">{method.description}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900 dark:text-white">{formatPrice(method.price)}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">{method.estimatedDays} ngày</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Phương thức thanh toán</h2>
                      </div>
                      <div className="space-y-4">
                        {paymentMethods.map((method) => (
                          <label
                            key={method.id}
                            className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                              selectedPayment === method.id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={method.id}
                              checked={selectedPayment === method.id}
                              onChange={() => setSelectedPayment(method.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">{method.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">{method.description}</div>
                            </div>
                            <div className="text-2xl">{method.icon}</div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={() => setAgreeTerms(!agreeTerms)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Tôi đồng ý với <a href="#" className="text-blue-600 hover:underline">điều khoản và điều kiện</a>
                        </span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tóm tắt đơn hàng</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Tạm tính ({cart?.cartItems.length || 0} sản phẩm)</span>
                  <span className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Phí vận chuyển</span>
                  <span className="text-gray-900 dark:text-white">{formatPrice(shippingFee)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Giảm giá ({appliedCoupon.code})</span>
                    <span className="text-red-600">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Tổng cộng</span>
                  <span className="font-semibold text-xl text-red-600">{formatPrice(total)}</span>
                </div>
              </div>
              {appliedCoupon && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">{appliedCoupon.description}</span>
                  </div>
                  <button onClick={removeCoupon} className="text-sm text-red-600 hover:underline">
                    Xóa
                  </button>
                </div>
              )}
              <div className="mt-6 space-y-4">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevStep}
                    className="w-full border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                  </button>
                )}
                <button
                  onClick={handleNextStep}
                  className={`w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center ${
                    isAdding || isUpdating || isDeleting || isCreatingProfile || isUpdatingProfile || isCreatingOrder ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isAdding || isUpdating || isDeleting || isCreatingProfile || isUpdatingProfile || isCreatingOrder}
                >
                  {currentStep === 3 ? (isCreatingOrder ? "Đang đặt hàng..." : "Đặt hàng") : "Tiếp tục"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

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
                    isMutating || isCreatingProfile || isUpdatingProfile
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } flex items-center justify-center`}
                  disabled={isMutating || isCreatingProfile || isUpdatingProfile}
                  aria-label={editingAddress ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
                >
                  {isMutating || isCreatingProfile || isUpdatingProfile ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {editingAddress ? "Cập nhật" : "Thêm địa chỉ"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}