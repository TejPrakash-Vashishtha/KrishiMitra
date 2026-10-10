import { Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;
    let user = await prisma.user.findFirst({
      where: { phone: phone },
      include: { farmerProfile: true, dealerProfile: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    // Check if the user has a valid password hash and password was provided
    if (password && user.passwordHash !== "demo_hash") {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: "Invalid credentials." });
        return;
      }
    }

    const tokenPayload = {
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: "7d" });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        district: user.farmerProfile?.district || user.dealerProfile?.district || "Cuttack",
      },
      token: token,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, password, role, district, shopName } = req.body;
    const userRole = role || "FARMER";
    
    let passwordHash = "demo_hash";
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: `user_${Date.now()}@agrinexus.ai`,
        phone: phone || "+91 9800000000",
        passwordHash: passwordHash,
        role: userRole,
        location: `${district || "Cuttack"}, Odisha`,
        farmerProfile: userRole === "FARMER" ? {
          create: {
            district: district || "Cuttack",
            state: "Odisha",
            primaryCrops: "Paddy, Tomato",
          }
        } : undefined,
        dealerProfile: userRole === "DEALER" ? {
          create: {
            businessName: shopName || `${name} Agro Agency`,
            businessAddress: `${district || "Cuttack"}, Odisha`,
            phone: phone || "+91 9800000000",
            whatsappNumber: phone || "+91 9800000000",
            district: district || "Cuttack",
            state: "Odisha",
            verificationStatus: "VERIFIED",
          }
        } : undefined,
      },
    });

    const tokenPayload = {
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: "7d" });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        district: district || "Cuttack",
      },
      token: token,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
