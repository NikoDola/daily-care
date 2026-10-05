import { notFound } from 'next/navigation';
import { LegacyPage, legacyPages } from '../legacy-page';

export function generateStaticParams() {
  return legacyPages.map(legacy => ({ legacy }));
}

export async function generateMetadata({ params }) {
  const { legacy } = await params;
  return { title: ({ 'review.html': 'DailyCare · Review the day', 'family.html': 'DailyCare · Margaret’s day', 'system.html': 'DailyCare · Design system', 'experience.html': 'DailyCare · A day of care' })[legacy] || 'DailyCare · Today’s care' };
}

export default async function LegacyRoute({ params }) {
  const { legacy } = await params;
  if (!legacyPages.includes(legacy)) notFound();
  return <LegacyPage file={legacy} />;
}
