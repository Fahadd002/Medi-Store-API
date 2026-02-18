// services/home.service.ts
import { prisma } from "../../lib/prisma";

const getHomepageData = async () => {
  // Fetch all data in parallel for better performance
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

  // Calculate average ratings for medicines
  const medicinesWithRatings = await Promise.all(
    featuredMedicines.map(async (medicine) => {
      const reviews = await prisma.review.findMany({
        where: { medicineId: medicine.id, rating: { not: null } },
        select: { rating: true }
      });
      
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

      return {
        ...medicine,
        averageRating: Number(avgRating.toFixed(1)),
        reviewCount: reviews.length
      };
    })
  );

  return {
    categories: categories.map(c => ({
      id: c.id,
      name: c.name,
      medicineCount: c._count.medicines
    })),
    featuredMedicines: medicinesWithRatings,
    topSellers: sellers.map(s => ({
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

export const homeService = {
  getHomepageData
};