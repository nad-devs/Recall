import { redirect } from 'next/navigation';

export default async function ConversationsRedirect({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.slug.join('/');
  redirect(`/conversation/${id}`);
} 