import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useForm, type SubmitHandler } from "react-hook-form";
import { editProfileSchema, type EditProfileSchema } from "./schema";
import CustomTextField from "@/components/inputs/CustomTextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

const EditProfile = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileSchema>({ resolver: zodResolver(editProfileSchema) });
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<EditProfileSchema> = async (data) => {
    try {
      console.log("Profile data:", data);
      toast.success("Profile updated successfully");
      navigate("/settings");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <CustomTextField
                  label=""
                  placeholder="Enter your first name"
                  register={register("firstName")}
                  errorMessage={errors.firstName}
                  className=""
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <CustomTextField
                  label=""
                  placeholder="Enter your last name"
                  register={register("lastName")}
                  errorMessage={errors.lastName}
                  className=""
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <CustomTextField
                label=""
                placeholder="Enter your email address"
                type="email"
                register={register("email")}
                errorMessage={errors.email}
                className=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <CustomTextField
                label=""
                placeholder="Enter your phone number"
                register={register("phone")}
                errorMessage={errors.phone}
                className=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                {...register("bio")}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bg-primary-dark2 focus:border-transparent resize-vertical"
              />
              {errors.bio && (
                <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <CustomTextField
                label=""
                placeholder="Enter your location"
                register={register("location")}
                errorMessage={errors.location}
                className=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password (Optional)
              </label>
              <CustomTextField
                label=""
                placeholder="Enter new password"
                type="password"
                register={register("newPassword")}
                errorMessage={errors.newPassword}
                checkPassword
                className=""
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="flex-1 bg-bg-primary-dark2 hover:bg-bg-primary-dark2/90"
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/settings")}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;