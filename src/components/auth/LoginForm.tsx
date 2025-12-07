'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function LoginForm() {
    const [participants, setParticipants] = useState<{ id: string; name: string }[]>([]);
    const [selectedParticipantId, setSelectedParticipantId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchParticipants() {
            // 1. Get the specific round
            const { data: rounds } = await supabase
                .from('rounds')
                .select('id')
                .eq('name', '놀이댕산 마니또')
                .single();

            if (rounds) {
                // 2. Get participants for that round
                const { data: parts } = await supabase
                    .from('participants')
                    .select('id, name')
                    .eq('round_id', rounds.id)
                    .order('name');

                if (parts) setParticipants(parts);
            }
        }
        fetchParticipants();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const participant = participants.find(p => p.id === selectedParticipantId);
            if (!participant) throw new Error('이름을 선택해주세요.');

            // Use participant ID for email to ensure valid format and uniqueness
            const email = `${participant.id}@glass-manitto.game`;

            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Success
            router.push('/home');

        } catch (err: any) {
            console.error(err);
            setError(err.message || '로그인 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard className="w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-[var(--toss-grey-900)]">
                놀이댕산 마니또<br />로그인
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--toss-grey-700)] ml-1">
                        이름 선택
                    </label>
                    <div className="relative">
                        <select
                            value={selectedParticipantId}
                            onChange={(e) => setSelectedParticipantId(e.target.value)}
                            className="w-full appearance-none glass-input px-4 py-3 rounded-2xl bg-white/30 border border-white/50 focus:border-[var(--toss-blue)] focus:outline-none text-[var(--toss-grey-900)]"
                            required
                        >
                            <option value="" disabled>본인의 이름을 선택하세요</option>
                            {participants.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--toss-grey-600)]">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--toss-grey-700)] ml-1">
                        비밀번호
                    </label>
                    <GlassInput
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full"
                    />
                </div>

                {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <GlassButton type="submit" className="w-full font-bold text-lg shadow-md" disabled={loading}>
                    {loading ? '로그인 중...' : '로그인'}
                </GlassButton>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-[var(--toss-grey-600)]">
                    처음 오셨나요?{' '}
                    <Link href="/signup" className="text-[var(--toss-blue)] font-semibold hover:underline">
                        참가하기
                    </Link>
                </p>
            </div>
        </GlassCard>
    );
}
