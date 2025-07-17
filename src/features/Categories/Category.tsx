/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "../../app/store/store";
import { useFetchCategoriesQuery, useFetchCategoryByIdQuery } from "../../app/api/categoryApi";
import { setParams } from "../../app/store/productSlice";


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

const CategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: categoriesData, isLoading: isCategoriesLoading } = useFetchCategoriesQuery({
    parentCategoryId: categoryId || undefined,
    isActive: true,
    pageNumber: 1,
    pageSize: 20,
  });

  const {data: currentCategory } = useFetchCategoryByIdQuery(categoryId || "", {
    skip: !categoryId,
  });

  const categories = categoriesData?.items || [];

  useEffect(() => {
    // If categoryId is provided and no subcategories are found, redirect to products page
    if (categoryId && categories.length === 0 && !isCategoriesLoading) {
      dispatch(setParams({ categories: categoryId, pageNumber: 1, pageSize: 20 }));
      navigate("/products");
    }
  }, [categoryId, categories, isCategoriesLoading, dispatch, navigate]);

  const handleCategoryClick = useCallback((category: Category) => {
    if (category.subCategories.length > 0) {
      // Category has children, navigate to its category page
      navigate(`/categories/${category.id}`);
    } else {
      // Leaf node, redirect to products page with category filter
      dispatch(setParams({ categories: category.id, pageNumber: 1, pageSize: 20 }));
      navigate("/products");
    }
  }, [dispatch, navigate]);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 min-h-screen">
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-between mb-8"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {categoryId ? currentCategory?.name : "Bộ Sưu Tập Sản Phẩm"}
            </h2>
            <button
              onClick={() => navigate("/products")}
              className="px-4 py-2 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
            >
              Xem Tất Cả Sản Phẩm
              <ArrowRight className="ml-2 h-4 w-4 inline" />
            </button>
          </motion.div>
          <div className="relative">
            {isCategoriesLoading ? (
              <p className="text-gray-600 dark:text-gray-300">Loading...</p>
            ) : categories.length === 0 && categoryId ? (
              <p className="text-gray-600 dark:text-gray-300">Đang chuyển hướng...</p>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {categories.map((category: Category) => (
                  <div
                    key={category.id}
                    className="cursor-pointer"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
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
                        <p className="text-sm text-gray-600 dark:text-gray-300">{category.totalProducts} sản phẩm</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;