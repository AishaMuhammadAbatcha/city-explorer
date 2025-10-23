import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";
import { useForm, type SubmitHandler } from "react-hook-form";
import { settingsSchema, type SettingsSchema } from "./schema";
import CustomTextField from "@/components/inputs/CustomTextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

const BusinessSettings = () => {
  const { user, profile, updateProfile } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettingsSchema>({ resolver: zodResolver(settingsSchema) });
  const { showToast } = useToast();

  // Load current profile data
  useEffect(() => {
    if (profile) {
      setValue("business_name", profile.full_name || "");
      setValue("username", profile.email || "");
      setValue("phone", profile.phone || "");
    }
  }, [profile, setValue]);

  const onSubmit: SubmitHandler<SettingsSchema> = async (data) => {
    try {
      if (!user) {
        showToast("You must be logged in to update settings", "error");
        return;
      }

      // Update profile
      const updates: any = {};
      if (data.business_name) updates.full_name = data.business_name;
      if (data.phone) updates.phone = data.phone;

      // Update profile in database
      if (Object.keys(updates).length > 0) {
        const { error: profileError } = await updateProfile(updates);
        if (profileError) {
          throw profileError;
        }
      }

      // Update password if provided
      if (data.new_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.new_password
        });
        if (passwordError) {
          throw passwordError;
        }
      }

      showToast("Profile updated successfully", "success");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      showToast(error.message || "Something went wrong", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 border-1 border-border-primary rounded-md w-full p-6">
          <CustomTextField
            label="Business Name"
            placeholder="Type your business name"
            register={register("business_name")}
            errorMessage={errors.business_name}
            // value={data.business_name} // Assuming you have a state for business name
            className="my-2"
          />

          <CustomTextField
            label="Email Address"
            placeholder="Type your email address"
            type="email"
            register={register("username")}
            errorMessage={errors.username}
            // value={data.email} // Assuming you have a state for email
            className="my-2"
          />

          <CustomTextField
            label="Phone"
            placeholder="Type your phone number"
            register={register("phone")}
            errorMessage={errors.phone}
            // value={data.email} // Assuming you have a state for phone
            className="my-2"
          />

          <CustomTextField
            label="Change Password"
            placeholder="•••••••••"
            type="password"
            register={register("new_password")}
            errorMessage={errors.new_password}
            checkPassword
            className="my-2"
          />

          <Button
            className="mt-2 w-full"
            type="submit"
            variant={"default"}
            size={"default"}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettings;
