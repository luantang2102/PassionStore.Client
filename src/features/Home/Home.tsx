import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Star, Truck, Shield, Headphones, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import { useFetchProductsQuery, useFetchPopularProductsQuery } from "../../app/api/productApi";
import { useFetchCategoriesTreeQuery } from "../../app/api/categoryApi";
import { setParams } from "../../app/store/productSlice";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

interface Category {
  id: string;
  name: string;
  description: string;
  level: number;
  isActive: boolean;
  imageUrl: string;
  publicId: string;
  totalProducts: number;
  createdDate: string;
  updatedDate?: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  subCategories: Category[];
}

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSelector((state) => state.ui);

  const featuredParams = {
    pageNumber: 1,
    pageSize: 30,
    orderBy: "featured",
  };

  const popularParams = {
    pageNumber: 1,
    pageSize: 30,
    orderBy: "popularity",
  };

  const { data: featuredProductData, isLoading: isFeaturedProductsLoading } = useFetchProductsQuery({
    ...featuredParams,
    orderBy: "featured",
  });
  const { data: popularProductData, isLoading: isPopularProductsLoading } = useFetchPopularProductsQuery(popularParams);
  const { data: categoriesData, isLoading: isCategoriesLoading } = useFetchCategoriesTreeQuery();
  const featuredProducts = featuredProductData?.items || [];
  const popularProducts = popularProductData?.items || [];
  const categories = categoriesData?.filter((cat: Category) => !cat.parentCategoryId) || [];

  // Refs for sliders
  const featuredSliderRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const popularSliderRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [featuredAutoScroll, setFeaturedAutoScroll] = useState<ReturnType<typeof setInterval> | null>(null);
  const [popularAutoScroll, setPopularAutoScroll] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    dispatch(setParams({ pageNumber: 1, pageSize: 6 }));
  }, [dispatch]);

  useEffect(() => {
    // Auto-scroll for featured products
    if (featuredSliderRef.current && featuredProducts.length > 0) {
      const scroll = () => {
        if (featuredSliderRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = featuredSliderRef.current;
          if (scrollLeft + clientWidth >= scrollWidth - 1) {
            featuredSliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            featuredSliderRef.current.scrollBy({ left: 264, behavior: "smooth" });
          }
        }
      };
      const interval = setInterval(scroll, 3000);
      setFeaturedAutoScroll(interval);
      return () => clearInterval(interval);
    }
  }, [featuredProducts]);

  useEffect(() => {
    // Auto-scroll for popular products
    if (popularSliderRef.current && popularProducts.length > 0) {
      const scroll = () => {
        if (popularSliderRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = popularSliderRef.current;
          if (scrollLeft + clientWidth >= scrollWidth - 1) {
            popularSliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            popularSliderRef.current.scrollBy({ left: 264, behavior: "smooth" });
          }
        }
      };
      const interval = setInterval(scroll, 3000);
      setPopularAutoScroll(interval);
      return () => clearInterval(interval);
    }
  }, [popularProducts]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  }, []);

  const handleCategoryClick = useCallback((categoryId: string) => {
    navigate(`/categories/${categoryId}`);
  }, [navigate]);

  const scrollSlider = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = 264;
      ref.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  const pauseAutoScroll = (type: "featured" | "popular") => {
    if (type === "featured" && featuredAutoScroll) {
      clearInterval(featuredAutoScroll);
      setFeaturedAutoScroll(null);
    } else if (type === "popular" && popularAutoScroll) {
      clearInterval(popularAutoScroll);
      setPopularAutoScroll(null);
    }
  };

  const resumeAutoScroll = (type: "featured" | "popular") => {
    if (type === "featured" && !featuredAutoScroll && featuredSliderRef.current && featuredProducts.length > 0) {
      const scroll = () => {
        if (featuredSliderRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = featuredSliderRef.current;
          if (scrollLeft + clientWidth >= scrollWidth - 1) {
            featuredSliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            featuredSliderRef.current.scrollBy({ left: 264, behavior: "smooth" });
          }
        }
      };
      setFeaturedAutoScroll(setInterval(scroll, 3000));
    } else if (type === "popular" && !popularAutoScroll && popularSliderRef.current && popularProducts.length > 0) {
      const scroll = () => {
        if (popularSliderRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = popularSliderRef.current;
          if (scrollLeft + clientWidth >= scrollWidth - 1) {
            popularSliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            popularSliderRef.current.scrollBy({ left: 264, behavior: "smooth" });
          }
        }
      };
      setPopularAutoScroll(setInterval(scroll, 3000));
    }
  };

  return (
    <div className={`${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-slate-50 to-blue-50"}`}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-1 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.h1
                  className="text-4xl lg:text-6xl font-bold text-white leading-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Thể Thao{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Đỉnh Cao
                  </span>
                </motion.h1>
                <motion.p
                  className="text-xl text-blue-50 max-w-lg"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Khám phá bộ sưu tập đồ thể thao cao cấp từ những thương hiệu hàng đầu thế giới. Chất lượng vượt trội,
                  phong cách hiện đại.
                </motion.p>
              </div>
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <button
                  onClick={() => navigate("/products")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full px-8 py-3 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                >
                  Mua Sắm Ngay
                  <ArrowRight className="ml-2 h-5 w-5 inline" />
                </button>
                <motion.select
                  onChange={(e) => handleCategoryClick(e.target.value)}
                  className="px-8 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjYgOSAxMiAxNSAxOCA5Ij48L3BvbHlsaW5lPjwvc3ZnPg==')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px_16px] shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02 }}
                >
                  <option value="">Xem Bộ Sưu Tập</option>
                  {isCategoriesLoading ? (
                    <option disabled>Loading...</option>
                  ) : (
                    categories.map((category: Category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </motion.select>
              </motion.div>
              <motion.div
                className="flex items-center gap-6 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-blue-50">4.9/5 từ 2,500+ đánh giá</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="py-16 lg:py-24 bg-white dark:bg-gray-800 relative"
        style={{
          backgroundImage:`linear-gradient(rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.91)), url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tại Sao Chọn Chúng Tôi?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-gray-600 dark:text-gray-100 max-w-2xl mx-auto">
              Cam kết mang đến trải nghiệm mua sắm tuyệt vời nhất cho khách hàng
            </motion.p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: Truck, title: "Giao Hàng Nhanh", description: "Miễn phí giao hàng cho đơn từ 500k" },
              { icon: Shield, title: "Bảo Hành Chính Hãng", description: "Cam kết 100% hàng chính hãng" },
              { icon: Headphones, title: "Hỗ Trợ 24/7", description: "Đội ngũ tư vấn chuyên nghiệp" },
              { icon: ArrowRight, title: "Đổi Trả Dễ Dàng", description: "30 ngày đổi trả miễn phí" },
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <div className="h-full bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-8 text-center backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-100">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Product Categories */}
      <section
        className="py-16 lg:py-24 bg-white dark:bg-gray-800 relative"
        style={{
          backgroundImage: `linear-gradient(rgba(208, 204, 204, 0.81), rgba(248, 248, 248, 0.9)), url('https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4">
          {/* Featured Products */}
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-between mb-8"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Sản Phẩm Nổi Bật</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => scrollSlider(featuredSliderRef, "left")}
                  onMouseEnter={() => pauseAutoScroll("featured")}
                  onMouseLeave={() => resumeAutoScroll("featured")}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => scrollSlider(featuredSliderRef, "right")}
                  onMouseEnter={() => pauseAutoScroll("featured")}
                  onMouseLeave={() => resumeAutoScroll("featured")}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => navigate("/products")}
                  className="px-4 py-2 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  Xem tất cả
                  <ArrowRight className="ml-2 h-4 w-4 inline" />
                </button>
              </div>
            </motion.div>
            <div className="relative">
              <div
                ref={featuredSliderRef}
                className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollBehavior: "smooth" }}
              >
                {isFeaturedProductsLoading ? (
                  <p className="text-gray-600 dark:text-gray-100">Loading...</p>
                ) : (
                  featuredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: Number(product.id) * 0.1 }}
                      className="flex-shrink-0 w-64 snap-start"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <div className="h-full bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm">
                        <div className="relative">
                          <img
                            src={product.productImages[0]?.imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                          {product.isFeatured && (
                            <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-semibold">
                              Nổi Bật
                            </div>
                          )}
                          {product.isSale && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                              Giảm Giá
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatPrice(product.minPrice)}
                              </span>
                              {product.minPrice < product.maxPrice && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                  {formatPrice(product.maxPrice)}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 h-10">{product.name}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-100 uppercase tracking-wide">{product.brand.name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-100">{product.averageRating}</span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{product.totalReviews} Đánh Giá</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Popular Products */}
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-between mb-8"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Sản Phẩm Phổ Biến</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => scrollSlider(popularSliderRef, "left")}
                  onMouseEnter={() => pauseAutoScroll("popular")}
                  onMouseLeave={() => resumeAutoScroll("popular")}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => scrollSlider(popularSliderRef, "right")}
                  onMouseEnter={() => pauseAutoScroll("popular")}
                  onMouseLeave={() => resumeAutoScroll("popular")}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => navigate("/products")}
                  className="px-4 py-2 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  Xem tất cả
                  <ArrowRight className="ml-2 h-4 w-4 inline" />
                </button>
              </div>
            </motion.div>
            <div className="relative">
              <div
                ref={popularSliderRef}
                className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollBehavior: "smooth" }}
              >
                {isPopularProductsLoading ? (
                  <p className="text-gray-600 dark:text-gray-100">Loading...</p>
                ) : (
                  popularProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: Number(product.id) * 0.1 }}
                      className="flex-shrink-0 w-64 snap-start"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <div className="h-full bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm">
                        <div className="relative">
                          <img
                            src={product.productImages[0]?.imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                          {product.isFeatured && (
                            <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-semibold">
                              Nổi Bật
                            </div>
                          )}
                          {product.isSale && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                              Giảm Giá
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatPrice(product.minPrice)}
                              </span>
                              {product.minPrice < product.maxPrice && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                  {formatPrice(product.maxPrice)}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 h-10">{product.name}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-100 uppercase tracking-wide">{product.brand.name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-100">{product.averageRating}</span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{product.totalReviews} Đánh Giá</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Popular Sports Categories */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-between mb-8"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Bộ Sưu Tập Sản Phẩm</h2>
              <button
                onClick={() => navigate("/categories")}
                className="px-4 py-2 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Xem tất cả
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </button>
            </motion.div>
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {isCategoriesLoading ? (
                  <p className="text-gray-600 dark:text-gray-100">Loading...</p>
                ) : (
                  categories.map((category: Category) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: Number(category.id) * 0.1 }}
                      className="cursor-pointer"
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <div className="relative bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden backdrop-blur-sm">
                        <div className="relative group">
                          <img
                            src={category.imageUrl || `https://via.placeholder.com/300x200?text=${encodeURIComponent(category.name)}`}
                            alt={category.name}
                            className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <p className="text-sm">{category.totalProducts} sản phẩm</p>
                          </div>
                        </div>
                        <div className="p-4 text-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-700 dark:to-gray-800">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{category.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-100">{category.totalProducts} sản phẩm</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-16 lg:py-24 bg-gradient-to-r from-blue-600 to-purple-600 relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://res.cloudinary.com/drlx1uok3/image/upload/v1752724387/photo-1517838277536-f5f99be501cd_stcrwl.avif?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Sẵn Sàng Bắt Đầu Hành Trình Thể Thao?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Đăng ký ngay để nhận ưu đãi đặc biệt và cập nhật sản phẩm mới nhất
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signin">
                <button
                  className="bg-white text-blue-600 rounded-full px-8 py-3 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                >
                  Đăng Ký Ngay
                  <ArrowRight className="ml-2 h-5 w-5 inline" />
                </button>
              </Link>
              <button
                className="px-8 py-3 rounded-full border-2 border-white text-white hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Tìm Hiểu Thêm
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;