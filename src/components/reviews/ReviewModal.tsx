import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { ReviewService } from '@/services/reviewService';
import { toast } from 'sonner';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  onReviewSubmitted?: () => void;
  existingReview?: {
    id: string;
    rating: number;
    comment: string;
  };
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  businessId,
  businessName,
  onReviewSubmitted,
  existingReview,
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingReview) {
        // Update existing review
        await ReviewService.updateReview(existingReview.id, {
          rating,
          comment: comment.trim() || undefined,
        });
        toast.success('Review updated successfully!');
      } else {
        // Create new review
        await ReviewService.createReview({
          business_id: businessId,
          rating,
          comment: comment.trim() || undefined,
        });
        toast.success('Review submitted successfully!');
      }

      onReviewSubmitted?.();
      handleClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit review';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(existingReview?.rating || 0);
    setComment(existingReview?.comment || '');
    setHoveredRating(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? 'Edit Your Review' : 'Write a Review'}
          </DialogTitle>
          <DialogDescription>
            Share your experience at {businessName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              How would you rate this business?
            </p>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label
              htmlFor="comment"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Your Review (Optional)
            </label>
            <Textarea
              id="comment"
              placeholder="Share details about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
