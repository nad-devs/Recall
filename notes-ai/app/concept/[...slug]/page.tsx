import { redirect } from 'next/navigation';

export default function ConceptRedirect({ params }: { params: { slug: string[] } }) {
  const id = params.slug.join('/');
  redirect(`/concepts/${id}`);
} 