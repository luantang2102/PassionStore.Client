/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CreditCard,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Wallet,
  Star,
  ShoppingCart,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAppSelector } from "../../app/store/store";
import { useFetchSelfOrdersQuery, useGetOrderByIdQuery, useCancelOrderMutation } from "../../app/api/orderApi";
import { useHasRatedProductQuery } from "../../app/api/ratingApi";
import { Order, PaymentMethod, ShippingMethod } from "../../app/models/responses/order";
import type { OrderItem } from "../../app/models/responses/order";
import RatingModal from "./RatingModal";

// Define OrderStatus enum to mirror backend
enum OrderStatus {
  PendingPayment = "PendingPayment",
  PaymentConfirmed = "PaymentConfirmed",
  OrderConfirmed = "OrderConfirmed",
  Processing = "Processing",
  ReadyToShip = "ReadyToShip",
  Shipped = "Shipped",
  OutForDelivery = "OutForDelivery",
  Delivered = "Delivered",
  PaymentReceived = "PaymentReceived",
  Completed = "Completed",
  PaymentFailed = "PaymentFailed",
  OnHold = "OnHold",
  Cancelled = "Cancelled",
  Returned = "Returned",
  Refunded = "Refunded",
}

// Translations for status, payment method, and shipping method
const statusTranslations: Record<OrderStatus, string> = {
  [OrderStatus.PendingPayment]: "Chờ thanh toán",
  [OrderStatus.PaymentConfirmed]: "Đã xác nhận thanh toán",
  [OrderStatus.OrderConfirmed]: "Đã xác nhận đơn hàng",
  [OrderStatus.Processing]: "Đang xử lý",
  [OrderStatus.ReadyToShip]: "Sẵn sàng giao",
  [OrderStatus.Shipped]: "Đã giao cho vận chuyển",
  [OrderStatus.OutForDelivery]: "Đang giao hàng",
  [OrderStatus.Delivered]: "Đã giao hàng",
  [OrderStatus.PaymentReceived]: "Đã nhận thanh toán",
  [OrderStatus.Completed]: "Hoàn tất",
  [OrderStatus.PaymentFailed]: "Thanh toán thất bại",
  [OrderStatus.OnHold]: "Tạm giữ",
  [OrderStatus.Cancelled]: "Đã hủy",
  [OrderStatus.Returned]: "Đã trả hàng",
  [OrderStatus.Refunded]: "Đã hoàn tiền",
};

const paymentMethodTranslations: Record<PaymentMethod, string> = {
  [PaymentMethod.COD]: "Thanh toán khi nhận hàng",
  [PaymentMethod.VietQR]: "VietQR (hỗ trợ bởi PayOS)",
};

const shippingMethodTranslations: Record<ShippingMethod, string> = {
  [ShippingMethod.Standard]: "Tiêu chuẩn",
  [ShippingMethod.Express]: "Nhanh",
  [ShippingMethod.SameDay]: "Trong ngày",
};

// Status badge styles
const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case OrderStatus.PendingPayment:
    case OrderStatus.OrderConfirmed:
    case OrderStatus.Processing:
    case OrderStatus.ReadyToShip:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case OrderStatus.Shipped:
    case OrderStatus.OutForDelivery:
    case OrderStatus.Delivered:
    case OrderStatus.PaymentReceived:
    case OrderStatus.Completed:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case OrderStatus.PaymentFailed:
    case OrderStatus.OnHold:
    case OrderStatus.Cancelled:
    case OrderStatus.Returned:
    case OrderStatus.Refunded:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

// Reuse formatPrice from Cart.tsx
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
};

// Check if order is eligible for rating (Completed and within 3 months)
const isEligibleForRating = (order: Order): boolean => {
  if (order.status !== OrderStatus.Completed || !order.updatedDate) return false;
  const updatedDate = new Date(order.updatedDate);
  const threeMonthsLater = new Date(updatedDate);
  threeMonthsLater.setMonth(updatedDate.getMonth() + 3);
  return new Date() <= threeMonthsLater;
};

// Group order items by productId
const groupOrderItemsByProductId = (orderItems: OrderItem[]) => {
  const grouped: { [key: string]: { productId: string; productName: string; variants: OrderItem[]; totalPrice: number } } = {};
  orderItems.forEach((item) => {
    if (!grouped[item.productId]) {
      grouped[item.productId] = {
        productId: item.productId,
        productName: item.productName,
        variants: [],
        totalPrice: 0,
      };
    }
    grouped[item.productId].variants.push(item);
    grouped[item.productId].totalPrice += item.price * item.quantity;
  });
  return Object.values(grouped);
};

// New OrderItem component to handle individual product rendering
interface OrderItemProps {
  product: { productId: string; productName: string; variants: OrderItem[]; totalPrice: number };
  order: Order;
  setRatingOrder: (rating: { orderId: string; productId: string; productName: string } | null) => void;
}

const OrderItem = ({ product, order, setRatingOrder }: OrderItemProps) => {
  const navigate = useNavigate();
  const { darkMode } = useAppSelector((state) => state.ui);
  const { data: hasRated, isLoading: isRatingLoading, error } = useHasRatedProductQuery(product.productId);

  return (
    <div className="border-b dark:border-gray-600 pb-2">
      <div className="flex items-center gap-4">
        <img
          src={product.variants[0].productImage || "/placeholder.svg?height=80&width=80"}
          alt={product.productName}
          className="w-16 h-16 object-cover rounded-lg"
        />
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">{product.productName}</p>
          {product.variants.map((variant) => (
            <p key={variant.id} className="text-sm text-gray-600 dark:text-gray-300">
              Màu: {variant.color?.name} | Size: {variant.size?.name} | Số lượng: {variant.quantity}
            </p>
          ))}
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(product.totalPrice)}</p>
          <div className="mt-2 space-y-2">
            {isEligibleForRating(order) && !isRatingLoading && !hasRated && !error && (
              <button
                onClick={() =>
                  setRatingOrder({
                    orderId: order.id,
                    productId: product.productId,
                    productName: product.productName,
                  })
                }
                className="px-4 py-1 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900 rounded-lg transition-colors duration-200 text-sm"
              >
                <Star className="h-4 w-4 inline mr-2" />
                Thêm đánh giá
              </button>
            )}
            {(order.status === OrderStatus.Cancelled || (isEligibleForRating(order) && hasRated)) && (
              <button
                onClick={() => navigate(`/products/${product.productId}`)}
                className="px-4 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors duration-200 text-sm"
              >
                <ShoppingCart className="h-4 w-4 inline mr-2" />
                Mua lại
              </button>
            )}
            {isRatingLoading && (
              <p className="text-sm text-gray-600 dark:text-gray-300">Đang kiểm tra trạng thái đánh giá...</p>
            )}
            {hasRated && order.status !== OrderStatus.Cancelled && (
              <p className="text-sm text-gray-600 dark:text-gray-300">Bạn đã đánh giá sản phẩm này</p>
            )}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">Lỗi khi kiểm tra trạng thái đánh giá</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const navigate = useNavigate();
  const { darkMode } = useAppSelector((state) => state.ui);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [ratingOrder, setRatingOrder] = useState<{ orderId: string; productId: string; productName: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const pageSize = 5;

  // Fetch orders with pagination and filters
  const { data: ordersData, isLoading, error } = useFetchSelfOrdersQuery({
    pageNumber,
    pageSize,
    status: statusFilter || undefined,
    searchTerm: searchTerm || undefined,
  });

  // Fetch selected order details
  const { data: selectedOrder, isLoading: isOrderDetailsLoading } = useGetOrderByIdQuery(selectedOrderId || "", {
    skip: !selectedOrderId,
  });

  const [cancelOrder, { isLoading: isCanceling }] = useCancelOrderMutation();

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder({ id: orderId, cancellationReason: "User canceled from Orders page" }).unwrap();
      toast.success("Đã hủy đơn hàng thành công!");
    } catch (err: any) {
      const errorMessage = err?.data?.message || "Không thể hủy đơn hàng. Vui lòng thử lại.";
      toast.error(errorMessage);
    }
  };

  const handleContinuePayment = (paymentLink: string) => {
    window.open(paymentLink, "_blank");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (ordersData?.pagination?.totalPages || 1)) {
      setPageNumber(newPage);
    }
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPageNumber(1); // Reset to first page on filter change
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPageNumber(1); // Reset to first page on search
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-slate-50 to-blue-50"}`}>
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-300 mt-4">Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-slate-50 to-blue-50"}`}>
        <p className="text-gray-600 dark:text-gray-300">Không thể tải đơn hàng. Vui lòng thử lại.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-slate-50 to-blue-50"}`}>
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Đơn hàng của tôi</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Danh sách đơn hàng ({ordersData?.pagination?.totalCount || 0})</h2>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm đơn hàng (mã đơn hàng, tên sản phẩm, trạng thái...)"
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-gray-300 placeholder-gray-400"
                    : "border-gray-200 bg-white text-gray-900 placeholder-gray-500"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              disabled={isLoading}
              className={`w-full sm:w-48 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                darkMode
                  ? "border-gray-600 bg-gray-700 text-gray-300"
                  : "border-gray-200 bg-white text-gray-900"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.values(OrderStatus).map((status) => (
                <option key={status} value={status}>
                  {statusTranslations[status]}
                </option>
              ))}
            </select>
          </div>

          {ordersData?.items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 dark:text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có đơn hàng nào</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Hãy mua sắm để tạo đơn hàng đầu tiên của bạn!</p>
              <button
                onClick={() => navigate("/products")}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300"
              >
                Khám phá sản phẩm
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {ordersData?.items.map((order: Order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border rounded-lg p-4 dark:border-gray-600"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Mã đơn hàng: {order.id}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Ngày đặt: {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <span
                        className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusBadgeClass(order.status)}`}
                      >
                        {statusTranslations[order.status as OrderStatus] || order.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">
                        <CreditCard className="h-4 w-4 inline mr-2" />
                        Phương thức thanh toán: {paymentMethodTranslations[order.paymentMethod] || order.paymentMethod}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <Truck className="h-4 w-4 inline mr-2" />
                        Phương thức vận chuyển: {shippingMethodTranslations[order.shippingMethod] || order.shippingMethod}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <Package className="h-4 w-4 inline mr-2" />
                        Tổng tiền: {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                    <div className="flex justify-end items-end gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors duration-200"
                      >
                        Xem chi tiết
                      </button>
                      {(order.status === OrderStatus.PendingPayment || order.status === OrderStatus.OrderConfirmed) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={isCanceling}
                          className={`px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors duration-200 ${
                            isCanceling ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <XCircle className="h-4 w-4 inline mr-2" />
                          Hủy đơn
                        </button>
                      )}
                      {order.status === OrderStatus.PendingPayment && order.paymentMethod === PaymentMethod.VietQR && order.paymentLink && (
                        <button
                          onClick={() => handleContinuePayment(order.paymentLink!)}
                          className="px-4 py-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-colors duration-200"
                        >
                          <Wallet className="h-4 w-4 inline mr-2" />
                          Tiếp tục thanh toán
                        </button>
                      )}
                      {order.status === OrderStatus.Cancelled && (
                        <button
                          onClick={() => navigate(`/products/${order.orderItems[0].productId}`)}
                          className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors duration-200"
                        >
                          <ShoppingCart className="h-4 w-4 inline mr-2" />
                          Mua lại
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {/* Pagination */}
              {ordersData?.pagination && ordersData.pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => handlePageChange(pageNumber - 1)}
                    disabled={pageNumber === 1}
                    className={`p-2 rounded-lg ${
                      pageNumber === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-gray-900 dark:text-white">
                    Trang {ordersData.pagination.currentPage} / {ordersData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pageNumber + 1)}
                    disabled={pageNumber === ordersData.pagination.totalPages}
                    className={`p-2 rounded-lg ${
                      pageNumber === ordersData.pagination.totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        <AnimatePresence>
          {selectedOrderId && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-details-title"
              onClick={() => setSelectedOrderId(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 id="order-details-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chi tiết đơn hàng #{selectedOrder.id}
                  </h2>
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                    aria-label="Đóng"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                {isOrderDetailsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">
                          <Clock className="h-4 w-4 inline mr-2" />
                          Ngày đặt: {new Date(selectedOrder.orderDate).toLocaleDateString("vi-VN")}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          <Package className="h-4 w-4 inline mr-2" />
                          Trạng thái: {statusTranslations[selectedOrder.status as OrderStatus] || selectedOrder.status}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          <CreditCard className="h-4 w-4 inline mr-2" />
                          Phương thức thanh toán: {paymentMethodTranslations[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          <Truck className="h-4 w-4 inline mr-2" />
                          Phương thức vận chuyển: {shippingMethodTranslations[selectedOrder.shippingMethod] || selectedOrder.shippingMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-300 font-semibold">Địa chỉ giao hàng</p>
                        <p className="text-gray-600 dark:text-gray-300">{selectedOrder.userFullName}</p>
                        <p className="text-gray-600 dark:text-gray-300">{selectedOrder.shippingAddress}</p>
                        {selectedOrder.note && (
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">Ghi chú:</span> {selectedOrder.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 font-semibold mb-2">Sản phẩm</p>
                      <div className="space-y-4">
                        {groupOrderItemsByProductId(selectedOrder.orderItems).map((product) => (
                          <OrderItem
                            key={product.productId}
                            product={product}
                            order={selectedOrder}
                            setRatingOrder={setRatingOrder}
                          />
                        ))}
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                          <span>Phí vận chuyển</span>
                          <span>{formatPrice(selectedOrder.shippingCost)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t dark:border-gray-600 pt-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Tổng cộng</span>
                        <span className="font-semibold text-xl text-red-600">{formatPrice(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      {selectedOrder.status === OrderStatus.PendingPayment && selectedOrder.paymentMethod === PaymentMethod.VietQR && selectedOrder.paymentLink && (
                        <button
                          onClick={() => handleContinuePayment(selectedOrder.paymentLink!)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          <Wallet className="h-4 w-4 inline mr-2" />
                          Tiếp tục thanh toán
                        </button>
                      )}
                      {selectedOrder.status === OrderStatus.Cancelled && (
                        <button
                          onClick={() => navigate(`/products/${selectedOrder.orderItems[0].productId}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                          <ShoppingCart className="h-4 w-4 inline mr-2" />
                          Mua lại
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rating Modal */}
        <AnimatePresence>
          {ratingOrder && (
            <RatingModal
              orderId={ratingOrder.orderId}
              productId={ratingOrder.productId}
              productName={ratingOrder.productName}
              onClose={() => setRatingOrder(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Orders;