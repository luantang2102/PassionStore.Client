/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Heart,
  ShoppingCart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Truck,
  Shield,
  RotateCcw,
  Check,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { useFetchProductByIdQuery } from "../../app/api/productApi";
import { useAddCartItemMutation } from "../../app/api/cartApi"; // Import cart API hook
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import { ProductVariant } from "../../app/models/responses/productVariant";

// Placeholder size guide data
const sizeGuide = {
  "39": { eu: "39", us: "6.5", uk: "6", cm: "24.5" },
  "40": { eu: "40", us: "7", uk: "6.5", cm: "25" },
  "41": { eu: "41", us: "8", uk: "7.5", cm: "25.5" },
  "42": { eu: "42", us: "8.5", uk: "8", cm: "26" },
  "43": { eu: "43", us: "9.5", uk: "9", cm: "26.5" },
  "44": { eu: "44", us: "10", uk: "9.5", cm: "27" },
  "45": { eu: "45", us: "11", uk: "10.5", cm: "27.5" },
};

// Mock related products
const relatedProducts = [
  {
    id: "2",
    name: "Giày chạy bộ nữ - Run Comfort",
    brand: { name: "KALENJI" },
    minPrice: 1299000,
    maxPrice: 1599000,
    averageRating: 4.6,
    totalReviews: 456,
    productImages: [{ imageUrl: "/placeholder.svg?height=200&width=200&text=Related1", id: "img2", createdDate: "2024-01-01" }],
  },
  {
    id: "3",
    name: "Áo thun chạy bộ nam - Dry+",
    brand: { name: "KALENJI" },
    minPrice: 299000,
    maxPrice: 299000,
    averageRating: 4.4,
    totalReviews: 234,
    productImages: [{ imageUrl: "/placeholder.svg?height=200&width=200&text=Related2", id: "img3", createdDate: "2024-01-01" }],
  },
  {
    id: "4",
    name: "Quần short chạy bộ - Run Dry",
    brand: { name: "KALENJI" },
    minPrice: 399000,
    maxPrice: 499000,
    averageRating: 4.7,
    totalReviews: 189,
    productImages: [{ imageUrl: "/placeholder.svg?height=200&width=200&text=Related3", id: "img4", createdDate: "2024-01-01" }],
  },
  {
    id: "5",
    name: "Tất chạy bộ cao cổ",
    brand: { name: "KALENJI" },
    minPrice: 99000,
    maxPrice: 99000,
    averageRating: 4.3,
    totalReviews: 567,
    productImages: [{ imageUrl: "/placeholder.svg?height=200&width=200&text=Related4", id: "img5", createdDate: "2024-01-01" }],
  },
];

// Mock reviews
const mockReviews = [
  {
    id: 1,
    user: "Nguyễn Văn A",
    avatar: "/placeholder.svg?height=40&width=40&text=A",
    rating: 5,
    date: "2024-01-15",
    title: "Tuyệt vời cho chạy marathon",
    content: "Đã sử dụng đôi giày này chạy 3 marathon và vẫn rất tốt. Đệm êm, thoáng khí và bền bỉ. Rất đáng tiền!",
    helpful: 24,
    verified: true,
    images: ["/placeholder.svg?height=100&width=100&text=Review1"],
  },
  {
    id: 2,
    user: "Trần Thị B",
    avatar: "/placeholder.svg?height=40&width=40&text=B",
    rating: 4,
    date: "2024-01-10",
    title: "Chất lượng tốt nhưng hơi chật",
    content: "Giày đẹp và chất lượng tốt, tuy nhiên tôi phải lên size so với thông thường. Nên thử trước khi mua.",
    helpful: 18,
    verified: true,
    images: [],
  },
];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const { data: product, isLoading, error } = useFetchProductByIdQuery(id || "");
  const [addCartItem, { isLoading: isAddingCartItem, error: cartError }] = useAddCartItemMutation(); // Add cart mutation
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [newReview, setNewReview] = useState({ rating: 5, title: "", content: "" });

  useEffect(() => {
    if (error) {
      toast.error("Không thể tải thông tin sản phẩm. Vui lòng thử lại.");
    }
  }, [error]);

  useEffect(() => {
    if (cartError) {
      toast.error("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
    }
  }, [cartError]);

  useEffect(() => {
    if (product && !product.isNotHadVariants && product.productVariants.length > 0) {
      // Set the first available color
      const firstColor = [...new Set(product.productVariants.map((v) => v.color.name))][0];
      setSelectedColor(firstColor);
      // Set the first available size for that color
      const firstSize = product.productVariants.find((v) => v.color.name === firstColor)?.size.name || null;
      setSelectedSize(firstSize);
      // Set the corresponding variant
      const variant = product.productVariants.find(
        (v) => v.color.name === firstColor && v.size.name === firstSize
      );
      setSelectedVariant(variant || null);
    } else if (product && product.isNotHadVariants) {
      setSelectedVariant(product.productVariants[0] || null);
    }
  }, [product]);

  useEffect(() => {
    if (selectedColor && selectedSize && product) {
      const variant = product.productVariants.find(
        (v) => v.color.name === selectedColor && v.size.name === selectedSize
      );
      setSelectedVariant(variant || null);
    }
  }, [selectedColor, selectedSize, product]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-300 mt-4">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 mt-8 flex flex-col justify-center items-center h-170 w-full mx-auto">
        <div className="container mx-auto px-4 pt-24 py-8 flex flex-col justify-center items-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-7 text-center">
            Oops - Chúng tôi không thể tìm thấy sản phẩm này :(
          </h2>
          <button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full py-3 px-6 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            onClick={() => navigate("/")}
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const getThumbnailImages = () => {
    return product.productImages.map((img) => img.imageUrl);
  };

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? getThumbnailImages().length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === getThumbnailImages().length - 1 ? 0 : prev + 1));
  };

  const handleQuantityChange = (change: number) => {
    if (selectedVariant) {
      setQuantity((prev) => Math.max(1, Math.min(selectedVariant.stockQuantity, prev + change)));
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
      navigate("/signin");
      return;
    }
    if (!selectedVariant && !product.isNotHadVariants) {
      toast.error("Vui lòng chọn màu sắc và kích thước!");
      return;
    }
    if ((selectedVariant?.stockQuantity || product.stockQuantity) === 0) {
      toast.error("Sản phẩm hiện đã hết hàng!");
      return;
    }

    try {
      const cartItem = {
        productVariantId: selectedVariant?.id || product.productVariants[0]?.id,
        quantity,
      };
      await addCartItem(cartItem).unwrap();
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    } catch (error) {
      toast.error("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để mua hàng!");
      navigate("/signin");
      return;
    }
    if (!selectedVariant && !product.isNotHadVariants) {
      toast.error("Vui lòng chọn màu sắc và kích thước!");
      return;
    }
    if ((selectedVariant?.stockQuantity || product.stockQuantity) === 0) {
      toast.error("Sản phẩm hiện đã hết hàng!");
      return;
    }

    try {
      const cartItem = {
        productVariantId: selectedVariant?.id || product.productVariants[0]?.id,
        quantity,
      };
      await addCartItem(cartItem).unwrap();
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
      navigate("/cart"); // Navigate to Cart page instead of /checkout
    } catch (error) {
      toast.error("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  const handleSubmitReview = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để gửi đánh giá!");
      navigate("/signin");
      return;
    }
    toast.success("Đánh giá đã được gửi!");
    setNewReview({ rating: 5, title: "", content: "" });
  };

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClass = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${sizeClass} ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  const ratingDistribution = [
    { stars: 5, count: 542, percentage: 61 },
    { stars: 4, count: 223, percentage: 25 },
    { stars: 3, count: 89, percentage: 10 },
    { stars: 2, count: 27, percentage: 3 },
    { stars: 1, count: 11, percentage: 1 },
  ];

  // Get unique colors
  const uniqueColors = [...new Set(product.productVariants.map((v) => v.color.name))];

  // Get sizes for the selected color
  const availableSizes = selectedColor
    ? product.productVariants
        .filter((v) => v.color.name === selectedColor)
        .map((v) => v.size.name)
    : [];

  // Check if product or selected variant is out of stock
  const isOutOfStock = product.inStock
    ? (product.isNotHadVariants
        ? product.stockQuantity === 0
        : !selectedVariant || selectedVariant.stockQuantity === 0)
    : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 pt-24 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <button onClick={() => navigate("/")} className="hover:text-blue-600">
              Trang chủ
            </button>
            <span>/</span>
            <button onClick={() => navigate("/products")} className="hover:text-blue-600">
              Sản phẩm
            </button>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">{product.name}</span>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden">
              <motion.img
                key={currentImageIndex}
                src={getThumbnailImages()[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Mới</span>
                )}
                {product.isSale && product.minPrice < product.maxPrice && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                    -{Math.round(((product.maxPrice - product.minPrice) / product.maxPrice) * 100)}%
                  </span>
                )}
                {isOutOfStock && (
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Hết hàng
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {getThumbnailImages().map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleImageChange(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    currentImageIndex === index ? "border-blue-500" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-gray-700 dark:text-gray-300">
                  {product.brand.name}
                </span>
                {product.categories.map((category) => (
                  <span
                    key={category.id}
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(product.averageRating, "lg")}
                  <span className="text-xl font-semibold">{product.averageRating.toFixed(1)}</span>
                </div>
                <span className="text-gray-600 dark:text-gray-300">({product.totalReviews} đánh giá)</span>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-red-600">{formatPrice(selectedVariant?.price || product.minPrice)}</span>
                {product.isSale && product.minPrice < product.maxPrice && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                    Tiết kiệm {Math.round(((product.maxPrice - product.minPrice) / product.maxPrice) * 100)}%
                  </span>
                )}
              </div>
              {isOutOfStock && (
                <div className="bg-red-100 text-red-800 text-sm px-3 py-2 rounded-lg flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Sản phẩm hiện đã hết hàng hoặc đã không còn bán. Vui lòng chọn sản phẩm khác hoặc liên hệ hỗ trợ.
                </div>
              )}
            </div>

            <div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{product.description}</p>
            </div>

            {product.isNotHadVariants ? (
              <div>
                <div className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-sm px-3-zero py-2 rounded-lg inline-flex items-center mb-3">
                  <Check className="h-4 w-4 mr-2" />
                  Sản phẩm đơn lẻ (Không có biến thể)
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-base font-semibold mb-3 block text-gray-900 dark:text-white">
                    Chọn màu sắc
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          // Reset size to the first available size for this color
                          const firstSize = product.productVariants.find(
                            (v) => v.color.name === color
                          )?.size.name || null;
                          setSelectedSize(firstSize);
                        }}
                        className={`py-2 px-4 border rounded-lg transition-all duration-200 text-gray-900 dark:text-white ${
                          selectedColor === color
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedColor && (
                  <div>
                    <label className="text-base font-semibold mb-3 block text-gray-900 dark:text-white">
                      Chọn kích thước
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size) => {
                        const variant = product.productVariants.find(
                          (v) => v.color.name === selectedColor && v.size.name === size
                        );
                        const isAvailable = variant ? variant.stockQuantity > 0 : false;
                        return (
                          <button
                            key={size}
                            onClick={() => isAvailable && setSelectedSize(size)}
                            disabled={!isAvailable}
                            className={`py-2 px-4 border rounded-lg transition-all duration-200 text-gray-900 dark:text-white ${
                              selectedSize === size
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                : isAvailable
                                ? "border-gray-200 hover:border-gray-300"
                                : "border-gray-100 bg-gray-50 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {size}{" "}
                            <span className="text-xs text-gray-500">
                              {isAvailable ? `(${variant?.stockQuantity})` : "(Hết hàng)"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!product.isNotHadVariants && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-base font-semibold text-gray-900 dark:text-white">Hướng dẫn chọn size</label>
                  <button
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Xem bảng size
                  </button>
                </div>
                <AnimatePresence>
                  {showSizeGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Bảng size</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-600">
                              <th className="text-left py-2 text-gray-900 dark:text-white">EU</th>
                              <th className="text-left py-2 text-gray-900 dark:text-white">US</th>
                              <th className="text-left py-2 text-gray-900 dark:text-white">UK</th>
                              <th className="text-left py-2 text-gray-900 dark:text-white">CM</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(sizeGuide).map(([size, measurements]) => (
                              <tr key={size} className="border-b border-gray-200 dark:border-gray-600">
                                <td className="py-2 text-gray-700 dark:text-gray-300">{measurements.eu}</td>
                                <td className="py-2 text-gray-700 dark:text-gray-300">{measurements.us}</td>
                                <td className="py-2 text-gray-700 dark:text-gray-300">{measurements.uk}</td>
                                <td className="py-2 text-gray-700 dark:text-gray-300">{measurements.cm}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div>
              <label className="text-base font-semibold mb-3 block text-gray-900 dark:text-white">Số lượng</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
                    disabled={quantity <= 1 || isOutOfStock}
                  >
                    <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  </button>
                  <span className="px-4 py-2 font-semibold text-gray-900 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
                    disabled={quantity >= (selectedVariant?.stockQuantity || product.stockQuantity) || isOutOfStock}
                  >
                    <Plus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedVariant?.stockQuantity || product.stockQuantity
                    ? `Còn ${selectedVariant?.stockQuantity || product.stockQuantity} sản phẩm`
                    : "Hết hàng"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || (!selectedVariant && !product.isNotHadVariants) || isAddingCartItem}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isAddingCartItem ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Vui lòng đăng nhập để thêm vào danh sách yêu thích!");
                      navigate("/signin");
                      return;
                    }
                    setIsWishlisted(!isWishlisted);
                    toast.success(isWishlisted ? "Đã xóa khỏi danh sách yêu thích!" : "Đã thêm vào danh sách yêu thích!");
                  }}
                  className={`p-3 border border-gray-300 dark:border-gray-600 rounded-lg ${
                    isWishlisted ? "text-red-600 border-red-600" : "text-gray-700 dark:text-gray-300"
                  } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
                </button>
                <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock || (!selectedVariant && !product.isNotHadVariants) || isAddingCartItem}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold transition-colors duration-200"
              >
                {isAddingCartItem ? "Đang xử lý..." : "Mua ngay"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Giao hàng miễn phí</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Bảo hành 12 tháng</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Đổi trả 30 ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="flex border-b border-gray-200 dark:border-gray-600">
            {["description", "specifications", "reviews", "shipping"].map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                  activeTab === tab ? "bg-white dark:bg-gray-800 border-b-2 border-blue-600 text-blue-600" : ""
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "description" && "Mô tả"}
                {tab === "specifications" && "Thông số"}
                {tab === "reviews" && `Đánh giá (${product.totalReviews})`}
                {tab === "shipping" && "Vận chuyển"}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === "description" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Mô tả sản phẩm</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">{product.description}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Tính năng nổi bật</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Công nghệ đệm EVA cao cấp",
                      "Thiết kế hỗ trợ vòm chân",
                      "Chất liệu thoáng khí",
                      "Đế ngoài chống mài mòn",
                      "Trọng lượng nhẹ",
                      "Phù hợp chạy đường dài",
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {activeTab === "specifications" && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Thông số kỹ thuật</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "Thương hiệu", value: product.brand.name },
                    { key: "Danh mục", value: product.categories.map((c) => c.name).join(", ") },
                    { key: "Trọng lượng", value: "280g (size 42)" },
                    { key: "Chất liệu", value: "Mesh thoáng khí + TPU" },
                    { key: "Đế ngoài", value: "Cao su carbon" },
                    { key: "Phù hợp", value: "Chạy đường dài, marathon" },
                  ].map((spec, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                      <span className="font-medium text-gray-600 dark:text-gray-300">{spec.key}:</span>
                      <span className="text-gray-900 dark:text-white">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{product.averageRating.toFixed(1)}</div>
                    {renderStars(product.averageRating, "lg")}
                    <div className="text-gray-600 dark:text-gray-300 mt-2">{product.totalReviews} đánh giá</div>
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    {ratingDistribution.map((item) => (
                      <div key={item.stars} className="flex items-center gap-4">
                        <div className="flex items-center gap-1 w-16">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item.stars}</span>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300 w-12">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <hr className="border-gray-200 dark:border-gray-600" />
                <div className="space-y-6">
                  {mockReviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 dark:border-gray-600 pb-6 last:border-b-0">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300">
                          {review.user[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{review.user}</span>
                            {review.verified && (
                              <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded flex items-center">
                                <Check className="h-3 w-3 mr-1" />
                                Đã mua hàng
                              </span>
                            )}
                            <span className="text-sm text-gray-500 dark:text-gray-400">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(review.rating)}
                            <span className="font-medium text-gray-900 dark:text-white">{review.title}</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-3">{review.content}</p>
                          {review.images.length > 0 && (
                            <div className="flex gap-2 mb-3">
                              {review.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Review ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <button className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-green-600">
                              <ThumbsUp className="h-4 w-4" />
                              Hữu ích ({review.helpful})
                            </button>
                            <button className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-red-600">
                              <ThumbsDown className="h-4 w-4" />
                              Không hữu ích
                            </button>
                            <button className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-blue-600">
                              <MessageCircle className="text-gray-600 dark:text-gray-300 h-4 w-4" />
                              Trả lời
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 bg-white dark:bg-gray-800 shadow-inner rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Viết đánh giá</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block">Đánh giá của bạn</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="p-1"
                          >
                            <Star
                              className={`h-6 w-6 ${star <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="review-title">Tiêu đề</label>
                      <input
                        id="review-title"
                        placeholder="Tóm tắt đánh giá của bạn"
                        value={newReview.title}
                        onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="review-content">Nội dung</label>
                      <textarea
                        id="review-content"
                        placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này"
                        rows={4}
                        value={newReview.content}
                        onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      onClick={handleSubmitReview}
                    >
                      Gửi đánh giá
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "shipping" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Thông tin vận chuyển</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Truck className="h-6 w-6 text-green-500" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Giao hàng miễn phí</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">Đơn hàng từ 500.000₫</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-blue-600" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Bảo hành chính hãng</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">12 tháng từ nhà sản xuất</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <RotateCcw className="h-6 w-6 text-purple-500" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Đổi trả dễ dàng</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">30 ngày đổi trả miễn phí</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Thời gian giao hàng</h4>
                      <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Nội thành Hà Nội, TP.HCM: 1-2 ngày</li>
                        <li>• Các tỉnh thành khác: 2-5 ngày</li>
                        <li>• Vùng sâu, vùng xa: 5-7 ngày</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Sản phẩm gợi ý</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((prod) => (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="h-full group bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  onClick={() => navigate(`/products/${prod.id}`)}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={prod.productImages[0]?.imageUrl}
                      alt={prod.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(prod.minPrice)}</span>
                      {prod.minPrice < prod.maxPrice && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-through">{formatPrice(prod.maxPrice)}</span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 h-12 text-sm">{prod.name}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide">{prod.brand.name}</p>
                    <div className="flex items-center gap-2">
                      {renderStars(prod.averageRating, "sm")}
                      <span className="text-xs text-gray-600 dark:text-gray-300">({prod.totalReviews})</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}