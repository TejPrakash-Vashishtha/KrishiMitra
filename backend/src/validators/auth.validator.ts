import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    phone: z.string().min(10, "Phone number must be at least 10 characters").max(15, "Phone number must not exceed 15 characters"),
    password: z.string().min(4, "Password must be at least 4 characters long"),
  })
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    phone: z.string().min(10, "Phone number must be at least 10 characters").max(15, "Phone number must not exceed 15 characters"),
    password: z.string().min(4, "Password must be at least 4 characters long"),
    role: z.enum(["FARMER", "DEALER", "EXPERT"]).optional(),
    district: z.string().optional(),
    shopName: z.string().optional(),
  }).refine((data) => {
    if (data.role === "DEALER" && !data.shopName) {
      return false;
    }
    return true;
  }, {
    message: "shopName is required when role is DEALER",
    path: ["shopName"]
  })
});
