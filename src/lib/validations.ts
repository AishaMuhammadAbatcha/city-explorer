import { z } from 'zod'

// Common validation rules
const email = z.string().email('Please enter a valid email address')
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

const phone = z
  .string()
  .regex(/^(\+234|0)[789][01]\d{8}$/, 'Please enter a valid Nigerian phone number')
  .optional()
  .or(z.literal(''))

const name = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name cannot exceed 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')

// Auth schemas
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z
  .object({
    email,
    password,
    confirmPassword: z.string(),
    fullName: name,
    role: z.enum(['individual', 'business'], {
      message: 'Please select a role',
    }),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email,
})

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
    token: z.string().min(1, 'Reset token is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Profile schemas
export const profileUpdateSchema = z.object({
  fullName: name.optional(),
  phone,
  address: z.string().max(200, 'Address cannot exceed 200 characters').optional(),
  city: z.string().max(50, 'City name cannot exceed 50 characters').optional(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Business schemas
export const businessSchema = z.object({
  name: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name cannot exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters'),
  category: z.string().min(1, 'Please select a category'),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address cannot exceed 200 characters'),
  city: z
    .string()
    .min(2, 'City name must be at least 2 characters')
    .max(50, 'City name cannot exceed 50 characters'),
  phone,
  email: email.optional().or(z.literal('')),
  website: z
    .string()
    .url('Please enter a valid website URL')
    .optional()
    .or(z.literal('')),
  openingHours: z.object({
    monday: z.object({
      open: z.string().optional(),
      close: z.string().optional(),
      closed: z.boolean().default(false),
    }),
    tuesday: z.object({
      open: z.string().optional(),
      close: z.string().optional(),
      closed: z.boolean().default(false),
    }),
    wednesday: z.object({
      open: z.string().optional(),
      close: z.string().optional(),
      closed: z.boolean().default(false),
    }),
    thursday: z.object({
      open: z.string().optional(),
      close: z.string().optional(),
      closed: z.boolean().default(false),
    }),
    friday: z.object({
      open: z.string().optional(),
      close: z.string().optional(),
      closed: z.boolean().default(false),
    }),
    saturday: z.object({
      open: z.string().optional(),
      close: z.string().optional(),
      closed: z.boolean().default(false),
    }),
    sunday: z.object({
      open: z.string().optional(),
      close: z.string().optional(),
      closed: z.boolean().default(false),
    }),
  }).optional(),
})

// Event schemas
export const eventSchema = z.object({
  title: z
    .string()
    .min(3, 'Event title must be at least 3 characters')
    .max(100, 'Event title cannot exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z
    .string()
    .min(5, 'Location must be at least 5 characters')
    .max(200, 'Location cannot exceed 200 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(1000000, 'Price is too high')
    .optional(),
  capacity: z
    .number()
    .min(1, 'Capacity must be at least 1')
    .max(10000, 'Capacity is too high')
    .optional(),
})

// Review schemas
export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(500, 'Review cannot exceed 500 characters'),
})

// Search schemas
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query is too long'),
  category: z.string().optional(),
  location: z.string().optional(),
  radius: z.number().min(1).max(50).optional(),
  priceLevel: z.number().min(1).max(4).optional(),
  rating: z.number().min(1).max(5).optional(),
})

// Contact/Feedback schemas
export const contactSchema = z.object({
  name: name,
  email,
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject cannot exceed 100 characters'),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(1000, 'Message cannot exceed 1000 characters'),
})

// Newsletter schema
export const newsletterSchema = z.object({
  email,
})

// Booking schema
export const bookingSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  partySize: z
    .number()
    .min(1, 'Party size must be at least 1')
    .max(20, 'Party size cannot exceed 20'),
  specialRequests: z
    .string()
    .max(300, 'Special requests cannot exceed 300 characters')
    .optional(),
  contactInfo: z.object({
    name: name,
    phone: phone.refine(val => val && val.length > 0, {
      message: 'Phone number is required for bookings',
    }),
    email,
  }),
})

// Payment schema
export const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().default('NGN'),
  description: z.string().min(1, 'Payment description is required'),
  customerEmail: email,
  customerName: name,
})

// Export types
export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type BusinessFormData = z.infer<typeof businessSchema>
export type EventFormData = z.infer<typeof eventSchema>
export type ReviewFormData = z.infer<typeof reviewSchema>
export type SearchFormData = z.infer<typeof searchSchema>
export type ContactFormData = z.infer<typeof contactSchema>
export type NewsletterFormData = z.infer<typeof newsletterSchema>
export type BookingFormData = z.infer<typeof bookingSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>

// Validation helper function
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} {
  try {
    const validData = schema.parse(data)
    return { success: true, data: validData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.issues.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message
        }
      })
      return { success: false, errors }
    }
    return { success: false, errors: { general: 'Validation failed' } }
  }
}