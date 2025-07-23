/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Key } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import {
  useGoogleLoginMutation,
  useLoginMutation,
  useRegisterMutation,
  useSendVerificationCodeMutation,
  useVerifyEmailMutation,
} from "../../app/api/authApi";
import { setAuth } from "../../app/store/authSlice";
import { useGoogleLogin } from "@react-oauth/google";

interface SignInForm {
  email: string;
  password: string;
}

interface SignUpForm {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface VerifyCodeForm {
  code: string;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const SignIn = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const [sendVerificationCode, { isLoading: isSendingCode }] = useSendVerificationCodeMutation();
  const [verifyEmailMutation, { isLoading: isVerifyingCode }] = useVerifyEmailMutation();

  const {
    control: signInControl,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors },
  } = useForm<SignInForm>({
    defaultValues: { email: "", password: "" },
  });

  const {
    control: signUpControl,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors },
    reset: resetSignUp,
  } = useForm<SignUpForm>({
    defaultValues: { userName: "", email: "", password: "", confirmPassword: "" },
  });

  const {
    control: verifyControl,
    handleSubmit: handleVerifySubmit,
    formState: { errors: verifyErrors },
    reset: resetVerify,
  } = useForm<VerifyCodeForm>({
    defaultValues: { code: "" },
  });

  // Clear error and verification state on mode toggle
  useEffect(() => {
    setErrorMessage(null);
    setIsVerifying(false);
    setVerifyEmail("");
    resetSignUp();
    resetVerify();
  }, [isLogin, resetSignUp, resetVerify]);

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && window.location.pathname === "/signin") {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle resend cooldown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const googleLoginHook = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await googleLogin({ accessToken: tokenResponse.access_token }).unwrap();
        console.log("Google login response:", response);
        dispatch(setAuth(response));
        navigate("/", { replace: true });
      } catch (error: any) {
        console.error("Google login error:", error);
        setErrorMessage(getErrorMessage(error));
      }
    },
    onError: () => {
      console.error("Google login failed");
      setErrorMessage("Google login failed. Please try again.");
    },
  });

  const handleGoogleSignIn = () => {
    googleLoginHook();
  };

  const handleSignIn = async (data: SignInForm) => {
    setErrorMessage(null);
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    try {
      const response = await login(formData).unwrap();
      console.log("Login response:", response);
      if (response.emailConfirmed) {
        dispatch(setAuth(response));
        navigate("/", { replace: true });
      } else {
        await sendVerificationCode({ email: data.email }).unwrap();
        setVerifyEmail(data.email);
        setIsVerifying(true);
        setResendCooldown(60);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.status === 422) {
        // Unverified email
        await sendVerificationCode({ email: data.email }).unwrap();
        setVerifyEmail(data.email);
        setIsVerifying(true);
        setResendCooldown(60);
      } else {
        setErrorMessage(getErrorMessage(error));
      }
    }
  };

  const handleSignUp = async (data: SignUpForm) => {
    setErrorMessage(null);
    if (data.password !== data.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    const formData = new FormData();
    formData.append("userName", data.userName);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("confirmPassword", data.confirmPassword);
    try {
      const response = await register(formData).unwrap();
      console.log("Register response:", response);

      setVerifyEmail(data.email);
      setIsVerifying(true);
      setResendCooldown(60);
    } catch (error: any) {
      console.error("Register error:", error);
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleVerifyCode = async (data: VerifyCodeForm) => {
    setErrorMessage(null);
    try {
      const response = await verifyEmailMutation({ email: verifyEmail, code: data.code }).unwrap();
      console.log("Verify email response:", response);
      dispatch(setAuth(response));
      navigate("/", { replace: true });
    } catch (error: any) {
      console.error("Verify email error:", error);
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    try {
      await sendVerificationCode({ email: verifyEmail }).unwrap();
      setResendCooldown(60);
      setErrorMessage("Gửi lại mã xác minh thành công. Vui lòng kiểm tra email của bạn.");
    } catch (error: any) {
      console.error("Resend code error:", error);
      setErrorMessage(getErrorMessage(error));
    }
  };

  const getErrorMessage = (error: any): string => {
    if (error.data?.message) return error.data.message;
    if (error.data?.errors) return Object.values(error.data.errors).flat().join(", ");
    if (typeof error.data === "string") return error.data;
    return "An error occurred. Please try again.";
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>
      <div className="relative z-10 w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Về Trang Chủ
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-2xl p-6">
            <div className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <User className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isVerifying
                  ? "Xác Minh Email"
                  : isLogin
                  ? "Chào Mừng Trở Lại!"
                  : "Tạo Tài Khoản Mới"}
              </h2>
              <p className="text-gray-600">
                {isVerifying
                  ? `Nhập mã xác minh được gửi đến ${verifyEmail}`
                  : isLogin
                  ? "Đăng nhập để tiếp tục mua sắm"
                  : "Tham gia cộng đồng thể thao của chúng tôi"}
              </p>
            </div>
            <div className="space-y-6">
              {!isVerifying && (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-full py-3 flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {isGoogleLoading ? "Đang xử lý..." : "Tiếp tục với Google"}
                </button>
              )}
              {!isVerifying && (
                <div className="relative">
                  <hr className="border-gray-200" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-gray-500">
                    hoặc
                  </span>
                </div>
              )}
              <AnimatePresence mode="wait" custom={isLogin ? 1 : -1}>
                {isVerifying ? (
                  <motion.form
                    key="verify"
                    custom={isLogin ? 1 : -1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    onSubmit={handleVerifySubmit(handleVerifyCode)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label htmlFor="code" className="text-sm font-medium text-gray-700">
                        Mã Xác Minh
                      </label>
                      <div className="relative">
                        <Key
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                        />
                        <Controller
                          name="code"
                          control={verifyControl}
                          rules={{
                            required: "Verification code is required",
                            minLength: { value: 6, message: "Code must be at least 6 characters" },
                          }}
                          render={({ field }) => (
                            <input
                              {...field}
                              id="code"
                              type="text"
                              placeholder="Nhập mã xác minh"
                              className={`w-full pl-10 pr-4 py-2 rounded-full border ${
                                verifyErrors.code ? "border-red-500" : "border-gray-200"
                              } focus:border-blue-500 focus:outline-none transition-colors duration-200 disabled:bg-gray-100`}
                              disabled={isVerifyingCode}
                            />
                          )}
                        />
                        {verifyErrors.code && (
                          <p className="text-sm text-red-500 mt-1">{verifyErrors.code.message}</p>
                        )}
                      </div>
                    </div>
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-red-500 text-center bg-red-50 p-2 rounded-md"
                      >
                        {errorMessage}
                      </motion.div>
                    )}
                    <button
                      type="submit"
                      disabled={isVerifyingCode}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full py-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                    >
                      {isVerifyingCode ? "Đang xác minh..." : "Xác Minh"}
                    </button>
                    <div className="text-center">
                      <button
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0 || isSendingCode}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 disabled:text-gray-400"
                      >
                        {resendCooldown > 0
                          ? `Gửi lại mã sau ${resendCooldown}s`
                          : isSendingCode
                          ? "Đang gửi mã..."
                          : "Gửi lại mã xác minh"}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key={isLogin ? "login" : "signup"}
                    custom={isLogin ? 1 : -1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    onSubmit={isLogin ? handleSignInSubmit(handleSignIn) : handleSignUpSubmit(handleSignUp)}
                    className="space-y-4"
                  >
                    {!isLogin && (
                      <>
                        <div className="space-y-2">
                          <label htmlFor="userName" className="text-sm font-medium text-gray-700">
                            Họ và Tên
                          </label>
                          <div className="relative">
                            <User
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                            />
                            <Controller
                              name="userName"
                              control={signUpControl}
                              rules={{ required: "Username is required" }}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  id="userName"
                                  type="text"
                                  placeholder="Nhập họ và tên"
                                  className={`w-full pl-10 pr-4 py-2 rounded-full border ${
                                    signUpErrors.userName ? "border-red-500" : "border-gray-200"
                                  } focus:border-blue-500 focus:outline-none transition-colors duration-200 disabled:bg-gray-100`}
                                  disabled={isRegisterLoading}
                                />
                              )}
                            />
                            {signUpErrors.userName && (
                              <p className="text-sm text-red-500 mt-1">{signUpErrors.userName.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <div className="relative">
                            <Mail
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                            />
                            <Controller
                              name="email"
                              control={signUpControl}
                              rules={{
                                required: "Email is required",
                                pattern: {
                                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                  message: "Invalid email address",
                                },
                              }}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  id="email"
                                  type="email"
                                  placeholder="Nhập địa chỉ email"
                                  className={`w-full pl-10 pr-4 py-2 rounded-full border ${
                                    signUpErrors.email ? "border-red-500" : "border-gray-200"
                                  } focus:border-blue-500 focus:outline-none transition-colors duration-200 disabled:bg-gray-100`}
                                  disabled={isRegisterLoading}
                                />
                              )}
                            />
                            {signUpErrors.email && (
                              <p className="text-sm text-red-500 mt-1">{signUpErrors.email.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="password" className="text-sm font-medium text-gray-700">
                            Mật khẩu
                          </label>
                          <div className="relative">
                            <Lock
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                            />
                            <Controller
                              name="password"
                              control={signUpControl}
                              rules={{
                                required: "Password is required",
                                minLength: { value: 6, message: "Password must be at least 6 characters" },
                              }}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  id="password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Nhập mật khẩu"
                                  className={`w-full pl-10 pr-10 py-2 rounded-full border ${
                                    signUpErrors.password ? "border-red-500" : "border-gray-200"
                                  } focus:border-blue-500 focus:outline-none transition-colors duration-200 disabled:bg-gray-100`}
                                  disabled={isRegisterLoading}
                                />
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            {signUpErrors.password && (
                              <p className="text-sm text-red-500 mt-1">{signUpErrors.password.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                            Xác Nhận Mật Khẩu
                          </label>
                          <div className="relative">
                            <Lock
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                            />
                            <Controller
                              name="confirmPassword"
                              control={signUpControl}
                              rules={{
                                required: "Please confirm your password",
                                minLength: { value: 6, message: "Password must be at least 6 characters" },
                              }}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  id="confirmPassword"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Xác nhận mật khẩu"
                                  className={`w-full pl-10 pr-10 py-2 rounded-full border ${
                                    signUpErrors.confirmPassword ? "border-red-500" : "border-gray-200"
                                  } focus:border-blue-500 focus:outline-none transition-colors duration-200 disabled:bg-gray-100`}
                                  disabled={isRegisterLoading}
                                />
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            {signUpErrors.confirmPassword && (
                              <p className="text-sm text-red-500 mt-1">{signUpErrors.confirmPassword.message}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {isLogin && (
                      <>
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <div className="relative">
                            <Mail
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                            />
                            <Controller
                              name="email"
                              control={signInControl}
                              rules={{
                                required: "Email is required",
                                pattern: {
                                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                  message: "Invalid email address",
                                },
                              }}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  id="email"
                                  type="email"
                                  placeholder="Nhập địa chỉ email"
                                  className={`w-full pl-10 pr-4 py-2 rounded-full border ${
                                    signInErrors.email ? "border-red-500" : "border-gray-200"
                                  } focus:border-blue-500 focus:outline-none transition-colors duration-200 disabled:bg-gray-100`}
                                  disabled={isLoginLoading}
                                />
                              )}
                            />
                            {signInErrors.email && (
                              <p className="text-sm text-red-500 mt-1">{signInErrors.email.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="password" className="text-sm font-medium text-gray-700">
                            Mật khẩu
                          </label>
                          <div className="relative">
                            <Lock
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                            />
                            <Controller
                              name="password"
                              control={signInControl}
                              rules={{
                                required: "Password is required",
                                minLength: { value: 6, message: "Password must be at least 6 characters" },
                              }}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  id="password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Nhập mật khẩu"
                                  className={`w-full pl-10 pr-10 py-2 rounded-full border ${
                                    signInErrors.password ? "border-red-500" : "border-gray-200"
                                  } focus:border-blue-500 focus:outline-none transition-colors duration-200 disabled:bg-gray-100`}
                                  disabled={isLoginLoading}
                                />
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            {signInErrors.password && (
                              <p className="text-sm text-red-500 mt-1">{signInErrors.password.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Link
                            to="/forgot-password"
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          >
                            Quên mật khẩu?
                          </Link>
                        </div>
                      </>
                    )}
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-red-500 text-center bg-red-50 p-2 rounded-md"
                      >
                        {errorMessage}
                      </motion.div>
                    )}
                    <button
                      type="submit"
                      disabled={isLoginLoading || isRegisterLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full py-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                    >
                      {isLoginLoading || isRegisterLoading
                        ? "Đang xử lý..."
                        : isLogin
                        ? "Đăng Nhập"
                        : "Tạo Tài Khoản"}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
              {!isVerifying && (
                <div className="text-center">
                  <span className="text-gray-600">{isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}</span>
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="ml-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
                  >
                    {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;