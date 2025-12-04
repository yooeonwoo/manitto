'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [user, setUser] = useState<any>(null);
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
            setUser(user);

            // Fetch Profile to get participant_id and round_id
            const { data: prof } = await supabase
                .from('profiles')
                .select('participant_id, display_name, round_id')
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const checkManitto = async () => {
        if (!profile) return;
        setAssigning(true);

        try {
            // Call RPC to assign manitto
            const { data, error } = await supabase.rpc('assign_manitto', {
                p_round_id: profile.round_id,
                p_participant_id: profile.participant_id
            });

            if (error) throw error;

            // RPC returns an array, take the first item
            if (data && data.length > 0) {
                const result = data[0];
                setAssignment({
                    targetName: result.target_name,
                    targetImage: result.target_image,
                    missionContent: result.mission_content
                });
            } else {
                alert('배정 가능한 마니또가 없습니다. 관리자에게 문의하세요.');
            }

        } catch (err: any) {
            console.error(err);
            alert('배정 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 text-[var(--toss-grey-700)]">
                로딩중...
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="w-full max-w-md space-y-6 z-10">
                <header className="flex justify-between items-center px-2">
                    <h1 className="text-2xl font-bold text-[var(--toss-grey-900)]">킹컴퍼니 연말 시상식</h1>
                    <button onClick={handleLogout} className="text-sm text-[var(--toss-grey-600)] hover:text-[var(--toss-grey-900)]">
                        로그아웃
                    </button>
                </header>

                <GlassCard className="p-8 text-center space-y-8">
                    <div>
                        <h2 className="text-lg font-medium text-[var(--toss-grey-600)] mb-4">당신의 마니또 대상</h2>
                        {assignment ? (
                            <div className="flex flex-col items-center gap-4 animate-fade-in-up">
                                {assignment.targetImage ? (
                                    <img
                                        src={assignment.targetImage}
                                        alt={assignment.targetName}
                                        className="w-64 h-64 rounded-2xl object-cover border-4 border-white/50 shadow-lg aspect-square"
                                    />
                                ) : (
                                    <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-[var(--toss-blue)] to-cyan-400 flex items-center justify-center text-white text-6xl font-bold shadow-lg aspect-square">
                                        {assignment.targetName.charAt(0)}
                                    </div>
                                )}
                                <div className="text-3xl font-bold text-[var(--toss-blue)]">
                                    {assignment.targetName}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8">
                                <GlassButton
                                    size="lg"
                                    className="w-full text-lg shadow-xl animate-pulse"
                                    onClick={checkManitto}
                                    disabled={assigning}
                                >
                                    {assigning ? '배정 중...' : '마니또 확인하기'}
                                </GlassButton>
                                <p className="mt-4 text-sm text-[var(--toss-grey-500)]">
                                    버튼을 누르면 랜덤으로 마니또가 배정됩니다.
                                </p>
                            </div>
                        )}
                    </div>

                    {assignment && (
                        <>
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--toss-grey-300)] to-transparent opacity-50"></div>

                            <div>
                                <h2 className="text-lg font-medium text-[var(--toss-grey-600)] mb-2">당신의 미션</h2>
                                <div className="text-xl font-medium text-[var(--toss-grey-800)] animate-fade-in-up delay-100">
                                    "{assignment.missionContent}"
                                </div>
                            </div>
                        </>
                    )}
                </GlassCard>

                <div className="flex justify-center mt-8">
                    <GlassButton variant="secondary" size="sm" onClick={() => router.push('/my')}>
                        마이 페이지로 이동
                    </GlassButton>
                </div>
            </div>
        </main>
    );
}
