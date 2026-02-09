import express, { Application } from "express";
import cors from "cors"
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { prisma } from "./lib/prisma";
import { categoryRouter } from "./modules/categories/category.router";
import { medicineRouter } from "./modules/medicines/medicne.router";
import { orderRouter } from "./modules/orders/order.router";
import { userRouter } from "./modules/users/user.router";
import { reviewRouter } from "./modules/reviews/review.router";

const app: Application = express();
app.use(cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/categories", categoryRouter);
app.use("/medicines", medicineRouter);
app.use("/orders", orderRouter);
app.use("/users", userRouter);
app.use("/reviews", reviewRouter);

app.post("/api/verify-email", async (req, res) => {
    try {
        const token = req.body.token;
        if (!token) return res.status(400).json({ error: "No token" });

        // Get email from JWT
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const email = payload.email;

        // Update user
        await prisma.user.update({
            where: { email },
            data: { emailVerified: true }
        });

        res.json({ success: true, message: "Email verified" });

    } catch (error) {
        res.status(500).json({ error: "Verification failed" });
    }
});

app.get('/', (req, res)=>{
    res.send("Server is running successfully")
})


export default app;