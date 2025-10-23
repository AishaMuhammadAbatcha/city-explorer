import CustomTextArea from "@/components/inputs/CustomTextArea";
import { Button } from "@/components/ui/button";
import { Star, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { reviewSchema, type ReviewSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useToast } from "@/context/ToastContext";

type ReviewWithResponse = {
  id: number;
  reviewer: string;
  review_sent: string;
  review_date: string;
  response?: string;
};

const BusinessReviews = () => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReviewSchema>({ resolver: zodResolver(reviewSchema) });
  const { showToast } = useToast();

  const [reviewClicked, setReviewClicked] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reviews, setReviews] =
    useState<ReviewWithResponse[]>(initialReviewsData);
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

  const ClickRespond = (response_id: number) => {
    console.log(response_id);
    setReviewClicked(response_id);
    setIsEditing(false);
    setOpenDropdown(null);
  };

  const handleEditResponse = (reviewId: number) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (review?.response) {
      setValue("review", review.response);
      setReviewClicked(reviewId);
      setIsEditing(true);
      setOpenDropdown(null);
    }
  };

  const handleDeleteResponse = (reviewId: number) => {
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.id === reviewId ? { ...review, response: undefined } : review
      )
    );
    setOpenDropdown(null);
    showToast("Response deleted successfully", "success");
  };

  const toggleDropdown = (reviewId: number) => {
    setOpenDropdown(openDropdown === reviewId ? null : reviewId);
  };

  const onSubmit: SubmitHandler<ReviewSchema> = async (data) => {
    try {
      console.log(data);

      // Update the specific review with the response
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewClicked
            ? { ...review, response: data.review }
            : review
        )
      );

      reset();
      setReviewClicked(null);
      setIsEditing(false);

      const message = isEditing
        ? "Response updated successfully"
        : "Response sent successfully";
      showToast(message, "success");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showToast("Something went wrong", "error");
      console.error(error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold">Business Reviews</h3>
        <p className="text-base">
          See what customers are saying and respond to their feedback.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-4">
        {reviews.map((item) => (
          <div
            className="bg-white border-1 border-border-primary rounded-md w-full p-6"
            key={item.id}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <h4 className="font-bold">Reviewer: {item.reviewer}</h4>
                <p className="text-base">Review: {item.review_sent}</p>
                <p className="text-base">Review date: {item.review_date}</p>
                {item.response && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md border-l-4 border-blue-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-base font-medium text-gray-700">
                          Your Response:
                        </p>
                        <p className="text-base text-gray-600">
                          {item.response}
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
              <div className="flex flex-col gap-2">
                <div className="flex gap-1 items-center">
                  <Star className="text-orange-300" />
                  <p>5/5</p>
                </div>
                {!item.response && (
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
    </div>
  );
};

const initialReviewsData: ReviewWithResponse[] = [
  {
    id: 1,
    reviewer: "Alex Johnson",
    review_sent:
      "Amazing service! The ambience was great and the staff were friendly.",
    review_date: "July 15, 2025",
  },
  {
    id: 2,
    reviewer: "Grace Okoro",
    review_sent: "Good experience overall, but the wait time was a bit long.",
    review_date: "July 14, 2025",
  },
];

export default BusinessReviews;
