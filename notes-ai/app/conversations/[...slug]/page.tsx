import { redirect } from 'next/navigation';

export default function ConversationsRedirect({ params }: { params: { slug: string[] } }) {
  const id = params.slug.join('/');
  redirect(`/conversation/${id}`);
} 