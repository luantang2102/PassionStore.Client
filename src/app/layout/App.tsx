import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useAppSelector } from "../store/store";
import { createGlobalStyle } from "styled-components";
import AuthInitializer from "./components/AuthInitializer";

const GlobalStyle = createGlobalStyle`
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const App = () => {
  const { darkMode } = useAppSelector((state) => state.ui);

  return (
    <AuthInitializer>
      <div
        className={`min-h-screen ${
          darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-slate-50 to-blue-50"
        }`}
      >
        <GlobalStyle />
        <Navbar />
        <Outlet />
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Passion</h3>
                <p className="text-gray-400">Điểm đến tin cậy cho mọi nhu cầu thể thao của bạn</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Sản Phẩm</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Giày Thể Thao</li>
                  <li>Quần Áo</li>
                  <li>Phụ Kiện</li>
                  <li>Thiết Bị</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Hỗ Trợ</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Liên Hệ</li>
                  <li>Hướng Dẫn</li>
                  <li>Chính Sách</li>
                  <li>FAQ</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Theo Dõi</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Facebook</li>
                  <li>Instagram</li>
                  <li>YouTube</li>
                  <li>TikTok</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>© 2025 Passion. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </footer>
      </div>
    </AuthInitializer>
  );
};

export default App;