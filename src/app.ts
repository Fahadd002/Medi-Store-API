import express, { Application } from "express";
import cors from "cors"
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { categoryRouter } from "./modules/categories/category.router";
import { medicineRouter } from "./modules/medicines/medicne.router";
import { orderRouter } from "./modules/orders/order.router";
import { userRouter } from "./modules/users/user.router";
import { reviewRouter } from "./modules/reviews/review.router";
import { homeRouter } from "./modules/home/home.router";

const app: Application = express();

const allowedOrigins = [
  process.env.APP_URL || "https://medi-store-client-main.vercel.app",
  process.env.PROD_APP_URL, // Production frontend URL
  "http://localhost:3000",
  "http://localhost:5000",
].filter(Boolean); // Remove undefined values

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowedOrigins or matches Vercel preview pattern
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/next-blog-client.*\.vercel\.app$/.test(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin); // Any Vercel deployment

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  }),
);


app.use(express.json());

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use("/categories", categoryRouter);
app.use("/medicines", medicineRouter);
app.use("/orders", orderRouter);
app.use("/users", userRouter);
app.use("/reviews", reviewRouter);
app.use("/home", homeRouter);

app.get("/", (req, res) => {
  res.send("MediStore API is running successfully");
});

// For Vercel serverless
export default app;