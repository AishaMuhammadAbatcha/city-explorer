import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Reply, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewService, type Review } from "@/services/reviewService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReviewsManagementProps {
  businessId: string;
}

const ReviewsManagement: React.FC<ReviewsManagementProps> = ({ businessId }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [businessId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await ReviewService.getReviewsForBusiness(businessId);
      setReviews(data as any);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to respond");
        return;
      }

      // Update the review with business response
      // @ts-ignore - Temporary workaround for Supabase types
      await supabase
        .from('reviews')
        // @ts-ignore
        .update({
          business_response: replyText,
          business_response_date: new Date().toISOString(),
          business_response_by: user.id,
        })
        .eq('id', reviewId);

      toast.success("Response added successfully");
      setReplyingTo(null);
      setReplyText("");
      loadReviews();
    } catch (error) {
      console.error("Error adding response:", error);
      toast.error("Failed to add response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResponse = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this response?")) return;

    try {
      // @ts-ignore - Temporary workaround for Supabase types
      await supabase
        .from('reviews')
        // @ts-ignore
        .update({
          business_response: null,
          business_response_date: null,
          business_response_by: null,
        })
        .eq('id', reviewId);

      toast.success("Response deleted successfully");
      loadReviews();
    } catch (error) {
      console.error("Error deleting response:", error);
      toast.error("Failed to delete response");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
        <p className="text-gray-600 mt-1">Manage and respond to customer reviews</p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No reviews yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Reviews from customers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-6 bg-white">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {review.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {review.profiles?.full_name || "Anonymous"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-gray-500 text-sm">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Comment */}
              {review.comment && (
                <p className="text-gray-700 mb-4">{review.comment}</p>
              )}

              {/* Business Response */}
              {review.business_response ? (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Reply className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-900">Business Response</span>
                      {review.business_response_date && (
                        <span className="text-gray-500 text-sm">
                          {format(new Date(review.business_response_date), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteResponse(review.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-gray-700">{review.business_response}</p>
                </div>
              ) : (
                <div className="mt-4">
                  {replyingTo === review.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your response..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReply(review.id)}
                          disabled={submitting}
                          size="sm"
                        >
                          {submitting ? "Posting..." : "Post Response"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setReplyingTo(review.id)}
                      size="sm"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Respond
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsManagement;
