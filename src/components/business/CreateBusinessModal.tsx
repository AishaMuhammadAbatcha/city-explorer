import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Building2, MapPin, Phone, Mail, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BusinessService, type BusinessInsert } from "@/services/businessService";
import { toast } from "sonner";

// Business creation schema
const createBusinessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").max(100, "Business name is too long"),
  description: z.string().min(10, "Please provide a description of at least 10 characters").max(500, "Description is too long").optional().or(z.literal("")),
  category: z.string().min(1, "Please select a category"),
  address: z.string().min(5, "Please provide a valid address"),
  city: z.string().min(2, "Please provide a city name"),
  phone: z.string().min(10, "Please provide a valid phone number").optional().or(z.literal("")),
  email: z.string().email("Please provide a valid email").optional().or(z.literal("")),
  website: z.string().url("Please provide a valid website URL").optional().or(z.literal("")),
});

type CreateBusinessFormData = z.infer<typeof createBusinessSchema>;

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (businessId: string) => void;
}

const businessCategories = [
  "Dining",
  "Services",
  "Shopping",
  "Entertainment",
  "Health & Wellness",
  "Auto",
  "Education",
  "Beauty & Spa",
  "Professional Services",
  "Home Services",
  "Other"
];

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CreateBusinessFormData>({
    resolver: zodResolver(createBusinessSchema),
  });

  const selectedCategory = watch("category");

  const onSubmit = async (data: CreateBusinessFormData) => {
    try {
      setIsSubmitting(true);

      // Prepare business data
      const businessData: BusinessInsert = {
        name: data.name,
        description: data.description || undefined,
        category: data.category,
        address: data.address,
        city: data.city,
        phone: data.phone || undefined,
        email: data.email || undefined,
        website: data.website || undefined,
      };

      // Create the business
      const newBusiness: any = await BusinessService.createBusiness(businessData);

      if (!newBusiness?.id) {
        throw new Error("Failed to create business - no ID returned");
      }

      toast.success("Business created successfully!", {
        description: "Your business profile has been created and is ready to use."
      });

      // Reset form
      reset();
      
      // Call success callback with business ID
      onSuccess(newBusiness.id as string);
      
      // Close modal
      onClose();
    } catch (error: any) {
      console.error("Error creating business:", error);
      toast.error("Failed to create business", {
        description: error.message || "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Building2 className="w-6 h-6 text-primary" />
            Create Your Business Profile
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to create your business profile. This will allow you to manage events, deals, and reviews.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              Business Name *
            </Label>
            <Input
              id="name"
              placeholder="Enter your business name"
              {...register("name")}
              disabled={isSubmitting}
              className="text-base"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category *
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setValue("category", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="category" className="text-base">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {businessCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Tell customers about your business..."
              rows={4}
              {...register("description")}
              disabled={isSubmitting}
              className="text-base resize-none"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Provide a brief description of your business and what makes it special.
            </p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Address *
            </Label>
            <Input
              id="address"
              placeholder="123 Main Street"
              {...register("address")}
              disabled={isSubmitting}
              className="text-base"
            />
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              City *
            </Label>
            <Input
              id="city"
              placeholder="Enter city name"
              {...register("city")}
              disabled={isSubmitting}
              className="text-base"
            />
            {errors.city && (
              <p className="text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          {/* Contact Information - Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...register("phone")}
                disabled={isSubmitting}
                className="text-base"
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Business Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@business.com"
                {...register("email")}
                disabled={isSubmitting}
                className="text-base"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-medium flex items-center gap-1">
              <Globe className="w-4 h-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.yourbusiness.com"
              {...register("website")}
              disabled={isSubmitting}
              className="text-base"
            />
            {errors.website && (
              <p className="text-sm text-red-600">{errors.website.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Business...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Create Business
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBusinessModal;
