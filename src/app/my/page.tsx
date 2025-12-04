'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MyPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [assignment, setAssignment] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch Profile
            const { data: prof } = await supabase
                .from('profiles')
                .select('display_name, participant_id')
                .eq('id', user.id)
                .single();

            if (prof) {
                setProfile(prof);

                // Fetch Assignment
                const { data: assign } = await supabase
                    .from('assignments')
                    .select(`
            mission_id,
            target_participant_id,
            missions (content),
            participants!target_participant_id (name, image_url)
          `)
                    .eq('source_participant_id', prof.participant_id)
                    .single();

                if (assign) {
                    setAssignment({
                        targetName: (assign.participants as any).name,
                        targetImage: (assign.participants as any).image_url,
                        missionContent: (assign.missions as any).content
                    });
                }
            }
            setLoading(false);
        }
        fetchData();
    }, [router]);

    if (loading) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 text-[var(--toss-grey-700)]">
                로딩중...
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-6 relative overflow-hidden">
            <div className="w-full max-w-md space-y-6 z-10 mt-10">
                <header className="flex justify-between items-center px-2 mb-8">
                    <h1 className="text-2xl font-bold text-[var(--toss-grey-900)]">마이 페이지</h1>
                    <button onClick={() => router.push('/home')} className="text-sm text-[var(--toss-blue)] font-medium hover:underline">
                        홈으로 돌아가기
                    </button>
                </header>

                <GlassCard className="p-8 space-y-8">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--toss-blue)] to-cyan-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {profile?.display_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--toss-grey-900)]">{profile?.display_name}</h2>
                            <p className="text-sm text-[var(--toss-grey-500)]">참가자</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-white/40 border border-white/60 shadow-sm flex flex-col items-center gap-4 text-center">
                            {assignment ? (
                                <>
                                    {assignment.targetImage ? (
                                        <img
                                            src={assignment.targetImage}
                                            alt={assignment.targetName}
                                            className="w-48 h-48 rounded-2xl object-cover border-2 border-white/50 aspect-square shadow-md"
                                        />
                                    ) : (
                                        <div className="w-48 h-48 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-4xl aspect-square shadow-md">
                                            {assignment.targetName.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-sm font-medium text-[var(--toss-grey-600)] mb-1">배정된 대상</h3>
                                        <p className="text-2xl font-bold text-[var(--toss-blue)]">
                                            {assignment.targetName}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-[var(--toss-grey-500)]">미배정</div>
                            )}
                        </div>

                        <div className="p-4 rounded-2xl bg-white/40 border border-white/60 shadow-sm">
                            <h3 className="text-sm font-medium text-[var(--toss-grey-600)] mb-1">나의 미션</h3>
                            <p className="text-base text-[var(--toss-grey-800)]">
                                {assignment ? assignment.missionContent : '게임 시작 대기중...'}
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </main>
    );
}
