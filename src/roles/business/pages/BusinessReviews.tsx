import CustomTextArea from "@/components/inputs/CustomTextArea";
import { Button } from "@/components/ui/button";
import { Star, MoreVertical, Edit, Trash2, MessageSquare, Reply } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { reviewSchema, type ReviewSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessService } from "@/services/businessService";
import { ReviewService } from "@/services/reviewService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

const BusinessReviews = () => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReviewSchema>({ resolver: zodResolver(reviewSchema) });
  const { showToast } = useToast();
  const { user } = useAuth();

  const [reviewClicked, setReviewClicked] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    loadBusinessAndReviews();
  }, [user]);

  const loadBusinessAndReviews = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Get business owned by current user
      const businesses = await BusinessService.getBusinessesByOwner(user.id);
      if (businesses.length > 0) {
        const business = businesses[0]; // Get first business
        setBusinessId(business.id);
        // Load reviews for this business
        const reviewsData = await ReviewService.getReviewsForBusiness(business.id);
        setReviews(reviewsData as any);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const ClickRespond = (reviewId: string) => {
    setReviewClicked(reviewId);
    setIsEditing(false);
    setOpenDropdown(null);
  };

  const handleEditResponse = (reviewId: string) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (review?.business_response) {
      setValue("review", review.business_response);
      setReviewClicked(reviewId);
      setIsEditing(true);
      setOpenDropdown(null);
    }
  };

  const handleDeleteResponse = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this response?")) return;

    try {
      await supabase
        .from('reviews')
        .update({
          business_response: null,
          business_response_date: null,
          business_response_by: null,
        })
        .eq('id', reviewId);

      showToast("Response deleted successfully", "success");
      loadBusinessAndReviews();
    } catch (error) {
      console.error("Error deleting response:", error);
      showToast("Failed to delete response", "error");
    }
    setOpenDropdown(null);
  };

  const toggleDropdown = (reviewId: string) => {
    setOpenDropdown(openDropdown === reviewId ? null : reviewId);
  };

  const onSubmit: SubmitHandler<ReviewSchema> = async (data) => {
    if (!user || !reviewClicked) return;

    try {
      // Update the review with business response
      await supabase
        .from('reviews')
        .update({
          business_response: data.review,
          business_response_date: new Date().toISOString(),
          business_response_by: user.id,
        })
        .eq('id', reviewClicked);

      reset();
      setReviewClicked(null);
      setIsEditing(false);

      const message = isEditing
        ? "Response updated successfully"
        : "Response sent successfully";
      showToast(message, "success");

      loadBusinessAndReviews();
    } catch (error: any) {
      showToast("Something went wrong", "error");
      console.error(error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1 items-center">
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
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold">Business Reviews</h3>
        <p className="text-base">
          See what customers are saying and respond to their feedback.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="mt-8 text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No reviews yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Reviews from customers will appear here
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {reviews.map((item) => (
            <div
              className="bg-white border-1 border-border-primary rounded-md w-full p-6"
              key={item.id}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2 flex-1">
                  <h4 className="font-bold">Reviewer: {item.profiles?.full_name || "Anonymous"}</h4>
                  {item.comment && (
                    <p className="text-base text-gray-700">{item.comment}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {format(new Date(item.created_at), "MMM d, yyyy")}
                  </p>
                  {item.business_response && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md border-l-4 border-blue-500">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Reply className="w-4 h-4 text-blue-600" />
                            <p className="text-base font-medium text-gray-700">
                              Your Response:
                            </p>
                            {item.business_response_date && (
                              <span className="text-gray-500 text-sm">
                                {format(new Date(item.business_response_date), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                          <p className="text-base text-gray-700">
                            {item.business_response}
                          </p>
                        </div>
                        <div
                          className="relative ml-2"
                          ref={openDropdown === item.id ? dropdownRef : null}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleDropdown(item.id)}
                            className="h-6 w-6 text-gray-500 hover:text-gray-700"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {openDropdown === item.id && (
                            <div className="absolute right-0 top-7 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                              <button
                                onClick={() => handleEditResponse(item.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteResponse(item.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-md"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end ml-4">
                  {renderStars(item.rating)}
                  {!item.business_response && (
                    <Button onClick={() => ClickRespond(item.id)}>Respond</Button>
                  )}
                </div>
              </div>
              {reviewClicked === item.id && (
                <div>
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="w-full max-w-md py-4"
                  >
                    <CustomTextArea
                      placeholder="Write your response here..."
                      register={register("review")}
                      errorMessage={errors.review}
                      className="my-2"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="submit"
                        variant={"default"}
                        size={"default"}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                      >
                        {isEditing ? "Update" : "Send"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setReviewClicked(null);
                          setIsEditing(false);
                          reset();
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessReviews;
