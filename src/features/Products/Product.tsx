/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Heart,
  ShoppingCart,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "react-toastify";
import { RootState, useAppDispatch, useAppSelector } from "../../app/store/store";
import { useFetchProductsQuery } from "../../app/api/productApi";
import { useAddCartItemMutation } from "../../app/api/cartApi";
import { ProductParams } from "../../app/models/params/productParams";
import { Product } from "../../app/models/responses/product";
import { resetParams, setPageNumber, setParams } from "../../app/store/productSlice";
import { useFetchCategoriesTreeQuery } from "../../app/api/categoryApi";
import { useFetchColorsQuery } from "../../app/api/colorApi";
import { useFetchSizesQuery } from "../../app/api/sizeApi";
import { useFetchBrandsQuery } from "../../app/api/brandApi";
import { Category } from "../../app/models/responses/category";
import { useNavigate } from "react-router-dom";

// Custom debounce hook
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const Products = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { params } = useAppSelector((state: RootState) => state.product);
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);
  const { darkMode } = useAppSelector((state: RootState) => state.ui);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{
    id: string;
    color: { id: string; name: string };
    size: { id: string; name: string };
    price: number;
    stockQuantity: number;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Filter visibility states
  const [visibleCategories, setVisibleCategories] = useState<string[]>([]);
  const [visibleColors, setVisibleColors] = useState(6);
  const [visibleSizes, setVisibleSizes] = useState(6);
  const [visibleBrands, setVisibleBrands] = useState(6);

  // Search states for filters
  const [searchTerm, setSearchTerm] = useState(params.searchTerm || "");
  const [categorySearch, setCategorySearch] = useState("");
  const [colorSearch, setColorSearch] = useState("");
  const [sizeSearch, setSizeSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");

  // Toggle states for search inputs
  const [showCategorySearch, setShowCategorySearch] = useState(false);
  const [showColorSearch, setShowColorSearch] = useState(false);
  const [showSizeSearch, setShowSizeSearch] = useState(false);
  const [showBrandSearch, setShowBrandSearch] = useState(false);

  // Refs for focusing inputs
  const categorySearchRef = useRef<HTMLInputElement>(null);
  const colorSearchRef = useRef<HTMLInputElement>(null);
  const sizeSearchRef = useRef<HTMLInputElement>(null);
  const brandSearchRef = useRef<HTMLInputElement>(null);

  // Debounced search terms (1-second delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);
  const debouncedColorSearch = useDebounce(colorSearch, 1000);
  const debouncedSizeSearch = useDebounce(sizeSearch, 1000);
  const debouncedBrandSearch = useDebounce(brandSearch, 1000);

  // Fetch products and cart API
  const { data, isLoading, error } = useFetchProductsQuery(params);
  const [addCartItem, { isLoading: isAddingCartItem }] = useAddCartItemMutation();
  const products = data?.items || [];
  const pagination = data?.pagination || { currentPage: 1, pageSize: 10, totalPages: 1, totalCount: 0 };

  // Fetch filter data
  const { data: categoriesData } = useFetchCategoriesTreeQuery();
  const categories = categoriesData || [];

  const { data: colorsData } = useFetchColorsQuery({ searchTerm: debouncedColorSearch, pageNumber: 1, pageSize: 36 });
  const colors = colorsData?.items || [];

  const { data: sizesData } = useFetchSizesQuery({ searchTerm: debouncedSizeSearch, pageNumber: 1, pageSize: 36 });
  const sizes = sizesData?.items || [];

  const { data: brandsData } = useFetchBrandsQuery({ searchTerm: debouncedBrandSearch, pageNumber: 1, pageSize: 36 });
  const brands = brandsData?.items || [];

  // Handle API errors
  useEffect(() => {
    if (error) {
      toast.error("Không thể tải sản phẩm. Vui lòng thử lại.");
    }
  }, [error]);

  // Sync debounced product search term with params
  useEffect(() => {
    dispatch(setParams({ searchTerm: debouncedSearchTerm || undefined }));
  }, [debouncedSearchTerm, dispatch]);

  // Focus input when search bar is toggled visible
  useEffect(() => {
    if (showCategorySearch && categorySearchRef.current) {
      categorySearchRef.current.focus();
    }
  }, [showCategorySearch]);

  useEffect(() => {
    if (showColorSearch && colorSearchRef.current) {
      colorSearchRef.current.focus();
    }
  }, [showColorSearch]);

  useEffect(() => {
    if (showSizeSearch && sizeSearchRef.current) {
      sizeSearchRef.current.focus();
    }
  }, [showSizeSearch]);

  useEffect(() => {
    if (showBrandSearch && brandSearchRef.current) {
      brandSearchRef.current.focus();
    }
  }, [showBrandSearch]);

  // Reset variant and quantity when opening modal
  useEffect(() => {
    if (modalProduct && modalProduct.productVariants && modalProduct.productVariants.length > 0) {
      setSelectedVariant(modalProduct.productVariants[0]);
      setQuantity(1);
    }
  }, [modalProduct]);

  // Handle product params
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const currentCategories = params.categories ? params.categories.split(",") : [];
    const newCategories = checked
      ? [...currentCategories, categoryId]
      : currentCategories.filter((c) => c !== categoryId);
    dispatch(setParams({ categories: newCategories.length > 0 ? newCategories.join(",") : undefined }));
  };

  const handleColorChange = (colorId: string, checked: boolean) => {
    const currentColors = params.colors ? params.colors.split(",") : [];
    const newColors = checked
      ? [...currentColors, colorId]
      : currentColors.filter((c) => c !== colorId);
    dispatch(setParams({ colors: newColors.length > 0 ? newColors.join(",") : undefined }));
  };

  const handleSizeChange = (sizeId: string, checked: boolean) => {
    const currentSizes = params.sizes ? params.sizes.split(",") : [];
    const newSizes = checked
      ? [...currentSizes, sizeId]
      : currentSizes.filter((s) => s !== sizeId);
    dispatch(setParams({ sizes: newSizes.length > 0 ? newSizes.join(",") : undefined }));
  };

  const handleBrandChange = (brandId: string, checked: boolean) => {
    const currentBrands = params.brands ? params.brands.split(",") : [];
    const newBrands = checked
      ? [...currentBrands, brandId]
      : currentBrands.filter((b) => b !== brandId);
    dispatch(setParams({ brands: newBrands.length > 0 ? newBrands.join(",") : undefined }));
  };

  const handlePriceRangeChange = (minPrice: number, maxPrice: number) => {
    dispatch(setParams({ minPrice: minPrice || undefined, maxPrice: maxPrice || undefined }));
  };

  const handleQuickFilterChange = (key: keyof ProductParams, value: boolean) => {
    dispatch(setParams({ [key]: value }));
  };

  const handleSortChange = (orderBy: string) => {
    dispatch(setParams({ orderBy: orderBy }));
  };

  const handlePageChange = (page: number) => {
    dispatch(setPageNumber(page));
  };

  const clearAllFilters = () => {
    dispatch(resetParams());
    setSearchTerm("");
    setCategorySearch("");
    setColorSearch("");
    setSizeSearch("");
    setBrandSearch("");
    setShowCategorySearch(false);
    setShowColorSearch(false);
    setShowSizeSearch(false);
    setShowBrandSearch(false);
    setVisibleCategories([]);
    setVisibleColors(6);
    setVisibleSizes(6);
    setVisibleBrands(6);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const getMainImage = (product: Product) => {
    return product.productImages[0]?.imageUrl || "/placeholder.svg?height=300&width=300";
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setVisibleCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
      navigate("/signin");
      return;
    }
    if (!selectedVariant) {
      toast.error("Vui lòng chọn biến thể sản phẩm!");
      return;
    }
    if (quantity <= 0 || quantity > selectedVariant.stockQuantity) {
      toast.error(`Số lượng phải từ 1 đến ${selectedVariant.stockQuantity}!`);
      return;
    }
    try {
      await addCartItem({ productVariantId: selectedVariant.id, quantity }).unwrap();
      toast.success("Đã thêm vào giỏ hàng!");
      setModalProduct(null);
      setSelectedVariant(null);
      setQuantity(1);
    } catch (err) {
      toast.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  // Flatten category tree for chip rendering
  const flattenCategories = (categories: Category[]): Category[] => {
    return categories.reduce((acc: Category[], category: Category) => {
      const subCategories = category.subCategories ? flattenCategories(category.subCategories) : [];
      return [...acc, category, ...subCategories];
    }, []);
  };

  const allCategories = flattenCategories(categories);

  // Render category tree
  const renderCategoryTree = (categories: Category[], level: number = 0) => {
    return categories.map((category) => (
      <div key={category.id} style={{ marginLeft: `${level * 16}px` }}>
        <div className="flex items-center space-x-2">
          {category.subCategories && category.subCategories.length > 0 && (
            <button onClick={() => toggleCategory(category.id)}>
              {visibleCategories.includes(category.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          <input
            type="checkbox"
            id={`category-${category.id}`}
            checked={params.categories?.split(",").includes(category.id) || false}
            onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor={`category-${category.id}`} className="text-sm text-gray-700 dark:text-gray-300">
            {category.name}
          </label>
        </div>
        {category.subCategories && visibleCategories.includes(category.id) && (
          <div className="ml-4">{renderCategoryTree(category.subCategories, level + 1)}</div>
        )}
      </div>
    ));
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Quick Filters */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Bộ lọc nhanh</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={!!params.isFeatured}
              onChange={(e) => handleQuickFilterChange("isFeatured", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isFeatured" className="text-sm text-gray-700 dark:text-gray-300">Sản phẩm nổi bật</label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isSale"
              checked={!!params.isSale}
              onChange={(e) => handleQuickFilterChange("isSale", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isSale" className="text-sm text-gray-700 dark:text-gray-300">Đang khuyến mãi</label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isNew"
              checked={!!params.isNew}
              onChange={(e) => handleQuickFilterChange("isNew", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isNew" className="text-sm text-gray-700 dark:text-gray-300">Sản phẩm mới</label>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Khoảng giá</h3>
        <div className="px-2">
          <input
            type="range"
            min={0}
            max={6000000}
            step={50000}
            value={params.minPrice ?? 0}
            onChange={(e) => handlePriceRangeChange(+e.target.value, params.maxPrice ?? 6000000)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="range"
            min={0}
            max={6000000}
            step={50000}
            value={params.maxPrice ?? 6000000}
            onChange={(e) => handlePriceRangeChange(params.minPrice ?? 0, +e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
          />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mt-2">
            <span>{formatPrice(params.minPrice ?? 0)}</span>
            <span>{formatPrice(params.maxPrice ?? 6000000)}</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Danh mục</h3>
          <button
            onClick={() => setShowCategorySearch(!showCategorySearch)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <AnimatePresence>
          {showCategorySearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative overflow-hidden"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={categorySearchRef}
                placeholder="Tìm kiếm danh mục..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:border-blue-500 focus:outline-none text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {renderCategoryTree(categories)}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Màu sắc</h3>
          <button
            onClick={() => setShowColorSearch(!showColorSearch)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <AnimatePresence>
          {showColorSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative overflow-hidden"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={colorSearchRef}
                placeholder="Tìm kiếm màu sắc..."
                value={colorSearch}
                onChange={(e) => setColorSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:border-blue-500 focus:outline-none text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-3 max-h-40 overflow-y-auto">
          {colors.slice(0, visibleColors).map((color) => (
            <div key={color.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`color-${color.id}`}
                checked={params.colors?.split(",").includes(color.id) || false}
                onChange={(e) => handleColorChange(color.id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`color-${color.id}`} className="text-sm text-gray-700 dark:text-gray-300">{color.name}</label>
            </div>
          ))}
        </div>
        {colors.length > visibleColors && (
          <button
            onClick={() => setVisibleColors((prev) => prev + 30)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Xem thêm
          </button>
        )}
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Kích thước</h3>
          <button
            onClick={() => setShowSizeSearch(!showSizeSearch)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <AnimatePresence>
          {showSizeSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative overflow-hidden"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={sizeSearchRef}
                placeholder="Tìm kiếm kích thước..."
                value={sizeSearch}
                onChange={(e) => setSizeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:border-blue-500 focus:outline-none text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-3 max-h-40 overflow-y-auto">
          {sizes.slice(0, visibleSizes).map((size) => (
            <div key={size.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`size-${size.id}`}
                checked={params.sizes?.split(",").includes(size.id) || false}
                onChange={(e) => handleSizeChange(size.id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`size-${size.id}`} className="text-sm text-gray-700 dark:text-gray-300">{size.name}</label>
            </div>
          ))}
        </div>
        {sizes.length > visibleSizes && (
          <button
            onClick={() => setVisibleSizes((prev) => prev + 30)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Xem thêm
          </button>
        )}
      </div>

      {/* Brands */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Thương hiệu</h3>
          <button
            onClick={() => setShowBrandSearch(!showBrandSearch)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <AnimatePresence>
          {showBrandSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative overflow-hidden"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={brandSearchRef}
                placeholder="Tìm kiếm thương hiệu..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:border-blue-500 focus:outline-none text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-3 max-h-40 overflow-y-auto">
          {brands.slice(0, visibleBrands).map((brand) => (
            <div key={brand.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`brand-${brand.id}`}
                checked={params.brands?.split(",").includes(brand.id) || false}
                onChange={(e) => handleBrandChange(brand.id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`brand-${brand.id}`} className="text-sm text-gray-700 dark:text-gray-300">{brand.name}</label>
            </div>
          ))}
        </div>
        {brands.length > visibleBrands && (
          <button
            onClick={() => setVisibleBrands((prev) => prev + 30)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Xem thêm
          </button>
        )}
      </div>

      <button
        onClick={clearAllFilters}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        Xóa tất cả bộ lọc
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          >
            Sản Phẩm Thể Thao
          </motion.h1>
          <p className="text-gray-600 dark:text-gray-300">
            Khám phá bộ sưu tập đồ thể thao cao cấp từ các thương hiệu hàng đầu
          </p>
        </div>
        <div className="flex gap-8">
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bộ lọc</h2>
                <SlidersHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-300" />
              </div>
              <FilterContent />
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-md border border-gray-200 focus:border-blue-500 focus:outline-none text-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative lg:hidden">
                    <button
                      onClick={() => setIsFilterOpen(true)}
                      aria-label="Open filters"
                      className="flex items-center border border-gray-300 rounded-md px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Bộ lọc
                    </button>
                    {isFilterOpen && (
                      <div className="fixed inset-0 z-50 flex">
                        <div
                          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                          onClick={() => setIsFilterOpen(false)}
                        ></div>
                        <div className="relative w-80 bg-white dark:bg-gray-800 shadow-lg p-6 overflow-y-auto max-h-screen">
                          <button
                            onClick={() => setIsFilterOpen(false)}
                            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Bộ lọc sản phẩm</h2>
                          <FilterContent />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Hiển thị {products.length} trong {pagination.totalCount} sản phẩm
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={params.orderBy || "popularity"}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-48 rounded-md border border-gray-200 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="popularity">Phổ biến nhất</option>
                    <option value="createdDate_desc">Mới nhất</option>
                    <option value="price_asc">Giá thấp đến cao</option>
                    <option value="price_desc">Giá cao đến thấp</option>
                    <option value="averageRating_desc">Đánh giá cao nhất</option>
                    <option value="name_asc">Tên A-Z</option>
                    <option value="name_desc">Tên Z-A</option>
                  </select>
                  <div className="flex border rounded-lg">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300"} rounded-l-lg`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300"} rounded-r-lg`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              {(params.searchTerm ||
                params.categories ||
                params.colors ||
                params.sizes ||
                params.brands ||
                params.isFeatured ||
                params.isSale ||
                params.isNew ||
                params.minPrice ||
                params.maxPrice) && (
                <div className="flex flex-wrap gap-2">
                  {params.searchTerm && (
                    <span className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Tìm kiếm: "{params.searchTerm}"
                      <X className="h-3 w-3 cursor-pointer" onClick={() => { setSearchTerm(""); handleSearchChange(""); }} />
                    </span>
                  )}
                  {params.categories?.split(",").map((categoryId) => {
                    const category = allCategories.find((c) => c.id === categoryId);
                    return category ? (
                      <span
                        key={categoryId}
                        className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {category.name}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleCategoryChange(categoryId, false)} />
                      </span>
                    ) : null;
                  })}
                  {params.colors?.split(",").map((colorId) => {
                    const color = colors.find((c) => c.id === colorId);
                    return color ? (
                      <span
                        key={colorId}
                        className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {color.name}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleColorChange(colorId, false)} />
                      </span>
                    ) : null;
                  })}
                  {params.sizes?.split(",").map((sizeId) => {
                    const size = sizes.find((s) => s.id === sizeId);
                    return size ? (
                      <span
                        key={sizeId}
                        className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {size.name}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleSizeChange(sizeId, false)} />
                      </span>
                    ) : null;
                  })}
                  {params.brands?.split(",").map((brandId) => {
                    const brand = brands.find((b) => b.id === brandId);
                    return brand ? (
                      <span
                        key={brandId}
                        className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {brand.name}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleBrandChange(brandId, false)} />
                      </span>
                    ) : null;
                  })}
                  {params.isFeatured && (
                    <span className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Nổi bật
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleQuickFilterChange("isFeatured", false)} />
                    </span>
                  )}
                  {params.isSale && (
                    <span className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Khuyến mãi
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleQuickFilterChange("isSale", false)} />
                    </span>
                  )}
                  {params.isNew && (
                    <span className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Mới
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleQuickFilterChange("isNew", false)} />
                    </span>
                  )}
                  {(params.minPrice || params.maxPrice) && (
                    <span className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Giá: {formatPrice(params.minPrice ?? 0)} - {formatPrice(params.maxPrice ?? 6000000)}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handlePriceRangeChange(0, 6000000)} />
                    </span>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}
            </div>
            <AnimatePresence>
              {isLoading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-300 mt-4">Đang tải sản phẩm...</p>
                </motion.div>
              ) : products.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Không tìm thấy sản phẩm</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                  <button
                    onClick={clearAllFilters}
                    className="bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      : "space-y-4"
                  }
                >
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      {viewMode === "grid" ? (
                        <div
                          className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <div className="relative overflow-hidden">
                            <img
                              src={getMainImage(product)}
                              alt={product.name}
                              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {product.isNew && (
                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Mới</span>
                              )}
                              {product.isSale && (
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Sale</span>
                              )}
                              {!product.inStock && (
                                <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">Hết hàng</span>
                              )}
                            </div>
                            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.info("Đã thêm vào danh sách yêu thích!");
                                }}
                                className="h-8 w-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <Heart className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!product.inStock) {
                                    toast.error("Sản phẩm hiện đã hết hàng!");
                                    return;
                                  }
                                  setModalProduct(product);
                                }}
                                className="h-8 w-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <ShoppingCart className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                              </button>
                            </div>
                          </div>
                          <div className="p-4 space-y-2">
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
                            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 h-12 text-sm">{product.name}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide">{product.brand.name}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-300">{product.averageRating.toFixed(1)}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">({product.totalReviews})</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg hover:shadow-md transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <div className="p-4 flex gap-4">
                            <div className="relative w-32 h-32 flex-shrink-0">
                              <img
                                src={getMainImage(product)}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              {product.isNew && (
                                <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">Mới</span>
                              )}
                              {product.isSale && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded">Sale</span>
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">{product.name}</h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wide">{product.brand.name}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(product.minPrice)}</span>
                                  {product.minPrice < product.maxPrice && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400 block line-through">
                                      {formatPrice(product.maxPrice)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">{product.averageRating.toFixed(1)}</span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">({product.totalReviews} đánh giá)</span>
                                </div>
                                {!product.inStock && (
                                  <span className="text-sm bg-gray-500 text-white rounded px-2 py-1">Hết hàng</span>
                                )}
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast.info("Đã thêm vào danh sách yêu thích!");
                                    }}
                                    className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                                  >
                                    <Heart className="h-4 w-4 mr-1" />
                                    Yêu thích
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!product.inStock) {
                                        toast.error("Sản phẩm hiện đã hết hàng!");
                                        return;
                                      }
                                      setModalProduct(product);
                                    }}
                                    disabled={!product.inStock}
                                    className={`rounded-md px-4 py-2 text-white ${
                                      product.inStock ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                                    } flex items-center`}
                                  >
                                    <ShoppingCart className="h-4 w-4 mr-1" />
                                    {product.inStock ? "Thêm vào giỏ" : "Hết hàng"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, pagination.currentPage - 1))}
                    disabled={pagination.currentPage === 1}
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-md ${
                        pagination.currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mini Product Detail Modal */}
      <AnimatePresence>
        {modalProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setModalProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chọn biến thể sản phẩm</h2>
                <button
                  onClick={() => setModalProduct(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-4">
                <img
                  src={getMainImage(modalProduct)}
                  alt={modalProduct.name}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1 space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">{modalProduct.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wide">{modalProduct.brand.name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{modalProduct.averageRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({modalProduct.totalReviews} đánh giá)</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(selectedVariant?.price || modalProduct.minPrice)}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Màu sắc</label>
                  <select
                    value={selectedVariant?.color.id || ""}
                    onChange={(e) => {
                      const variant = modalProduct.productVariants.find((v) => v.color.id === e.target.value);
                      setSelectedVariant(variant || modalProduct.productVariants[0]);
                      setQuantity(1);
                    }}
                    className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    {Array.from(new Set(modalProduct.productVariants.map((v) => v.color.id))).map((colorId) => {
                      const color = modalProduct.productVariants.find((v) => v.color.id === colorId)?.color;
                      return (
                        <option key={colorId} value={colorId}>
                          {color?.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kích thước</label>
                  <select
                    value={selectedVariant?.size.id || ""}
                    onChange={(e) => {
                      const variant = modalProduct.productVariants.find((v) => v.size.id === e.target.value && v.color.id === selectedVariant?.color.id);
                      setSelectedVariant(variant || modalProduct.productVariants[0]);
                      setQuantity(1);
                    }}
                    className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    {Array.from(new Set(modalProduct.productVariants.filter((v) => v.color.id === selectedVariant?.color.id).map((v) => v.size.id))).map(
                      (sizeId) => {
                        const size = modalProduct.productVariants.find((v) => v.size.id === sizeId)?.size;
                        return (
                          <option key={sizeId} value={sizeId}>
                            {size?.name}
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng</label>
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      disabled={quantity <= 1 || isAddingCartItem}
                    >
                      <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(selectedVariant?.stockQuantity || 1, +e.target.value)))}
                      className="w-16 text-center border-none focus:outline-none dark:bg-gray-800 dark:text-white"
                      disabled={isAddingCartItem}
                    />
                    <button
                      onClick={() => setQuantity((prev) => Math.min(selectedVariant?.stockQuantity || 1, prev + 1))}
                      className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      disabled={quantity >= (selectedVariant?.stockQuantity || 1) || isAddingCartItem}
                    >
                      <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Còn lại: {selectedVariant?.stockQuantity || 0} sản phẩm
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setModalProduct(null)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 rounded-md py-2 text-white ${
                    isAddingCartItem || !selectedVariant ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  disabled={isAddingCartItem || !selectedVariant}
                >
                  Thêm vào giỏ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;