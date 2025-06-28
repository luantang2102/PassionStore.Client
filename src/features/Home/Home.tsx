import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Star, Truck, Shield, Headphones } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import { useFetchProductsQuery } from "../../app/api/productApi";
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

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSelector((state) => state.ui);
  const { params } = useAppSelector((state) => state.product);
  const { data: productData, isLoading: isProductsLoading } = useFetchProductsQuery(params);
  const products = productData?.items || [];

  useEffect(() => {
    dispatch(setParams({ pageNumber: 1, pageSize: 6 }));
  }, [dispatch]);

  return (
    <div className={`${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-slate-50 to-blue-50"}`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.h1
                  className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight"
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
                  className="text-xl text-gray-600 max-w-lg"
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
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full px-8 py-3 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                >
                  Mua Sắm Ngay
                  <ArrowRight className="ml-2 h-5 w-5 inline" />
                </button>
                <button
                  className="px-8 py-3 rounded-full border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300"
                >
                  Xem Bộ Sưu Tập
                </button>
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
                <span className="text-gray-600">4.9/5 từ 2,500+ đánh giá</span>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative z-10">
                <img
                  src="https://media.istockphoto.com/id/615919228/photo/girl-prepairing-for-workout.jpg?s=612x612&w=0&k=20&c=WX-gV6EACTUjD9ePIgQdYwyOyF2W02Khua9vgy6xiRA="
                  alt="Sản phẩm thể thao"
                  className="rounded-2xl shadow-2xl w-full max-w-[500px]"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Tại Sao Chọn Chúng Tôi?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-gray-600 max-w-2xl mx-auto">
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
                <div className="h-full bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          {/* All Products */}
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-between mb-8"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Sản Phẩm Nổi Bật</h2>
              <button
                className="px-4 py-2 rounded-full border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300"
                onClick={() => dispatch(setParams({ pageNumber: 1, pageSize: 6 }))}
              >
                Xem tất cả
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </button>
            </motion.div>
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {isProductsLoading ? (
                  <p>Loading...</p>
                ) : (
                  products.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: Number(product.id) * 0.1 }}
                      className="flex-shrink-0 w-64"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <div className="h-full bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div className="relative">
                          <img
                            src={product.productImages[0].imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                          {(
                            <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-semibold">
                              badge
                            </div>
                          )}
                          {(
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                              discount
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gray-900">{product.minPrice}₫ - {product.maxPrice}₫</span>
                              {(
                                <span className="text-sm text-gray-500 line-through">{product.minPrice}₫ - {product.maxPrice}₫</span>
                              )}
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 h-10">{product.name}</h3>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">{product.brand.name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-600">{product.averageRating}</span>
                              </div>
                              <span className="text-xs text-gray-500">Review</span>
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
              className="mb-8"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Môn Thể Thao Phổ Biến</h2>
            </motion.div>
            {/* <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {categories.map((category) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: category.id * 0.1 }}
                    className="flex-shrink-0 w-48"
                  >
                    <div className="h-full bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                      <div className="relative">
                        <img
                          src={category.image || "/placeholder.svg"}
                          alt={category.name}
                          className="w-full h-32 object-cover rounded-t-lg"
                        />
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.productCount} sản phẩm</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-blue-600 to-purple-600">
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