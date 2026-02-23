MediStore 💊
📋 Project Overview
MediStore is a full-stack e-commerce platform for purchasing over-the-counter (OTC) medicines, connecting customers with verified sellers while providing complete admin oversight.

🚀 Live Links
Frontend: https://medi-store-client-main.vercel.app
Backend API: https://medi-store-api-main.vercel.app
Frontend Repo: https://github.com/Fahadd002/medi-store-client.git
Backend Repo: https://github.com/Fahadd002/Medi-Store-API.git
Demo Video: https://drive.google.com/file/d/1UtjbV3TaAOiP40xzJZ5-_8RcMxv41CK0/view?usp=sharing

👑 Admin Credentials
text
Email:    admin@medistore.com
Password: Admin@123
🛠️ Tech Stack
Frontend: Next.js 14, TypeScript, Tailwind CSS
Backend: Node.js + Express, PostgreSQL, Prisma
Deployment: Vercel (frontend), Render (backend)

👥 User Roles
Role	Permissions
Customer	Browse medicines, cart, order, track status, leave reviews
Seller	Manage inventory, view/update orders
Admin	Manage all users, medicines, orders, categories
✨ Key Features
Customer Features
Browse medicines with search & filters

Add to cart & place orders (COD only)

Track order status in real-time

Leave reviews for purchased items

Manage profile

Seller Features
Complete inventory management (CRUD)

Stock tracking

View & update order status

Admin Features
User management (ban/unban)

Platform oversight (all medicines & orders)

Category management

📁 Core Routes
Route	Page
/	Homepage
/shop	Browse medicines
/cart	Shopping cart
/orders	Order history
/seller/medicines	Inventory management
/admin/users	User management
📊 Database Tables
Users

Categories

Medicines

Orders

OrderItems

Reviews

✅ Mandatory Requirements
Homepage with 4 sections + Navbar + Footer

Responsive UI with consistent styling

30+ meaningful commits

Error handling & loading states

Admin credentials provided

🚦 Setup Instructions
bash
git clone [repo-url]
npm install
cp .env.example .env
npm run dev