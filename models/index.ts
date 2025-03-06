import { z } from "zod";

// User model schema
export const userSchema = z.object({
  id: z.string(),
  name: z.string().optional().nullable(),
  email: z.string().email(),
  emailVerified: z.date().optional().nullable(),
  image: z.string().optional().nullable(),
  role: z.enum(["user", "admin", "company_owner"]).default("user"),
  companyId: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Company model schema
export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  logo: z.string().optional(),
  websiteUrl: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email(),
  isVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Raffle model schema
export const raffleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  image: z.string(),
  companyId: z.string(),
  totalTickets: z.number().int().positive(),
  availableTickets: z.number().int().nonnegative(),
  ticketPrice: z.number().positive(),
  discountedPrice: z.number().optional(),
  prizeDescription: z.string(),
  prizeImages: z.array(z.string()).optional(),
  drawDate: z.date(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Ticket model schema
export const ticketSchema = z.object({
  id: z.string(),
  number: z.number().int().nonnegative(),
  raffleId: z.string(),
  userId: z.string(),
  purchaseDate: z.date(),
  paymentId: z.string(),
  isWinner: z.boolean().default(false),
});

// Payment model schema
export const paymentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("MXN"),
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  stripePaymentId: z.string().optional(),
  stripeSessionId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;
export type Company = z.infer<typeof companySchema>;
export type Raffle = z.infer<typeof raffleSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type Payment = z.infer<typeof paymentSchema>;
