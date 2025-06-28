import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, User, Search, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { useLogoutMutation, useCheckAuthQuery } from "../../api/authApi";
import { useGetCartQuery } from "../../api/cartApi";
import { clearAuth } from "../../store/authSlice";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);
  const { darkMode } = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();
  const { isLoading: authLoading } = useCheckAuthQuery(undefined, { skip: !isAuthenticated });
  const { data: cartData } = useGetCartQuery(
    { skipRedirectOn401: true },
    { skip: !isAuthenticated }
  );
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(clearAuth());
      window.location.reload();
      setIsDropdownOpen(false);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    { name: "Trang Chủ", href: "/" },
    { name: "Sản Phẩm", href: "/products" },
    { name: "Giỏ Hàng", href: "/cart" },
    { name: "Thương Hiệu", href: "/brands" },
    { name: "Khuyến Mãi", href: "/promotions" },
    { name: "Liên Hệ", href: "/contact" },
  ];

  // Determine cart count: use cartData for authenticated users, 0 for guests
  const cartItemCount = isAuthenticated && cartData ? cartData.cartItems?.length || 0 : 0;

  // Show loading state if auth is being checked
  if (loading || authLoading) {
    return <div className="h-16"></div>;
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? darkMode
            ? "bg-gray-800/95 backdrop-blur-md shadow-lg"
            : "bg-white/95 backdrop-blur-md shadow-lg"
          : darkMode
          ? "bg-transparent dark:bg-gray-900/50"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 mr-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Passion
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-medium transition-colors duration-200 relative group ${
                  darkMode ? "text-gray-300 hover:text-blue-400" : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {item.name}
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full`}
                ></span>
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                placeholder="Tìm kiếm sản phẩm..."
                className={`w-full pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-gray-300 placeholder-gray-400"
                    : "border-gray-200 bg-white text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 transition-colors duration-200 relative ${
                darkMode ? "text-gray-300 hover:text-red-400" : "text-gray-700 hover:text-red-500"
              }`}
            >
              <Heart className="h-6 w-6" />
              <span
                className={`absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-white text-xs rounded-full ${
                  darkMode ? "bg-red-600" : "bg-red-500"
                }`}
              >
                {isAuthenticated ? user?.wishListItemsCount || 0 : 0}
              </span>
            </motion.button>

            {/* Shopping Cart */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (isAuthenticated ? navigate("/cart") : navigate("/signin"))}
              className={`p-2 transition-colors duration-200 relative ${
                darkMode ? "text-gray-300 hover:text-blue-400" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              <ShoppingCart className="h-6 w-6" />
              <span
                className={`absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-white text-xs rounded-full ${
                  darkMode ? "bg-blue-500" : "bg-blue-600"
                }`}
              >
                {cartItemCount}
              </span>
            </motion.button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold"
                >
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.userName || "User Avatar"}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6" />
                  )}

                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg border ${
                        darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-700"
                      }`}
                    >
                      <div className="p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">{user?.userName || "Người dùng"}</p>
                          <p className="w-[200px] truncate text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                        </div>
                      </div>
                      <hr className={darkMode ? "border-gray-700" : "border-gray-200"} />
                      <div className="p-2">
                        <Link
                          to="/profile"
                          className={`block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Hồ Sơ Cá Nhân
                        </Link>
                        <Link
                          to="/orders"
                          className={`block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Đơn Hàng
                        </Link>
                        <Link
                          to="/settings"
                          className={`block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Cài Đặt
                        </Link>
                      </div>
                      <hr className={darkMode ? "border-gray-700" : "border-gray-200"} />
                      <button
                        onClick={handleLogout}
                        className={`block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Đăng Xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/signin">
                <button
                  className={`rounded-full px-6 py-2 text-white transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700`}
                >
                  <User className="h-4 w-4 mr-2 inline" />
                  Đăng Nhập
                </button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`lg:hidden p-2 transition-colors duration-200 ${
                darkMode ? "text-gray-300 hover:text-blue-400" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`lg:hidden border-t ${
                darkMode ? "bg-gray-800/95 border-gray-700" : "bg-white/95 border-gray-200"
              } backdrop-blur-md`}
            >
              <div className="py-4 space-y-4">
                <div className="px-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      placeholder="Tìm kiếm sản phẩm..."
                      className={`w-full pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode
                          ? "border-gray-600 bg-gray-700 text-gray-300 placeholder-gray-400"
                          : "border-gray-200 bg-white text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-4 py-2 transition-colors duration-200 ${
                        darkMode
                          ? "text-gray-300 hover:text-blue-400 hover:bg-gray-700"
                          : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;