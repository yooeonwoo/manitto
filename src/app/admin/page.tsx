'use client';

import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('participants');
    const [loading, setLoading] = useState(false);

    // Data State
    const [roundId, setRoundId] = useState<string | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [missions, setMissions] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);

    // Input State
    const [newParticipantName, setNewParticipantName] = useState('');
    const [newParticipantFile, setNewParticipantFile] = useState<File | null>(null);
    const [newMissionContent, setNewMissionContent] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit State
    const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editFile, setEditFile] = useState<File | null>(null);

    // --- Auth ---
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsAuthenticated(true);
            fetchRound();
        } else {
            alert('비밀번호가 틀렸습니다.');
        }
    };

    // --- Fetching ---
    const fetchRound = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('rounds')
            .select('*')
            .eq('name', '놀이댕산 마니또')
            .single();

        if (data) {
            setRoundId(data.id);
        } else {
            const { data: anyRound } = await supabase.from('rounds').select('*').limit(1).single();
            if (anyRound) setRoundId(anyRound.id);
        }
        setLoading(false);
    };

    const fetchParticipants = async () => {
        if (!roundId) return;
        const { data } = await supabase
            .from('participants')
            .select('*')
            .eq('round_id', roundId)
            .order('name');
        if (data) setParticipants(data);
    };

    const fetchMissions = async () => {
        if (!roundId) return;
        const { data } = await supabase
            .from('missions')
            .select('*')
            .eq('round_id', roundId);
        if (data) setMissions(data);
    };

    const fetchAssignments = async () => {
        if (!roundId) return;
        const { data } = await supabase
            .from('assignments')
            .select(`
        id,
        participant:participants!source_participant_id(name),
        target:participants!target_participant_id(name),
        mission:missions(content)
      `)
            .eq('round_id', roundId);
        if (data) setAssignments(data);
    };

    useEffect(() => {
        if (isAuthenticated && roundId) {
            fetchParticipants();
            fetchMissions();
            fetchAssignments();
        }
    }, [isAuthenticated, roundId]);

    // --- Helpers ---
    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('participants')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                alert('이미지 업로드 실패: ' + uploadError.message);
                return null;
            }

            const { data } = supabase.storage
                .from('participants')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (err) {
            console.error('Upload exception:', err);
            return null;
        }
    };

    // --- Actions ---
    const addParticipant = async () => {
        if (!newParticipantName || !roundId) return;

        let imageUrl = null;
        if (newParticipantFile) {
            imageUrl = await uploadImage(newParticipantFile);
            if (!imageUrl) return; // Upload failed
        }

        await supabase.from('participants').insert({
            round_id: roundId,
            name: newParticipantName,
            image_url: imageUrl
        });

        setNewParticipantName('');
        setNewParticipantFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchParticipants();
    };

    const deleteParticipant = async (id: string) => {
        if (!confirm('정말 이 참가자를 삭제하시겠습니까?')) return;
        await supabase.from('participants').delete().eq('id', id);
        fetchParticipants();
    };

    const startEditing = (p: any) => {
        setEditingParticipantId(p.id);
        setEditName(p.name);
        setEditFile(null);
    };

    const cancelEditing = () => {
        setEditingParticipantId(null);
        setEditName('');
        setEditFile(null);
    };

    const saveParticipant = async (id: string, currentImageUrl: string) => {
        let imageUrl = currentImageUrl;

        if (editFile) {
            const newUrl = await uploadImage(editFile);
            if (newUrl) imageUrl = newUrl;
            else return; // Upload failed
        }

        await supabase.from('participants').update({
            name: editName,
            image_url: imageUrl
        }).eq('id', id);

        setEditingParticipantId(null);
        fetchParticipants();
    };

    const addMission = async () => {
        if (!newMissionContent || !roundId) return;
        await supabase.from('missions').insert({ round_id: roundId, content: newMissionContent });
        setNewMissionContent('');
        fetchMissions();
    };

    const deleteMission = async (id: string) => {
        if (!confirm('정말 이 미션을 삭제하시겠습니까?')) return;
        await supabase.from('missions').delete().eq('id', id);
        fetchMissions();
    };

    const updateMission = async (id: string, currentContent: string) => {
        const newContent = prompt('새로운 미션 내용을 입력하세요:', currentContent);
        if (newContent && newContent !== currentContent) {
            await supabase.from('missions').update({ content: newContent }).eq('id', id);
            fetchMissions();
        }
    };

    // --- Render ---

    if (!isAuthenticated) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6">
                <GlassCard className="w-full max-w-md p-8">
                    <h1 className="text-2xl font-bold text-center mb-6">관리자 로그인</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <GlassInput
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <GlassButton type="submit" className="w-full">로그인</GlassButton>
                    </form>
                </GlassCard>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-6 pb-20">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--toss-grey-900)]">놀이댕산 마니또</h1>
                        <p className="text-sm text-[var(--toss-grey-500)]">관리자 대시보드</p>
                    </div>
                    <GlassButton size="sm" variant="secondary" onClick={() => setIsAuthenticated(false)}>로그아웃</GlassButton>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {[
                        { id: 'participants', label: '참가자 관리' },
                        { id: 'missions', label: '미션 관리' },
                        { id: 'assignments', label: '배정 현황' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-[var(--toss-blue)] text-white shadow-md'
                                : 'bg-white/40 text-[var(--toss-grey-600)] hover:bg-white/60'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <GlassCard className="p-6 min-h-[400px]">
                    {loading && <div className="text-center py-4">로딩중...</div>}

                    {/* PARTICIPANTS TAB */}
                    {!loading && activeTab === 'participants' && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3 p-4 bg-white/50 rounded-xl border border-white/60">
                                <h3 className="font-bold text-sm text-[var(--toss-grey-700)]">새 참가자 추가</h3>
                                <div className="flex gap-2">
                                    <GlassInput
                                        placeholder="이름"
                                        value={newParticipantName}
                                        onChange={(e) => setNewParticipantName(e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={(e) => setNewParticipantFile(e.target.files ? e.target.files[0] : null)}
                                        className="text-sm text-[var(--toss-grey-600)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--toss-blue)] file:text-white hover:file:bg-blue-600"
                                    />
                                    <GlassButton onClick={addParticipant} disabled={!newParticipantName} size="sm">추가</GlassButton>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {participants.map((p) => (
                                    <div key={p.id} className="p-3 bg-white/40 rounded-xl border border-white/60 flex justify-between items-center">
                                        {editingParticipantId === p.id ? (
                                            // EDIT MODE
                                            <div className="flex flex-col gap-2 w-full">
                                                <GlassInput
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setEditFile(e.target.files ? e.target.files[0] : null)}
                                                    className="text-xs text-[var(--toss-grey-600)]"
                                                />
                                                <div className="flex gap-2 justify-end mt-1">
                                                    <button onClick={cancelEditing} className="text-xs text-[var(--toss-grey-500)]">취소</button>
                                                    <button onClick={() => saveParticipant(p.id, p.image_url)} className="text-xs text-[var(--toss-blue)] font-bold">저장</button>
                                                </div>
                                            </div>
                                        ) : (
                                            // VIEW MODE
                                            <>
                                                <div className="flex items-center gap-3">
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-white/50" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs">No Img</div>
                                                    )}
                                                    <span className="font-medium">{p.name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => startEditing(p)}
                                                        className="text-xs text-[var(--toss-blue)] hover:underline"
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() => deleteParticipant(p.id)}
                                                        className="text-xs text-[var(--toss-red)] hover:underline"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MISSIONS TAB */}
                    {!loading && activeTab === 'missions' && (
                        <div className="space-y-6">
                            <div className="flex gap-2">
                                <GlassInput
                                    placeholder="새로운 미션 내용"
                                    value={newMissionContent}
                                    onChange={(e) => setNewMissionContent(e.target.value)}
                                />
                                <GlassButton onClick={addMission}>추가</GlassButton>
                            </div>
                            <div className="space-y-2">
                                {missions.map((m) => (
                                    <div key={m.id} className="p-3 bg-white/40 rounded-xl border border-white/60 flex justify-between items-center">
                                        <span className="text-sm">{m.content}</span>
                                        <div className="flex gap-2 shrink-0 ml-2">
                                            <button
                                                onClick={() => updateMission(m.id, m.content)}
                                                className="text-xs text-[var(--toss-blue)] hover:underline"
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={() => deleteMission(m.id)}
                                                className="text-xs text-[var(--toss-red)] hover:underline"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ASSIGNMENTS TAB */}
                    {!loading && activeTab === 'assignments' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold">배정 현황</h3>
                                    <p className="text-sm text-[var(--toss-grey-500)]">
                                        {assignments.length}명 배정 완료 / {participants.length}명 참가자
                                    </p>
                                </div>
                                <GlassButton
                                    size="sm"
                                    variant="secondary"
                                    onClick={async () => {
                                        if (!confirm('정말 모든 배정을 초기화하시겠습니까? 모든 참가자가 다시 마니또를 뽑아야 합니다.')) return;
                                        if (!roundId) return;
                                        await supabase.from('assignments').delete().eq('round_id', roundId);
                                        fetchAssignments();
                                        alert('배정이 초기화되었습니다.');
                                    }}
                                    disabled={assignments.length === 0}
                                >
                                    전체 초기화
                                </GlassButton>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {participants.map((p) => {
                                    const isAssigned = assignments.some(
                                        (a) => (a.participant as any)?.name === p.name
                                    );
                                    return (
                                        <div
                                            key={p.id}
                                            className={`p-3 rounded-xl border flex items-center gap-3 ${isAssigned
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-white/40 border-white/60'
                                                }`}
                                        >
                                            {p.image_url ? (
                                                <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-white/50" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                                                    {p.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{p.name}</div>
                                                <div className={`text-xs ${isAssigned ? 'text-green-600' : 'text-[var(--toss-grey-400)]'}`}>
                                                    {isAssigned ? '✓ 배정 완료' : '대기중'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {participants.length === 0 && (
                                <div className="text-center text-[var(--toss-grey-500)] py-8">
                                    참가자를 먼저 추가해주세요.
                                </div>
                            )}
                        </div>
                    )}

                </GlassCard>
            </div>
        </main>
    );
}
