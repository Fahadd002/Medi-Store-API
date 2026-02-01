import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASS,
  },
});

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [process.env.APP_URL as string],
  baseURL: process.env.APP_URL, // This is important!
  
  user: {
    additionalFields: {
      role: {
        type: "string",
        default: "CUSTOMER",
        required: true,
        input: true,
        validate: (value: string) => {
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
    },
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
              © ${new Date().getFullYear()} MediStore - Your Trusted Online Medicine Shop
            </div>
          </div>
        </body>
        </html>
      `;

        await transporter.sendMail({
          from: `"MediStore" <${process.env.APP_USER}>`,
          to: user.email,
          subject: "Verify your email address - MediStore",
          html: htmlTemplate,
        });

        console.log(`✅ Verification email sent to ${user.email}`);
        
      } catch (error) {
        console.error("❌ Email verification failed:", error);
        throw error;
      }
    },
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  }
});