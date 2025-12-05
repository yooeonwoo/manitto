'use client';

import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements removed for pure glass look */}

      <GlassCard className="z-10 w-full max-w-md text-center py-12 px-8 flex flex-col items-center gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--toss-grey-900)] animate-fade-in-up">
            놀이댕산<br />마니또
          </h1>
          <p className="text-lg text-[var(--toss-grey-600)] animate-fade-in-up delay-100">
            서로의 비밀 마니또가 되어<br />
            따뜻한 연말을 만들어보세요.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full animate-fade-in-up delay-200">
          <Link href="/signup" className="w-full">
            <GlassButton size="lg" className="w-full text-lg shadow-lg">
              새로운 게임 시작하기
            </GlassButton>
          </Link>

          <Link href="/login" className="w-full">
            <GlassButton variant="secondary" size="lg" className="w-full text-lg">
              이미 계정이 있어요
            </GlassButton>
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}
