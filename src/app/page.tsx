'use client';

import { useState, KeyboardEvent, useMemo, useEffect } from 'react'; // useEffect 추가
import { useQuery } from '@tanstack/react-query';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';
import { useSchoolStore } from '../store/useSchoolStore';
import { School, MealInfo } from '../types/neis';

/**
 * 나이스 API 알레르기 번호 매핑 데이터
 */
const allergyMap: { [key: string]: string } = {
    "1": "난류", "2": "우유", "3": "메밀", "4": "땅콩", "5": "대두", "6": "밀", "7": "고등어", "8": "게",
    "9": "새우", "10": "돼지고기", "11": "복숭아", "12": "토마토", "13": "아황산류", "14": "호두",
    "15": "닭고기", "16": "쇠고기", "17": "오징어", "18": "조개류", "19": "잣"
};

export default function MobileMealApp() {
    const { selectedSchool, setSchool } = useSchoolStore();
    const [keyword, setKeyword] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'month' | 'year' | 'decade'>('month');
    const controls = useAnimation();

    // 즐겨찾기 및 테마 상태 관리 (컴포넌트 내부로 이동)
    const [favorites, setFavorites] = useState<School[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

    // 초기 로드 시 즐겨찾기 및 테마 불러오기
    useEffect(() => {
        const savedFavs = localStorage.getItem('school-favs');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));

        const savedTheme = localStorage.getItem('app-theme') as any;
        if (savedTheme) setTheme(savedTheme || 'system');
    }, []);

    // 테마 적용 로직
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', theme);
        }
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    // 즐겨찾기 토글 기능
    const isFavorite = favorites.some(f => f.SD_SCHUL_CODE === selectedSchool?.code);
    const toggleFavorite = () => {
        if (!selectedSchool?.code) return;
        let updated;
        if (isFavorite) {
            updated = favorites.filter(f => f.SD_SCHUL_CODE !== selectedSchool.code);
        } else {
            const newFav: School = {
                SD_SCHUL_CODE: selectedSchool.code,
                SCHUL_NM: selectedSchool.name,
                ATPT_OFCDC_SC_CODE: selectedSchool.officeCode,
                ORG_RDNMA: ''
            };
            updated = [...favorites, newFav];
        }
        setFavorites(updated);
        localStorage.setItem('school-favs', JSON.stringify(updated));
    };

    // 테마 순환 함수
    const rotateTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    /**
     * 상대적 달력 범위 계산
     */
    const { minDate, maxDate } = useMemo(() => {
        const now = new Date();
        return {
            minDate: new Date(now.getFullYear() - 1, 0, 1),
            maxDate: new Date(now.getFullYear(), now.getMonth() + 2, 0)
        };
    }, []);

    const { data: searchResults, isLoading: isSearching } = useQuery<School[]>({
        queryKey: ['schoolSearch', keyword],
        queryFn: async () => {
            if (keyword.length < 2) return [];
            const res = await fetch(`/api/school?schoolName=${encodeURIComponent(keyword)}`);
            return res.json();
        },
        enabled: keyword.length >= 2,
    });

    const formattedDate = selectedDate.toISOString().split('T')[0].replace(/-/g, '');
    const { data: meal, isLoading: isMealLoading } = useQuery<MealInfo>({
        queryKey: ['meal', selectedSchool?.code, formattedDate],
        queryFn: async () => {
            const res = await fetch(`/api/meal?officeCode=${selectedSchool?.officeCode}&schoolCode=${selectedSchool?.code}&date=${formattedDate}`);
            return res.json();
        },
        enabled: !!selectedSchool?.code,
    });

    const softSpring = {
        type: 'spring' as const,
        stiffness: 200,
        damping: 25
    };

    const changeView = async (offset: number) => {
        let newDate = new Date(viewDate);

        // 현재 보기 모드에 따라 가중치 조절
        if (viewMode === 'month') {
            newDate.setMonth(viewDate.getMonth() + offset);
        } else if (viewMode === 'year') {
            newDate.setFullYear(viewDate.getFullYear() + offset);
        } else if (viewMode === 'decade') {
            newDate.setFullYear(viewDate.getFullYear() + offset * 10);
        }

        if (newDate >= minDate && newDate <= maxDate) {
            setViewDate(newDate);
            // 애니메이션 효과
            await controls.start({ x: offset < 0 ? 25 : -25, opacity: 0.9, transition: { duration: 0.1 } });
            controls.set({ x: offset < 0 ? -25 : 25 });
            await controls.start({ x: 0, opacity: 1, transition: softSpring });
        }
    };

    // 드래그(스와이프) 종료 핸들러 업데이트
    const handleDragEnd = (event: any, info: PanInfo) => {
        const threshold = 60;
        if (info.offset.x < -threshold) changeView(1);
        else if (info.offset.x > threshold) changeView(-1);
        else controls.start({ x: 0, transition: softSpring });
    };

    const handleSelectSchool = (school: School) => {
        setSchool(school.SD_SCHUL_CODE, school.SCHUL_NM, school.ATPT_OFCDC_SC_CODE);
        setKeyword('');
    };

    const goHome = () => {
        setSchool('', '', '');
        setKeyword('');
        setExpandedIndex(null);
        setViewMode('month');
    };

    const toggleViewMode = () => {
        if (viewMode === 'month') setViewMode('year');
        else if (viewMode === 'year') setViewMode('decade');
        else setViewMode('month');
    };

    const renderMealCards = (menuHtml: string, nutritionText: string) => {
        return menuHtml.split('<br/>').map((item, idx) => {
            const originalName = item.trim();
            const allergyMatch = originalName.match(/\(([^)]+)\)/);
            const allergyCodes = allergyMatch ? allergyMatch[1].split('.') : [];
            const allergyNames = allergyCodes.map(code => allergyMap[code]).filter(Boolean);
            const searchName = originalName
                .replace(/\([^)]*\)/g, '') // 괄호와 그 안의 내용 제거
                .replace(/[0-9.*#]/g, '')  // 숫자, 점, 별표, 샵(#) 제거 [cite: 2026-04-22]
                .trim();

            if (!searchName) return null;
            const isExpanded = expandedIndex === idx;

            return (
                <div key={idx} style={{
                    background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px',
                    marginBottom: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                    <div
                        style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    >
                        <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1.05rem' }}>{searchName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchName)}`;
                                    // 새 창 대신 현재 창에서 이동하여 차단 원천 방지
                                    window.location.href = searchUrl;
                                }}
                                style={{
                                    background: 'var(--primary)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '6px 14px',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                검색
                            </button>
                            <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} style={{ fontSize: '10px', color: '#9ca3af' }}>▼</motion.span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                transition={softSpring}
                                style={{ background: 'var(--calendar-hover)', borderTop: '1px solid var(--border)', overflow: 'hidden' }}
                            >
                                <div style={{ padding: '20px' }}>
                                    <div style={{ marginBottom: '18px' }}>
                                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>📊 주요 영양소 성분</p>
                                        <div style={{ fontSize: '12px', color: 'var(--text-sub)', lineHeight: '1.7' }}>
                                            {nutritionText.split('<br/>').slice(0, 7).map((n, i) => <div key={i}>{n}</div>)}
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>⚠️ 알레르기 유발 식품</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {allergyNames.length > 0 ? allergyNames.map(name => (
                                                <span key={name} style={{ background: '#fee2e2', color: '#ef4444', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>{name}</span>
                                            )) : <span style={{ fontSize: '12px', color: '#9ca3af' }}>정보 없음</span>}
                                        </div>
                                    </div>
                                    <p style={{ margin: '15px 0 0 0', fontSize: '10px', color: '#d1d5db' }}>원본: {originalName}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        });
    };

    return (
        <main className="container" style={{ overflowX: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
            <header style={{
                marginBottom: '25px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '15px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1 onClick={goHome} style={{ fontSize: '1.4rem', fontWeight: '900', cursor: 'pointer', color: 'var(--text-main)' }}>
                        🏫 급식 정보 모음
                    </h1>
                    {selectedSchool?.code && (
                        <motion.button
                            whileTap={{ scale: 0.8 }} // 터치 시 살짝 작아지는 효과
                            onClick={toggleFavorite}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                    fill={isFavorite ? "#FACC15" : "none"} // 활성화 시 노란색 채움
                                    stroke={isFavorite ? "#FACC15" : "#9CA3AF"} // 비활성화 시 회색 테두리
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </motion.button>
                    )}
                </div>

                <button
                    onClick={rotateTheme}
                    style={{
                        background: 'var(--border)', border: 'none', borderRadius: '12px',
                        padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)'
                    }}
                >
                    {theme === 'light' ? '☀️ 라이트' : theme === 'dark' ? '🌙 다크' : '💻 시스템'}
                </button>
            </header>

            {!selectedSchool?.code && (
                <>
                    {favorites.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '10px' }}>즐겨찾는 학교</p>
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
                                {favorites.map(fav => (
                                    <button
                                        key={fav.SD_SCHUL_CODE}
                                        onClick={() => handleSelectSchool(fav)}
                                        style={{
                                            whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '12px',
                                            background: 'var(--border)', border: 'none', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)'
                                        }}
                                    >
                                        {fav.SCHUL_NM}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <section style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '120px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem', fontWeight: '500' }}>찾으시는 학교를 검색해 보세요.</p>
                        </div>
                        <div className="search-section" style={{ position: 'relative', width: '100%' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                                <input
                                    type="text"
                                    style={{
                                        flex: 1,
                                        minWidth: '0',
                                        height: '56px',
                                        background: 'var(--card-bg)',
                                        border: '2px solid var(--border)',
                                        borderRadius: '18px',
                                        padding: '0 16px',
                                        fontSize: '16px',
                                        outline: 'none',
                                        color: 'var(--text-main)'
                                    }}
                                    placeholder="학교명 입력 (예: 서울중학교)"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    /* Enter 키 입력 시 검색 결과의 첫 번째 학교 자동 선택 */
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchResults && searchResults.length > 0) {
                                            handleSelectSchool(searchResults[0]);
                                        }
                                    }}
                                />
                                <button
                                    /* 검색 버튼 클릭 시 동작 추가 */
                                    onClick={() => {
                                        if (searchResults && searchResults.length > 0) {
                                            handleSelectSchool(searchResults[0]);
                                        }
                                    }}
                                    style={{
                                        flexShrink: 0,
                                        width: '70px',
                                        height: '56px',
                                        background: 'var(--primary)',
                                        border: 'none',
                                        borderRadius: '18px',
                                        color: 'white',
                                        fontWeight: '800',
                                        cursor: 'pointer'
                                    }}
                                >
                                    검색
                                </button>
                            </div>

                            {/* 검색 결과 드롭다운 표시 (검색 중이거나 결과가 있을 때) */}
                            {keyword.length >= 2 && (
                                <div style={{
                                    position: 'absolute', top: '65px', left: 0, right: 0,
                                    background: 'var(--card-bg)', borderRadius: '18px',
                                    border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    zIndex: 100, maxHeight: '250px', overflowY: 'auto'
                                }}>
                                    {isSearching ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-sub)' }}>검색 중...</div>
                                    ) : searchResults && searchResults.length > 0 ? (
                                        searchResults.map(school => (
                                            <div
                                                key={school.SD_SCHUL_CODE}
                                                onClick={() => handleSelectSchool(school)}
                                                style={{
                                                    padding: '16px 20px', cursor: 'pointer',
                                                    borderBottom: '1px solid var(--border)', color: 'var(--text-main)'
                                                }}
                                            >
                                                <div style={{ fontWeight: '700' }}>{school.SCHUL_NM}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>{school.ORG_RDNMA}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-sub)' }}>검색 결과가 없습니다.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}

            {selectedSchool?.code && (
                <section>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--calendar-hover)',
                        padding: '16px 22px',
                        borderRadius: '20px',
                        marginBottom: '25px',
                        border: '1px solid var(--border)',
                        gap: '12px' // 버튼과 텍스트 사이 최소 간격 확보 [cite: 2026-04-22]
                    }}>
                        <span style={{
                            fontSize: '1.1rem',
                            fontWeight: '800',
                            color: 'var(--primary)',
                            flex: 1, // 남은 공간 모두 차지 [cite: 2026-04-22]
                            whiteSpace: 'nowrap', // 줄바꿈 방지 [cite: 2026-04-22]
                            overflow: 'hidden', // 넘치는 텍스트 숨김 [cite: 2026-04-22]
                            textOverflow: 'ellipsis', // 말줄임표(...) 표시 [cite: 2026-04-22]
                            minWidth: 0 // flex 아이템의 최소 너비 제한 해제 (말줄임표 작동 필수) [cite: 2026-04-22]
                        }}>
                            {selectedSchool.name}
                        </span>
                        <button
                            onClick={goHome}
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                                padding: '7px 15px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: 'var(--text-main)',
                                flexShrink: 0, // 버튼이 찌그러지지 않도록 고정 [cite: 2026-04-22]
                                whiteSpace: 'nowrap' // 버튼 내부 텍스트 줄바꿈 방지 [cite: 2026-04-22]
                            }}
                        >
                            변경
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', padding: '0 10px' }}>
                        <button onClick={() => changeView(-1)} style={{ background: 'var(--border)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', color: 'var(--text-main)' }}>◀</button>
                        <motion.div onClick={toggleViewMode} style={{ cursor: 'pointer', textAlign: 'center' }}>
                            <motion.div key={viewDate.getTime()} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-main)' }}>
                                {viewMode === 'month' && `${viewDate.getFullYear()}년 ${viewDate.getMonth() + 1}월`}
                                {viewMode === 'year' && `${viewDate.getFullYear()}년`}
                                {viewMode === 'decade' && `${Math.floor(viewDate.getFullYear() / 10) * 10}년대`}
                            </motion.div>
                            <span style={{ fontSize: '10px', color: 'var(--text-sub)', fontWeight: '600' }}>탭하여 단위 변경</span>
                        </motion.div>
                        <button onClick={() => changeView(1)} style={{ background: 'var(--border)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', color: 'var(--text-main)' }}>▶</button>
                    </div>

                    <div style={{ overflow: 'hidden', touchAction: 'pan-y' }}>
                        <motion.div drag="x" animate={controls} onDragEnd={handleDragEnd} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25}>
                            <Calendar
                                onChange={(val) => { setSelectedDate(val as Date); setViewMode('month'); }}
                                value={selectedDate}
                                activeStartDate={viewDate}
                                onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setViewDate(activeStartDate)}
                                view={viewMode}
                                onViewChange={({ view }) => setViewMode(view as any)}
                                locale="ko-KR" calendarType="gregory" minDate={minDate} maxDate={maxDate} formatDay={(_locale, date) => date.getDate().toString()}
                            />
                        </motion.div>
                    </div>

                    <div style={{ marginTop: '35px' }}>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '22px', fontWeight: '900', color: 'var(--text-main)' }}>🍴 {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</h3>
                        {isMealLoading ? (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#9ca3af' }}>데이터 로딩 중...</div>
                        ) : meal ? (
                            <div>
                                {renderMealCards(meal.DDISH_NM, meal.NTR_INFO)}
                                <div style={{ marginTop: '20px', padding: '22px', background: 'var(--calendar-hover)', borderRadius: '22px', border: '1px solid var(--border)' }}>
                                    <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-sub)', fontWeight: '700' }}>🔥 총 에너지 합계: <span style={{ color: '#ef4444' }}>{meal.CAL_INFO}</span></p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '70px 20px', border: '2px dashed var(--border)', borderRadius: '28px', color: '#9ca3af' }}>급식 정보가 없습니다.</div>
                        )}
                    </div>
                </section>
            )}
        </main>
    );
}
