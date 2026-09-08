import { Request, Response } from "express";
import { prisma } from "../prisma/client.js";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    let user = await prisma.user.findFirst({
      where: { phone: phone || "+91 9812345678" },
      include: { farmerProfile: true, dealerProfile: true },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: "FARMER" },
        include: { farmerProfile: true, dealerProfile: true },
      });
    }

    res.json({
      success: true,
      user: {
        id: user?.id || "farmer-demo-1",
        name: user?.name || "Ramesh Kumar (Demo Farmer)",
        phone: user?.phone || "+91 9812345678",
        role: user?.role || "FARMER",
        district: user?.farmerProfile?.district || user?.dealerProfile?.district || "Cuttack",
      },
      token: "demo-jwt-token-agrinexus",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, role, district, shopName } = req.body;
    const userRole = role || "FARMER";
    const user = await prisma.user.create({
      data: {
        name,
        email: `user_${Date.now()}@agrinexus.ai`,
        phone: phone || "+91 9800000000",
        passwordHash: "demo_hash",
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

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        district: district || "Cuttack",
      },
      token: "demo-jwt-token-agrinexus",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
