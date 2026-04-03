import express from "express";
import axios from "axios";
import crypto from "crypto";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { verifyFirebaseToken, AuthRequest } from "../middleware/auth";
import { getAdminDb } from "../services/firebaseAdmin";

const router = express.Router();

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY;
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;
const INSTAMOJO_SALT = process.env.INSTAMOJO_SALT;
const INSTAMOJO_ENV = process.env.INSTAMOJO_ENV || "test";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const INSTAMOJO_BASE_URL = INSTAMOJO_ENV === "live" 
  ? "https://api.instamojo.com/api/1.1" 
  : "https://test.instamojo.com/api/1.1";

// POST /api/payment/create-order
router.post("/create-order", verifyFirebaseToken, async (req: AuthRequest, res) => {
  try {
    const { plan, demo } = req.body;
    const amount = plan === "pro" ? "99" : "49"; // ₹99 for Pro, ₹49 for Student
    const purpose = `PostAura ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;

    if (demo) {
      console.log(`[DEMO] Upgrading user ${req.user?.uid} to ${plan} plan`);
      const userRef = getAdminDb().collection("users").doc(req.user!.uid);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await userRef.update({
        isPro: true,
        planType: plan,
        planActivatedAt: FieldValue.serverTimestamp(),
        planExpiresAt: Timestamp.fromDate(expiresAt),
        instamojoPaymentId: "DEMO_PAYMENT_" + Math.random().toString(36).substring(7),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.json({ payment_url: `${FRONTEND_URL}/payment/success?demo=true` });
    }

    const payload = {
      purpose,
      amount,
      buyer_name: req.user?.uid, // Use uid as identifier
      email: req.user?.email,
      redirect_url: `${FRONTEND_URL}/payment/success`,
      webhook: `${process.env.BACKEND_URL}/api/payment/webhook`,
      allow_repeated_payments: false,
    };

    const response = await axios.post(`${INSTAMOJO_BASE_URL}/payment-requests/`, payload, {
      headers: {
        "X-Api-Key": INSTAMOJO_API_KEY,
        "X-Auth-Token": INSTAMOJO_AUTH_TOKEN,
      },
    });

    res.json({ payment_url: response.data.payment_request.longurl });
  } catch (error: any) {
    console.error("Instamojo order creation failed:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create payment request" });
  }
});

// POST /api/payment/webhook (NO auth middleware)
router.post("/webhook", async (req, res) => {
  try {
    const data = req.body;
    const mac = data.mac;
    delete data.mac;

    // Verify MAC
    const keys = Object.keys(data).sort();
    let str = "";
    for (const key of keys) {
      str += data[key] + "|";
    }
    str = str.slice(0, -1);

    const calculatedMac = crypto
      .createHmac("sha1", INSTAMOJO_SALT!)
      .update(str)
      .digest("hex");

    if (mac !== calculatedMac) {
      console.error("Webhook MAC verification failed");
      return res.status(200).send("MAC Mismatch"); // Always return 200 to Instamojo
    }

    if (data.status === "Credit") {
      const email = data.buyer_email;
      const paymentId = data.payment_id;
      const amount = parseFloat(data.amount);
      const plan = amount >= 90 ? "pro" : "student";

      // Find user by email in Firestore
      const usersRef = getAdminDb().collection("users");
      const snapshot = await usersRef.where("email", "==", email).get();

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await userDoc.ref.update({
          isPro: true,
          planType: plan,
          planActivatedAt: FieldValue.serverTimestamp(),
          planExpiresAt: Timestamp.fromDate(expiresAt),
          instamojoPaymentId: paymentId,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook processing failed:", error);
    res.status(200).send("Error but OK"); // Always return 200
  }
});

// GET /api/payment/status
router.get("/status", verifyFirebaseToken, async (req: AuthRequest, res) => {
  try {
    const userRef = getAdminDb().collection("users").doc(req.user!.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.json({ isPro: false, planType: "free", freeGenerationsUsed: 0 });
    }

    const userData = userDoc.data();
    res.json({
      isPro: userData?.isPro || false,
      planType: userData?.planType || "free",
      freeGenerationsUsed: userData?.freeGenerationsUsed || 0,
      planExpiresAt: userData?.planExpiresAt,
    });
  } catch (error) {
    console.error("Failed to fetch payment status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
