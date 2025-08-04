'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LessonManager } from '@/utils/lessonManager';

interface PageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export default function LessonIdPage({ params }: PageProps) {
  const router = useRouter();

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      const { lessonId } = resolvedParams;

      // Check if lesson exists
      const lessonData = LessonManager.getLessonData(lessonId);
      if (!lessonData) {
        // Lesson doesn't exist, redirect to setup
        router.push('/setup');
        return;
      }

      // Lesson exists, redirect to first lesson
      router.push(`/lesson/${lessonId}/lesson1`);
    };

    loadParams();
  }, [params, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
        <p className="text-[#00AFB9]">Loading lesson...</p>
      </div>
    </div>
  );
} 