// src/app.ts
import express6 from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.3.0",
  "engineVersion": "9d6ad21cbbceab97458517b147a6a09ff43aa735",
  "activeProvider": "postgresql",
  "inlineSchema": 'enum Role {\n  CUSTOMER\n  SELLER\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  SUSPENDED\n  BANNED\n  INACTIVE\n}\n\nmodel User {\n  id            String  @id\n  name          String\n  email         String  @unique\n  emailVerified Boolean @default(false)\n  image         String?\n\n  // MediStore custom fields\n  role    Role       @default(CUSTOMER)\n  phone   String?\n  status  UserStatus @default(ACTIVE)\n  address String?\n\n  // BetterAuth relationships\n  sessions Session[]\n  accounts Account[]\n\n  // Relations\n  medicines       Medicine[] @relation("MedicineSeller")\n  customerOrders  Order[]    @relation("CustomerOrders")\n  sellerOrders    Order[]    @relation("SellerOrders")\n  customerReviews Review[]   @relation("CustomerReviews")\n  sellerReplies   Review[]   @relation("SellerReplies")\n\n  // Timestamps\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([email])\n  @@index([role])\n  @@index([status])\n  @@map("users")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String   @unique\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String?\n  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([token])\n  @@map("sessions")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("accounts")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verifications")\n}\n\nmodel Category {\n  id          String  @id @default(uuid())\n  name        String  @unique\n  description String?\n\n  medicines Medicine[]\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@map("categories")\n}\n\nmodel Medicine {\n  id              String    @id @default(uuid())\n  name            String\n  description     String\n  basePrice       Float\n  discountPercent Float?\n  stock           Int       @default(0)\n  manufacturer    String\n  expiryDate      DateTime?\n  isActive        Boolean   @default(false)\n  photoUrl        String?\n  unit            String?\n  categoryId      String\n  sellerId        String\n\n  category Category @relation(fields: [categoryId], references: [id])\n  seller   User     @relation("MedicineSeller", fields: [sellerId], references: [id])\n\n  orderItems OrderItem[]\n  reviews    Review[]\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([name])\n  @@index([categoryId])\n  @@index([sellerId])\n  @@map("medicines")\n}\n\nmodel OrderItem {\n  id         String @id @default(uuid())\n  orderId    String\n  medicineId String\n  quantity   Int\n  price      Float // price at purchase time\n\n  order    Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)\n  medicine Medicine @relation(fields: [medicineId], references: [id])\n\n  createdAt DateTime @default(now())\n\n  @@unique([orderId, medicineId])\n  @@index([orderId])\n  @@index([medicineId])\n  @@map("order_items")\n}\n\nenum OrderStatus {\n  PLACED\n  PROCESSING\n  SHIPPED\n  DELIVERED\n  CANCELLED\n}\n\nenum PaymentMethod {\n  CASH_ON_DELIVERY\n}\n\nmodel Order {\n  id          String @id @default(uuid())\n  orderNumber String @unique\n\n  customerId String\n  sellerId   String\n\n  totalAmount     Float\n  status          OrderStatus   @default(PLACED)\n  shippingAddress String\n  paymentMethod   PaymentMethod @default(CASH_ON_DELIVERY)\n\n  customer User @relation("CustomerOrders", fields: [customerId], references: [id])\n  seller   User @relation("SellerOrders", fields: [sellerId], references: [id])\n\n  items OrderItem[]\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  reviews   Review[]\n\n  @@index([customerId])\n  @@index([sellerId])\n  @@index([status])\n  @@map("orders")\n}\n\nmodel Review {\n  id String @id @default(uuid())\n\n  rating  Int?\n  comment String?\n\n  customerId String?\n  sellerId   String?\n  medicineId String\n  orderId    String?\n\n  parentId String?\n  parent   Review?  @relation("ReviewReplies", fields: [parentId], references: [id])\n  replies  Review[] @relation("ReviewReplies")\n\n  customer  User?    @relation("CustomerReviews", fields: [customerId], references: [id])\n  seller    User?    @relation("SellerReplies", fields: [sellerId], references: [id])\n  medicine  Medicine @relation(fields: [medicineId], references: [id])\n  order     Order?   @relation(fields: [orderId], references: [id])\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([medicineId])\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"phone","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"address","kind":"scalar","type":"String"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"MedicineSeller"},{"name":"customerOrders","kind":"object","type":"Order","relationName":"CustomerOrders"},{"name":"sellerOrders","kind":"object","type":"Order","relationName":"SellerOrders"},{"name":"customerReviews","kind":"object","type":"Review","relationName":"CustomerReviews"},{"name":"sellerReplies","kind":"object","type":"Review","relationName":"SellerReplies"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"users"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"sessions"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"accounts"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verifications"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"CategoryToMedicine"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"categories"},"Medicine":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"basePrice","kind":"scalar","type":"Float"},{"name":"discountPercent","kind":"scalar","type":"Float"},{"name":"stock","kind":"scalar","type":"Int"},{"name":"manufacturer","kind":"scalar","type":"String"},{"name":"expiryDate","kind":"scalar","type":"DateTime"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"photoUrl","kind":"scalar","type":"String"},{"name":"unit","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToMedicine"},{"name":"seller","kind":"object","type":"User","relationName":"MedicineSeller"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"MedicineToOrderItem"},{"name":"reviews","kind":"object","type":"Review","relationName":"MedicineToReview"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"medicines"},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"price","kind":"scalar","type":"Float"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToOrderItem"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"order_items"},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderNumber","kind":"scalar","type":"String"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"totalAmount","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"shippingAddress","kind":"scalar","type":"String"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"customer","kind":"object","type":"User","relationName":"CustomerOrders"},{"name":"seller","kind":"object","type":"User","relationName":"SellerOrders"},{"name":"items","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"reviews","kind":"object","type":"Review","relationName":"OrderToReview"}],"dbName":"orders"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"parentId","kind":"scalar","type":"String"},{"name":"parent","kind":"object","type":"Review","relationName":"ReviewReplies"},{"name":"replies","kind":"object","type":"Review","relationName":"ReviewReplies"},{"name":"customer","kind":"object","type":"User","relationName":"CustomerReviews"},{"name":"seller","kind":"object","type":"User","relationName":"SellerReplies"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToReview"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToReview"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null}},"enums":{},"types":{}}');
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// generated/prisma/internal/prismaNamespace.ts
import * as runtime2 from "@prisma/client/runtime/client";
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/enums.ts
var Role = {
  CUSTOMER: "CUSTOMER",
  SELLER: "SELLER",
  ADMIN: "ADMIN"
};
var UserStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
  INACTIVE: "INACTIVE"
};
var OrderStatus = {
  PLACED: "PLACED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED"
};
var PaymentMethod = {
  CASH_ON_DELIVERY: "CASH_ON_DELIVERY"
};

// generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
import nodemailer from "nodemailer";
var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASS
  }
});
var auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  database: prismaAdapter(prisma, {
    provider: "postgresql"
    // or "mysql", "postgresql", ...etc
  }),
  trustedOrigins: async (request) => {
    const origin = request?.headers.get("origin");
    const allowedOrigins2 = [
      process.env.APP_URL,
      process.env.BETTER_AUTH_URL,
      "http://localhost:3000",
      "http://localhost:5000",
      "https://medi-store-api-main.vercel.app",
      "https://medi-store-client-main.vercel.app"
    ].filter(Boolean);
    if (!origin || allowedOrigins2.includes(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin)) {
      return [origin];
    }
    return [];
  },
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  user: {
    additionalFields: {
      role: {
        type: "string",
        default: "CUSTOMER",
        required: true,
        input: true,
        validate: (value) => {
          if (value && !["CUSTOMER", "SELLER"].includes(value)) {
            throw new Error("Role must be either CUSTOMER or SELLER");
          }
          return value;
        }
      },
      phone: {
        type: "string",
        required: false
      },
      status: {
        type: "string",
        default: "ACTIVE",
        required: false
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      try {
        const verificationURL = `${process.env.APP_URL}/verify-email?token=${token}`;
        const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Verify Your Email - MediStore</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #f4f6f8;
              font-family: Arial, Helvetica, sans-serif;
            }
            .container {
              max-width: 520px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 8px 24px rgba(0,0,0,0.08);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #10b981, #059669);
              padding: 24px;
              color: #ffffff;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 600;
            }
            .content {
              padding: 28px;
              color: #374151;
              line-height: 1.6;
            }
            .content p {
              margin: 0 0 16px;
            }
            .button {
              display: inline-block;
              margin: 24px 0;
              padding: 14px 28px;
              background-color: #10b981;
              color: #ffffff !important;
              text-decoration: none;
              font-weight: 600;
              border-radius: 8px;
            }
            .footer {
              padding: 20px;
              background-color: #f9fafb;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
            .link {
              word-break: break-all;
              color: #10b981;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email - MediStore</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${user.name || "there"}</strong>,</p>
              <p>
                Thanks for signing up for <strong>MediStore</strong> - Your Trusted Online Medicine Shop.
                Please confirm your email address by clicking the button below:
              </p>
              <p style="text-align:center;">
                <a href="${verificationURL}" class="button">
                  Verify Email Address
                </a>
              </p>
              <p>If the button doesn't work, copy and paste this link:</p>
              <p class="link">${verificationURL}</p>
              <p>
                If you didn't create this account, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} MediStore - Your Trusted Online Medicine Shop
            </div>
          </div>
        </body>
        </html>
      `;
        await transporter.sendMail({
          from: `"MediStore" <${process.env.APP_USER}>`,
          to: user.email,
          subject: "Verify your email address - MediStore",
          html: htmlTemplate
        });
        console.log(`Verification email sent to ${user.email}`);
      } catch (error) {
        console.error("Email verification failed:", error);
        throw error;
      }
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
      // 5 minutes
    }
  },
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false
    },
    disableCSRFCheck: true
    // Allow requests without Origin header (Postman, mobile apps, etc.)
  }
});

// src/modules/categories/category.router.ts
import express from "express";

// src/middlewares/auth.ts
var UserRole = /* @__PURE__ */ ((UserRole2) => {
  UserRole2["CUSTOMER"] = "CUSTOMER";
  UserRole2["SELLER"] = "SELLER";
  UserRole2["ADMIN"] = "ADMIN";
  return UserRole2;
})(UserRole || {});
var auth2 = (...roles) => {
  return async (req, res, next) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers
      });
      console.log("Session in auth middleware:", session);
      if (!session) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized!"
        });
      }
      if (!session.user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "Email verification required. Please verfiy your email!"
        });
      }
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: session.user.emailVerified
      };
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You don't have permission to access this resources!"
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
var auth_default = auth2;

// src/modules/categories/category.service.ts
var createCategory = async (data) => {
  const result = await prisma.category.create({
    data
  });
  return result;
};
var getAllCategories = async ({
  search,
  page,
  limit,
  skip,
  sortBy,
  sortOrder
}) => {
  const andConditions = [];
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  const prismaSortOrder = sortOrder === "asc" ? "asc" : "desc";
  const categories = await prisma.category.findMany({
    take: limit,
    skip,
    where: { AND: andConditions },
    orderBy: {
      [sortBy]: prismaSortOrder
    },
    include: {
      _count: {
        select: { medicines: true }
      }
    }
  });
  const total = await prisma.category.count({
    where: {
      AND: andConditions
    }
  });
  return {
    data: categories,
    pagination: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit)
    }
  };
};
var getCategoryById = async (id) => {
  return await prisma.category.findUniqueOrThrow({
    where: { id },
    include: {
      medicines: {
        where: {
          isActive: true
        },
        select: {
          id: true,
          name: true,
          stock: true
        }
      }
    }
  });
};
var updateCategory = async (id, data) => {
  await prisma.category.findUniqueOrThrow({
    where: { id }
  });
  const result = await prisma.category.update({
    where: { id },
    data
  });
  return result;
};
var deleteCategory = async (id) => {
  const category = await prisma.category.findUniqueOrThrow({
    where: { id },
    include: {
      _count: {
        select: {
          medicines: true
        }
      }
    }
  });
  if (category._count.medicines > 0) {
    throw new Error("Cannot delete category with existing medicines");
  }
  return await prisma.category.delete({
    where: { id }
  });
};
var getCategoryStats = async () => {
  return await prisma.$transaction(async (tx) => {
    const [totalCategories, totalMedicines] = await Promise.all([
      tx.category.count(),
      tx.medicine.count()
    ]);
    return {
      totalCategories,
      totalMedicines
    };
  });
};
var dropDownCategories = async () => {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
  return categories.map((category) => ({
    value: category.id,
    label: category.name
  }));
};
var categoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  dropDownCategories
};

// src/helpers/paginationSortingHelper.ts
var pageinationSortingHelper = (options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder || "desc";
  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder
  };
};
var paginationSortingHelper_default = pageinationSortingHelper;

// src/modules/categories/category.controller.ts
var createCategory2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || user.role !== "ADMIN" /* ADMIN */) {
      return res.status(403).json({
        error: "Only admin can create category"
      });
    }
    const result = await categoryService.createCategory(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};
var getAllCategories2 = async (req, res, next) => {
  try {
    const { search } = req.query;
    const searchString = typeof search === "string" ? search : void 0;
    const { page, limit, skip, sortBy, sortOrder } = paginationSortingHelper_default(req.query);
    const result = await categoryService.getAllCategories({ search: searchString, page, limit, skip, sortBy, sortOrder });
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var getCategoryById2 = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    if (!categoryId) {
      throw new Error("Category id is required");
    }
    const result = await categoryService.getCategoryById(categoryId);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var updateCategory2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || user.role !== "ADMIN" /* ADMIN */) {
      throw new Error("You are not authorized");
    }
    const { categoryId } = req.params;
    const result = await categoryService.updateCategory(categoryId, req.body);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var deleteCategory2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || user.role !== "ADMIN" /* ADMIN */) {
      throw new Error("You are not authorized");
    }
    const { categoryId } = req.params;
    const result = await categoryService.deleteCategory(categoryId);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var getCategoryStats2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || user.role !== "ADMIN" /* ADMIN */) {
      throw new Error("You are not authorized");
    }
    const result = await categoryService.getCategoryStats();
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var getDropDownCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.dropDownCategories();
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};
var CategoryController = {
  createCategory: createCategory2,
  getAllCategories: getAllCategories2,
  getCategoryById: getCategoryById2,
  updateCategory: updateCategory2,
  deleteCategory: deleteCategory2,
  getCategoryStats: getCategoryStats2,
  getDropDownCategories
};

// src/modules/categories/category.router.ts
var router = express.Router();
router.get("/", CategoryController.getAllCategories);
router.get("/dropdown", CategoryController.getDropDownCategories);
router.get("/:categoryId", auth_default("ADMIN" /* ADMIN */), CategoryController.getCategoryById);
router.post("/", auth_default("ADMIN" /* ADMIN */), CategoryController.createCategory);
router.patch("/:categoryId", auth_default("ADMIN" /* ADMIN */), CategoryController.updateCategory);
router.delete("/:categoryId", auth_default("ADMIN" /* ADMIN */), CategoryController.deleteCategory);
var categoryRouter = router;

// src/modules/medicines/medicne.router.ts
import express2 from "express";

// src/modules/medicines/medicne.service.ts
var addMedicine = async (data, userId) => {
  return await prisma.medicine.create({
    data: {
      ...data,
      sellerId: userId
    }
  });
};
var getAllMedicines = async ({
  search,
  categoryId,
  sellerId,
  page,
  limit,
  skip,
  sortBy,
  sortOrder,
  isActive
}) => {
  const andConditions = [];
  if (isActive === true) {
    andConditions.push({ isActive: true });
  }
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  if (sellerId) {
    andConditions.push({ sellerId });
  }
  if (categoryId) {
    andConditions.push({ categoryId });
  }
  const [data, total] = await Promise.all([
    prisma.medicine.findMany({
      take: limit,
      skip,
      where: { AND: andConditions },
      orderBy: {
        [sortBy]: sortOrder === "asc" ? "asc" : "desc"
      },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true }
        },
        _count: {
          select: { reviews: true }
        }
      }
    }),
    prisma.medicine.count({
      where: { AND: andConditions }
    })
  ]);
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit)
    }
  };
};
var getMyAddedMedicines = async ({
  search,
  categoryId,
  sellerId,
  page,
  limit,
  skip,
  sortBy,
  sortOrder
}) => {
  const andConditions = [];
  andConditions.push({ sellerId });
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  if (categoryId) {
    andConditions.push({ categoryId });
  }
  const [data, total] = await Promise.all([
    prisma.medicine.findMany({
      take: limit,
      skip,
      where: { AND: andConditions },
      orderBy: {
        [sortBy]: sortOrder === "asc" ? "asc" : "desc"
      },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true }
        },
        _count: {
          select: { reviews: true }
        }
      }
    }),
    prisma.medicine.count({
      where: { AND: andConditions }
    })
  ]);
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit)
    }
  };
};
var getMedicineById = async (medicineId) => {
  try {
    const medicine = await prisma.medicine.findUniqueOrThrow({
      where: { id: medicineId },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true
          }
        },
        reviews: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      }
    });
    const averageRating = medicine.reviews.length > 0 ? medicine.reviews.reduce((sum, review) => sum + (review?.rating || 0), 0) / medicine.reviews.length : 0;
    const ratingDistribution = {
      5: medicine.reviews.filter((r) => r.rating === 5).length,
      4: medicine.reviews.filter((r) => r.rating === 4).length,
      3: medicine.reviews.filter((r) => r.rating === 3).length,
      2: medicine.reviews.filter((r) => r.rating === 2).length,
      1: medicine.reviews.filter((r) => r.rating === 1).length
    };
    return {
      success: true,
      data: {
        ...medicine,
        averageRating,
        ratingDistribution
      }
    };
  } catch (error) {
    console.error("Error fetching medicine details:", error);
    return {
      success: false,
      error: "Failed to fetch medicine details"
    };
  }
};
var updateMedicine = async (medicineId, data, sellerId, isAdmin) => {
  const medicine = await prisma.medicine.findUniqueOrThrow({
    where: { id: medicineId },
    select: { sellerId: true }
  });
  if (!isAdmin && medicine.sellerId !== sellerId) {
    throw new Error("You are not owner of this medicine");
  }
  return await prisma.medicine.update({
    where: { id: medicineId },
    data
  });
};
var deleteMedicine = async (medicineId, sellerId, isAdmin) => {
  const medicine = await prisma.medicine.findUniqueOrThrow({
    where: { id: medicineId },
    select: { sellerId: true }
  });
  if (!isAdmin && medicine.sellerId !== sellerId) {
    throw new Error("You are not owner of this medicine");
  }
  return await prisma.medicine.delete({
    where: { id: medicineId }
  });
};
var medicineService = {
  addMedicine,
  getAllMedicines,
  getMyAddedMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine
};

// src/modules/medicines/medicne.controller.ts
var addMedicine2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        error: "Unauthorized!"
      });
    }
    const medicineData = {
      ...req.body,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null
    };
    const result = await medicineService.addMedicine(medicineData, user.id);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};
var getAllMedicines2 = async (req, res, next) => {
  try {
    const { search, categoryId, sellerId, isActive } = req.query;
    const searchString = typeof search === "string" ? search : void 0;
    const category = typeof categoryId === "string" ? categoryId : void 0;
    const seller = typeof sellerId === "string" ? sellerId : void 0;
    const isActiveValue = typeof isActive === "string" ? isActive === "true" ? true : isActive === "false" ? false : void 0 : void 0;
    const { page, limit, skip, sortBy, sortOrder } = paginationSortingHelper_default(req.query);
    const result = await medicineService.getAllMedicines({
      search: searchString,
      categoryId: category,
      sellerId: seller,
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      isActive: isActiveValue
    });
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var updateMedicine2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("You are not authorized");
    }
    const isAdmin = user.role === "ADMIN" /* ADMIN */;
    const { medicineId } = req.params;
    const updateData = { ...req.body };
    if (updateData.expiryDate) {
      updateData.expiryDate = new Date(updateData.expiryDate);
    }
    const result = await medicineService.updateMedicine(
      medicineId,
      updateData,
      user.id,
      isAdmin
    );
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var getMedicineById2 = async (req, res, next) => {
  try {
    const { medicineId } = req.params;
    if (!medicineId) {
      throw new Error("Medicine Id required");
    }
    const result = await medicineService.getMedicineById(medicineId);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var getMyAddedMedicines2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("Unauthorized!");
    }
    const { search, categoryId } = req.query;
    const searchString = typeof search === "string" ? search : void 0;
    const category = typeof categoryId === "string" ? categoryId : void 0;
    const { page, limit, skip, sortBy, sortOrder } = paginationSortingHelper_default(req.query);
    const result = await medicineService.getMyAddedMedicines({
      search: searchString,
      categoryId: category,
      sellerId: user.id,
      page,
      limit,
      skip,
      sortBy,
      sortOrder
    });
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var deleteMedicine2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("You are not authorized");
    }
    const isAdmin = user.role === "ADMIN" /* ADMIN */;
    const { medicineId } = req.params;
    const result = await medicineService.deleteMedicine(
      medicineId,
      user.id,
      isAdmin
    );
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var MedicineController = {
  addMedicine: addMedicine2,
  getAllMedicines: getAllMedicines2,
  getMedicineById: getMedicineById2,
  getMyAddedMedicines: getMyAddedMedicines2,
  updateMedicine: updateMedicine2,
  deleteMedicine: deleteMedicine2
};

// src/modules/medicines/medicne.router.ts
var router2 = express2.Router();
router2.get("/", MedicineController.getAllMedicines);
router2.get("/myMedicines", auth_default("SELLER" /* SELLER */), MedicineController.getMyAddedMedicines);
router2.get("/:medicineId", MedicineController.getMedicineById);
router2.post("/", auth_default("SELLER" /* SELLER */, "ADMIN" /* ADMIN */), MedicineController.addMedicine);
router2.patch("/:medicineId", auth_default("SELLER" /* SELLER */, "ADMIN" /* ADMIN */), MedicineController.updateMedicine);
router2.delete("/:medicineId", auth_default("SELLER" /* SELLER */, "ADMIN" /* ADMIN */), MedicineController.deleteMedicine);
var medicineRouter = router2;

// src/modules/orders/order.router.ts
import express3 from "express";

// src/modules/orders/order.service.ts
var createOrder = async (customerId, payload) => {
  const totalAmount = payload.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId,
        sellerId: payload.sellerId,
        shippingAddress: payload.shippingAddress,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        totalAmount,
        status: OrderStatus.PLACED
      }
    });
    const orderItems = [];
    for (const item of payload.items) {
      const medicine = await tx.medicine.findFirst({
        where: {
          id: item.medicineId,
          sellerId: payload.sellerId,
          isActive: true
        }
      });
      if (!medicine) {
        throw new Error(`Medicine ${item.medicineId} not found or not available from this seller`);
      }
      if (medicine.stock !== null && medicine.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${item.quantity}`);
      }
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          medicineId: item.medicineId,
          quantity: item.quantity,
          price: item.price
        }
      });
      if (medicine.stock !== null) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: {
            stock: medicine.stock - item.quantity
          }
        });
      }
      orderItems.push(orderItem);
    }
    return {
      ...order,
      items: orderItems
    };
  });
  return result;
};
var getMyOrders = async (customerId) => {
  return prisma.order.findMany({
    where: { customerId },
    include: {
      items: {
        include: { medicine: true }
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};
var getOrderById = async (orderId, userId) => {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { customerId: userId },
        { sellerId: userId }
      ]
    },
    include: {
      items: {
        include: {
          medicine: {
            include: {
              reviews: {
                include: {
                  customer: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  },
                  seller: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                },
                orderBy: {
                  createdAt: "desc"
                }
              }
            }
          }
        }
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};
var cancelOrder = async (orderId, userId) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { customerId: userId },
        { sellerId: userId }
      ]
    }
  });
  if (!order) {
    throw new Error("Order not found or unauthorized");
  }
  if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
    throw new Error("Order cannot be cancelled as it's already shipped or delivered");
  }
  return await prisma.$transaction(async (tx) => {
    const orderItems = await tx.orderItem.findMany({
      where: { orderId },
      include: { medicine: true }
    });
    for (const item of orderItems) {
      if (item.medicine.stock !== null) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: {
            stock: item.medicine.stock + item.quantity
          }
        });
      }
    }
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED }
    });
    return updatedOrder;
  });
};
var getSellerOrders = async (sellerId) => {
  return prisma.order.findMany({
    where: { sellerId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      items: {
        include: { medicine: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};
var updateOrderStatus = async (orderId, sellerId, status) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      sellerId,
      status: {
        not: OrderStatus.CANCELLED
        // Cannot update cancelled orders
      }
    }
  });
  if (!order) {
    throw new Error("Order not found or unauthorized");
  }
  const validTransitions = {
    [OrderStatus.PLACED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: []
  };
  if (!validTransitions[order.status].includes(status)) {
    throw new Error(`Invalid status transition from ${order.status} to ${status}`);
  }
  return prisma.order.update({
    where: { id: orderId },
    data: { status }
  });
};
var orderService = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  updateOrderStatus
};

// src/modules/orders/order.controller.ts
var createOrder2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");
    const result = await orderService.createOrder(user.id, req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};
var getMyOrders2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");
    const result = await orderService.getMyOrders(user.id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var getOrderById2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");
    const { orderId } = req.params;
    const result = await orderService.getOrderById(orderId, user.id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var cancelOrder2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");
    const { orderId } = req.params;
    const result = await orderService.cancelOrder(orderId, user.id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var getSellerOrders2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");
    const result = await orderService.getSellerOrders(user.id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var updateOrderStatus2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");
    const { orderId } = req.params;
    const { status } = req.body;
    const result = await orderService.updateOrderStatus(
      orderId,
      user.id,
      status
    );
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
var OrderController = {
  createOrder: createOrder2,
  getMyOrders: getMyOrders2,
  getOrderById: getOrderById2,
  cancelOrder: cancelOrder2,
  getSellerOrders: getSellerOrders2,
  updateOrderStatus: updateOrderStatus2
};

// src/modules/orders/order.router.ts
var router3 = express3.Router();
router3.post("/", auth_default("CUSTOMER" /* CUSTOMER */, "ADMIN" /* ADMIN */, "SELLER" /* SELLER */), OrderController.createOrder);
router3.get("/my-orders", auth_default("CUSTOMER" /* CUSTOMER */, "ADMIN" /* ADMIN */, "SELLER" /* SELLER */), OrderController.getMyOrders);
router3.get("/:orderId", auth_default("CUSTOMER" /* CUSTOMER */, "ADMIN" /* ADMIN */, "SELLER" /* SELLER */), OrderController.getOrderById);
router3.patch("/:orderId/cancel", auth_default("CUSTOMER" /* CUSTOMER */, "ADMIN" /* ADMIN */, "SELLER" /* SELLER */), OrderController.cancelOrder);
router3.get("/seller/orders", auth_default("ADMIN" /* ADMIN */, "SELLER" /* SELLER */), OrderController.getSellerOrders);
router3.patch("/seller/orders/:orderId/status", auth_default("CUSTOMER" /* CUSTOMER */, "ADMIN" /* ADMIN */, "SELLER" /* SELLER */), OrderController.updateOrderStatus);
var orderRouter = router3;

// src/modules/users/user.router.ts
import express4 from "express";

// src/modules/users/user.service.ts
var getAllUsers = async ({
  search,
  role,
  status,
  page,
  limit,
  skip,
  sortBy,
  sortOrder
}) => {
  const andConditions = [];
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  if (role) {
    andConditions.push({ role });
  }
  if (status) {
    andConditions.push({ status });
  }
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      take: limit,
      skip,
      where: { AND: andConditions },
      orderBy: {
        [sortBy]: sortOrder === "asc" ? "asc" : "desc"
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        address: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.user.count({
      where: { AND: andConditions }
    })
  ]);
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit)
    }
  };
};
var dropDownSeller = async ({ search, role }) => {
  const andConditions = [];
  andConditions.push({ role });
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  const users = await prisma.user.findMany({
    where: { AND: andConditions },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
  return users.map((users2) => ({
    value: users2.id,
    label: users2.name
  }));
};
var getMyProfile = async (userId) => {
  return await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      address: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true
    }
  });
};
var getUserById = async (userId) => {
  return await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      address: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true
    }
  });
};
var updateUser = async (userId, data, requestingUserId, isAdmin) => {
  if (!isAdmin && userId !== requestingUserId) {
    throw new Error("You are not authorized to update this user");
  }
  if (!isAdmin) {
    const allowedFields = ["name", "phone", "address", "image"];
    const disallowedFields = Object.keys(data).filter(
      (key) => !allowedFields.includes(key)
    );
    if (disallowedFields.length > 0) {
      throw new Error(`You cannot update: ${disallowedFields.join(", ")}`);
    }
  }
  return await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      address: true,
      emailVerified: true,
      image: true,
      updatedAt: true
    }
  });
};
var updateUserStatus = async (userId, status, isAdmin) => {
  if (!isAdmin) {
    throw new Error("Only admin can update user status");
  }
  return await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      updatedAt: true
    }
  });
};
var updateUserRole = async (userId, role, isAdmin) => {
  if (!isAdmin) {
    throw new Error("Only admin can update user role");
  }
  return await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      updatedAt: true
    }
  });
};
var deleteUser = async (userId, isAdmin) => {
  if (!isAdmin) {
    throw new Error("Only admin can delete users");
  }
  return await prisma.user.delete({
    where: { id: userId }
  });
};
var getUserStatistics = async (isAdmin) => {
  if (!isAdmin) {
    throw new Error("Only admin can view statistics");
  }
  const [
    totalUsers,
    totalCustomers,
    totalSellers,
    totalAdmins,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    inactiveUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.user.count({ where: { role: Role.SELLER } }),
    prisma.user.count({ where: { role: Role.ADMIN } }),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
    prisma.user.count({ where: { status: UserStatus.BANNED } }),
    prisma.user.count({ where: { status: UserStatus.INACTIVE } })
  ]);
  return {
    total: totalUsers,
    customers: totalCustomers,
    sellers: totalSellers,
    admins: totalAdmins,
    active: activeUsers,
    suspended: suspendedUsers,
    banned: bannedUsers,
    inactive: inactiveUsers
  };
};
var updateUserProfile = async (userId, data, headers) => {
  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new Error("Current password is required");
    }
    try {
      await auth.api.changePassword({
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        },
        headers
      });
    } catch (error) {
      throw new Error(error.message || "Failed to change password");
    }
  }
  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.phone) updateData.phone = data.phone;
  if (data.image) updateData.image = data.image;
  if (Object.keys(updateData).length > 0) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });
    return {
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    };
  }
  return {
    success: true,
    message: data.newPassword ? "Password changed successfully" : "No changes made",
    data: null
  };
};
var userService = {
  getAllUsers,
  getMyProfile,
  getUserById,
  updateUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserStatistics,
  dropDownSeller,
  updateUserProfile
};

// src/modules/users/user.controller.ts
var getAllUsers2 = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const isAdmin = req.user?.role === "ADMIN" /* ADMIN */;
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admin can view all users"
      });
    }
    const searchString = typeof search === "string" ? search : void 0;
    const roleParam = role;
    const statusParam = status;
    const { page, limit, skip, sortBy, sortOrder } = paginationSortingHelper_default(req.query);
    const result = await userService.getAllUsers({
      search: searchString,
      role: roleParam,
      status: statusParam,
      page,
      limit,
      skip,
      sortBy,
      sortOrder
    });
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result.data,
      meta: result.pagination
    });
  } catch (error) {
    next(error);
  }
};
var getMyProfile2 = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    const result = await userService.getMyProfile(userId);
    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getUserById2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN" /* ADMIN */;
    if (!isAdmin && id !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own profile"
      });
    }
    const result = await userService.getUserById(id);
    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateUser2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, address, image } = req.body;
    const requestingUserId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN" /* ADMIN */;
    if (!name && !phone && !address && !image) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required for update"
      });
    }
    const updateData = {};
    if (name !== void 0) updateData.name = name;
    if (phone !== void 0) updateData.phone = phone;
    if (address !== void 0) updateData.address = address;
    if (image !== void 0) updateData.image = image;
    const result = await userService.updateUser(
      id,
      updateData,
      requestingUserId,
      isAdmin
    );
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateUserStatus2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const isAdmin = req.user?.role === "ADMIN" /* ADMIN */;
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admin can update user status"
      });
    }
    if (!status || !Object.values(UserStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required"
      });
    }
    const result = await userService.updateUserStatus(id, status, isAdmin);
    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateUserRole2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const isAdmin = req.user?.role === "ADMIN" /* ADMIN */;
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admin can update user role"
      });
    }
    if (!role || !Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Valid role is required"
      });
    }
    const result = await userService.updateUserRole(id, role, isAdmin);
    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteUser2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === "ADMIN" /* ADMIN */;
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete users"
      });
    }
    await userService.deleteUser(id, isAdmin);
    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var getDropDownSeller = async (req, res, next) => {
  try {
    const { search } = req.query;
    const searchString = typeof search === "string" ? search : void 0;
    const role = "SELLER" /* SELLER */;
    const result = await userService.dropDownSeller({ search: searchString, role });
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getUserStatistics2 = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === "ADMIN" /* ADMIN */;
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admin can view statistics"
      });
    }
    const result = await userService.getUserStatistics(isAdmin);
    res.status(200).json({
      success: true,
      message: "Statistics fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, image, currentPassword, newPassword } = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    if (user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile"
      });
    }
    const result = await userService.updateUserProfile(
      userId,
      {
        name,
        phone,
        image,
        currentPassword,
        newPassword
      },
      req.headers
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update profile"
    });
  }
};
var userController = {
  getAllUsers: getAllUsers2,
  getMyProfile: getMyProfile2,
  getUserById: getUserById2,
  updateUser: updateUser2,
  updateUserStatus: updateUserStatus2,
  updateUserRole: updateUserRole2,
  deleteUser: deleteUser2,
  getUserStatistics: getUserStatistics2,
  getDropDownSeller,
  updateProfile
};

// src/modules/users/user.router.ts
var router4 = express4.Router();
router4.get("/seller-dropdown", userController.getDropDownSeller);
router4.get("/profile", auth_default(), userController.getMyProfile);
router4.get("/stats", auth_default("ADMIN" /* ADMIN */), userController.getUserStatistics);
router4.get("/", auth_default("ADMIN" /* ADMIN */), userController.getAllUsers);
router4.get("/:id", auth_default(), userController.getUserById);
router4.patch("/:id", auth_default(), userController.updateUser);
router4.patch("/:id/status", auth_default("ADMIN" /* ADMIN */), userController.updateUserStatus);
router4.patch("/:id/role", auth_default("ADMIN" /* ADMIN */), userController.updateUserRole);
router4.patch("/:userId/profile", auth_default("ADMIN" /* ADMIN */, "CUSTOMER" /* CUSTOMER */, "SELLER" /* SELLER */), userController.updateProfile);
router4.delete("/:id", auth_default("ADMIN" /* ADMIN */), userController.deleteUser);
var userRouter = router4;

// src/modules/reviews/review.router.ts
import { Router as Router5 } from "express";

// src/modules/reviews/review.service.ts
var createReview = async (payload) => {
  const exists = await prisma.review.findFirst({
    where: {
      customerId: payload.customerId,
      medicineId: payload.medicineId,
      parentId: null
    }
  });
  if (exists) {
    throw new Error("You already reviewed this medicine");
  }
  if (payload.orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: payload.orderId,
        customerId: payload.customerId,
        status: "DELIVERED",
        items: {
          some: {
            medicineId: payload.medicineId
          }
        }
      }
    });
    if (!order) {
      throw new Error("Invalid order or medicine not found in order");
    }
  }
  const baseData = {
    rating: payload.rating,
    customerId: payload.customerId,
    medicineId: payload.medicineId
  };
  return prisma.review.create({
    data: {
      ...baseData,
      ...payload.comment ? { comment: payload.comment } : {},
      ...payload.orderId ? { orderId: payload.orderId } : {}
    },
    include: {
      customer: {
        select: { id: true, name: true, image: true }
      },
      replies: {
        include: {
          seller: {
            select: { id: true, name: true, image: true }
          }
        }
      }
    }
  });
};
var replyToReview = async (payload) => {
  const parentReview = await prisma.review.findUniqueOrThrow({
    where: { id: payload.parentId },
    include: { medicine: true }
  });
  if (parentReview.medicine.sellerId !== payload.sellerId) {
    throw new Error("You are not allowed to reply to this review");
  }
  return prisma.review.create({
    data: {
      comment: payload.comment,
      sellerId: payload.sellerId,
      parentId: payload.parentId,
      medicineId: parentReview.medicineId
    },
    include: {
      seller: {
        select: { id: true, name: true, image: true }
      }
    }
  });
};
var getReviewsByMedicine = async (medicineId) => {
  return prisma.review.findMany({
    where: {
      medicineId,
      parentId: null
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true, image: true }
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          seller: {
            select: { id: true, name: true, image: true }
          }
        }
      }
    }
  });
};
var deleteReview = async (reviewId, userId, isAdmin) => {
  const review = await prisma.review.findUniqueOrThrow({
    where: { id: reviewId }
  });
  if (!isAdmin && review.customerId !== userId && review.sellerId !== userId) {
    throw new Error("Unauthorized");
  }
  return prisma.review.delete({
    where: { id: reviewId }
  });
};
var getMyReviews = async (customerId) => {
  return prisma.review.findMany({
    where: {
      customerId,
      parentId: null
    },
    orderBy: { createdAt: "desc" },
    include: {
      medicine: {
        select: {
          id: true,
          name: true
        }
      },
      replies: {
        include: {
          seller: {
            select: { id: true, name: true, image: true }
          }
        }
      }
    }
  });
};
var getReviewsToReply = async (sellerId) => {
  const sellerMedicines = await prisma.medicine.findMany({
    where: { sellerId },
    select: { id: true }
  });
  const medicineIds = sellerMedicines.map((medicine) => medicine.id);
  return prisma.review.findMany({
    where: {
      medicineId: { in: medicineIds },
      parentId: null,
      replies: {
        none: {
          sellerId
        }
      }
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true, image: true }
      },
      medicine: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
};
var getReviewStats = async (medicineId) => {
  const reviews = await prisma.review.findMany({
    where: {
      medicineId,
      parentId: null,
      rating: { not: null }
    },
    select: {
      rating: true
    }
  });
  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      }
    };
  }
  const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  const averageRating = totalRating / totalReviews;
  const ratingDistribution = {
    1: reviews.filter((r) => r.rating === 1).length,
    2: reviews.filter((r) => r.rating === 2).length,
    3: reviews.filter((r) => r.rating === 3).length,
    4: reviews.filter((r) => r.rating === 4).length,
    5: reviews.filter((r) => r.rating === 5).length
  };
  return {
    averageRating: parseFloat(averageRating.toFixed(1)),
    totalReviews,
    ratingDistribution
  };
};
var checkReviewEligibility = async (payload) => {
  const order = await prisma.order.findFirst({
    where: {
      id: payload.orderId,
      customerId: payload.customerId,
      status: "DELIVERED"
    },
    include: {
      items: {
        where: {
          medicineId: payload.medicineId
        }
      }
    }
  });
  if (!order) {
    throw new Error("Order not found or not eligible for review");
  }
  if (order.items.length === 0) {
    throw new Error("Medicine not found in this order");
  }
  const existingReview = await prisma.review.findFirst({
    where: {
      customerId: payload.customerId,
      medicineId: payload.medicineId,
      parentId: null
    }
  });
  return {
    eligible: !existingReview,
    alreadyReviewed: !!existingReview,
    existingReview: existingReview ? {
      id: existingReview.id,
      rating: existingReview.rating,
      comment: existingReview.comment,
      createdAt: existingReview.createdAt
    } : null
  };
};
var reviewService = {
  createReview,
  replyToReview,
  getReviewsByMedicine,
  deleteReview,
  getMyReviews,
  getReviewsToReply,
  getReviewStats,
  checkReviewEligibility
};

// src/modules/reviews/review.controller.ts
var createReview2 = async (req, res) => {
  try {
    const result = await reviewService.createReview({
      rating: req.body.rating,
      comment: req.body.comment,
      medicineId: req.body.medicineId,
      customerId: req.user?.id,
      orderId: req.body.orderId
      // Add orderId from request body
    });
    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create review"
    });
  }
};
var replyToReview2 = async (req, res) => {
  try {
    const result = await reviewService.replyToReview({
      parentId: req.params?.reviewId,
      comment: req.body.comment,
      sellerId: req.user?.id
    });
    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reply to review"
    });
  }
};
var getReviewsByMedicine2 = async (req, res) => {
  try {
    const result = await reviewService.getReviewsByMedicine(
      req.params?.medicineId
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch reviews"
    });
  }
};
var deleteReview2 = async (req, res) => {
  try {
    await reviewService.deleteReview(
      req.params.reviewId,
      req.user?.id,
      req.user?.role === "ADMIN" /* ADMIN */
    );
    res.json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete review"
    });
  }
};
var getMyReviews2 = async (req, res) => {
  try {
    const result = await reviewService.getMyReviews(
      req.user?.id
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch your reviews"
    });
  }
};
var getReviewsToReply2 = async (req, res) => {
  try {
    const result = await reviewService.getReviewsToReply(
      req.user?.id
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch reviews to reply"
    });
  }
};
var getReviewStats2 = async (req, res) => {
  try {
    const result = await reviewService.getReviewStats(
      req.params.medicineId
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch review statistics"
    });
  }
};
var checkReviewEligibility2 = async (req, res) => {
  try {
    const params = req.params;
    const { orderId, medicineId } = params;
    const customerId = req.user?.id;
    if (!orderId || !medicineId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and Medicine ID are required"
      });
    }
    const result = await reviewService.checkReviewEligibility({
      orderId,
      medicineId,
      customerId
    });
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to check review eligibility"
    });
  }
};
var reviewController = {
  createReview: createReview2,
  replyToReview: replyToReview2,
  getReviewsByMedicine: getReviewsByMedicine2,
  deleteReview: deleteReview2,
  getMyReviews: getMyReviews2,
  getReviewsToReply: getReviewsToReply2,
  getReviewStats: getReviewStats2,
  checkReviewEligibility: checkReviewEligibility2
};

// src/modules/reviews/review.router.ts
var router5 = Router5();
router5.post("/", auth_default("CUSTOMER" /* CUSTOMER */), reviewController.createReview);
router5.post("/:reviewId/reply", auth_default("SELLER" /* SELLER */), reviewController.replyToReview);
router5.get("/medicine/:medicineId", reviewController.getReviewsByMedicine);
router5.delete("/:reviewId", auth_default("ADMIN" /* ADMIN */, "CUSTOMER" /* CUSTOMER */, "SELLER" /* SELLER */), reviewController.deleteReview);
router5.get("/my-reviews", auth_default("CUSTOMER" /* CUSTOMER */), reviewController.getMyReviews);
router5.get("/seller/pending", auth_default("SELLER" /* SELLER */), reviewController.getReviewsToReply);
router5.get("/stats/:medicineId", reviewController.getReviewStats);
router5.get("/eligibility/:orderId/:medicineId", auth_default("CUSTOMER" /* CUSTOMER */), reviewController.checkReviewEligibility);
var reviewRouter = router5;

// src/modules/home/home.router.ts
import express5 from "express";

// src/modules/home/home.service.ts
var getHomepageData = async () => {
  const [categories, featuredMedicines, sellers, stats] = await Promise.all([
    // 6 categories with medicine count
    prisma.category.findMany({
      take: 6,
      include: {
        _count: {
          select: { medicines: { where: { isActive: true } } }
        }
      },
      orderBy: { name: "asc" }
    }),
    // 8 featured/active medicines
    prisma.medicine.findMany({
      where: { isActive: true },
      take: 8,
      include: {
        category: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        _count: { select: { reviews: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    // 4 active sellers with their medicine count
    prisma.user.findMany({
      where: {
        role: "SELLER",
        status: "ACTIVE"
      },
      take: 4,
      select: {
        id: true,
        name: true,
        image: true,
        _count: {
          select: {
            medicines: { where: { isActive: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    // Quick stats
    prisma.$transaction([
      prisma.medicine.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "SELLER", status: "ACTIVE" } }),
      prisma.category.count()
    ])
  ]);
  const medicinesWithRatings = await Promise.all(
    featuredMedicines.map(async (medicine) => {
      const reviews = await prisma.review.findMany({
        where: { medicineId: medicine.id, rating: { not: null } },
        select: { rating: true }
      });
      const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0;
      return {
        ...medicine,
        averageRating: Number(avgRating.toFixed(1)),
        reviewCount: reviews.length
      };
    })
  );
  return {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      medicineCount: c._count.medicines
    })),
    featuredMedicines: medicinesWithRatings,
    topSellers: sellers.map((s) => ({
      id: s.id,
      name: s.name,
      image: s.image,
      medicineCount: s._count.medicines
    })),
    stats: {
      totalMedicines: stats[0],
      totalSellers: stats[1],
      totalCategories: stats[2]
    }
  };
};
var homeService = {
  getHomepageData
};

// src/modules/home/home.controller.ts
var getHomepageData2 = async (req, res, next) => {
  try {
    const result = await homeService.getHomepageData();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (e) {
    next(e);
  }
};
var HomeController = {
  getHomepageData: getHomepageData2
};

// src/modules/home/home.router.ts
var router6 = express5.Router();
router6.get("/", HomeController.getHomepageData);
var homeRouter = router6;

// src/app.ts
var app = express6();
var allowedOrigins = [
  process.env.APP_URL || "https://medi-store-client-main.vercel.app",
  process.env.PROD_APP_URL,
  // Production frontend URL
  "http://localhost:3000",
  "http://localhost:5000"
].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.includes(origin) || /^https:\/\/next-blog-client.*\.vercel\.app$/.test(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"]
  })
);
app.use(express6.json());
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
app.post("/api/verify-email", async (req, res) => {
  try {
    const token = req.body.token;
    if (!token) return res.status(400).json({ error: "No token" });
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    const email = payload.email;
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true }
    });
    res.json({ success: true, message: "Email verified" });
  } catch (error) {
    res.status(500).json({ error: "Verification failed" });
  }
});
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};
