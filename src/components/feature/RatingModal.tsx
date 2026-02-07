import { useState, useEffect } from 'react';
import RatingStars from './RatingStars';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  title: string;
  itemName: string;
  existingRating?: number;
  existingComment?: string;
}

export default function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  itemName,
  existingRating = 0,
  existingComment = ''
}: RatingModalProps) {
  const [rating, setRating] = useState(existingRating);
  const [comment, setComment] = useState(existingComment);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(existingRating);
      setComment(existingComment);
    }
  }, [isOpen, existingRating, existingComment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
      // إغلاق المودال فقط عند النجاح (يتم من handleSubmitRating)
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('خطأ في إرسال التقييم:', error);
      // لا نغلق المودال عند حدوث خطأ
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="ri-close-line w-6 h-6"></i>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">Comment était votre expérience avec {itemName} ?</p>
          
          <div className="flex justify-center mb-6">
            <RatingStars
              rating={rating}
              onRatingChange={setRating}
              size="lg"
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre avis..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/500 caractères
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer l\'avis'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}