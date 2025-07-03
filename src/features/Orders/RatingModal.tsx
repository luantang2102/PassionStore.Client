/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { XCircle, Star } from "lucide-react";
import { toast } from "react-toastify";
import { useCreateRatingMutation, useUpdateRatingMutation } from "../../app/api/ratingApi";
import { useAppSelector } from "../../app/store/store";
import type { Rating } from "../../app/models/responses/rating";

interface RatingModalProps {
  orderId: string;
  productId: string;
  productName: string;
  isEdit?: boolean;
  existingRating?: Rating;
  onClose: () => void;
}

const RatingModal = ({ productId, productName, isEdit = false, existingRating, onClose }: RatingModalProps) => {
  const [ratingValue, setRatingValue] = useState<number>(existingRating?.value || 0);
  const [comment, setComment] = useState<string>(existingRating?.comment || "");
  const [createRating, { isLoading: isCreating }] = useCreateRatingMutation();
  const [updateRating, { isLoading: isUpdating }] = useUpdateRatingMutation();
  const { darkMode } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (isEdit && existingRating) {
      setRatingValue(existingRating.value);
      setComment(existingRating.comment || "");
    }
  }, [isEdit, existingRating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("Value", ratingValue.toString());
      formData.append("Comment", comment);
      formData.append("ProductId", productId); // Include ProductId for both create and update
      if (!isEdit) {
        await createRating(formData).unwrap();
        toast.success(`Đã gửi đánh giá cho sản phẩm ${productName}!`);
      } else {
        if (!existingRating?.id) throw new Error("Không tìm thấy đánh giá để sửa");
        await updateRating({ id: existingRating.id, data: formData }).unwrap();
        toast.success(`Đã cập nhật đánh giá cho sản phẩm ${productName}!`);
      }
      onClose();
    } catch (err: any) {
      const errorMessage = err?.data?.message || `Không thể ${isEdit ? "cập nhật" : "gửi"} đánh giá. Vui lòng thử lại.`;
      toast.error(errorMessage);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-modal-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 ${
          darkMode ? "border-gray-600" : "border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="rating-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? "Sửa đánh giá" : "Đánh giá sản phẩm"}: {productName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
            aria-label="Đóng"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chọn số sao
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingValue(star)}
                  className={`p-1 ${
                    ratingValue >= star
                      ? "text-yellow-400"
                      : "text-gray-300 dark:text-gray-500"
                  }`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nhận xét
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className={`w-full mt-1 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? "border-gray-600 bg-gray-700 text-gray-300"
                  : "border-gray-200 bg-white text-gray-900"
              }`}
              placeholder="Viết nhận xét của bạn..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                darkMode
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating || ratingValue === 0}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ${
                isCreating || isUpdating || ratingValue === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isEdit ? "Cập nhật đánh giá" : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default RatingModal;