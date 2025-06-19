import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth" // Assuming your auth options are here
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DashboardClient } from "./components/DashboardClient"

async function getDashboardData(userId: string) {
  const concepts = await prisma.concept.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const conceptsCount = concepts.length;
  const uniqueCategories = [...new Set(concepts.map(c => c.category).filter(Boolean))];
  const categoriesCount = uniqueCategories.length;
  
  // Concepts with lower confidence scores for review
  const conceptsToReview = concepts
    .filter(c => c.confidenceScore && c.confidenceScore < 0.7)
    .slice(0, 5);
  
  // Already sorted by date, so just take the first few
  const recentConcepts = concepts.slice(0, 5);

  return {
    conceptsCount,
    categoriesCount,
    conceptsToReview,
    recentConcepts,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // If no session, redirect to login page
    redirect('/');
  }

  const dashboardData = await getDashboardData(session.user.id);

  return <DashboardClient initialData={dashboardData} />;
}
