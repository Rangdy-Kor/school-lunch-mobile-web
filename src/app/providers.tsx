'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    // 캐싱 및 데이터 페칭 설정을 담은 클라이언트 생성
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000 * 5, // 5분간 데이터를 신선한 상태로 유지
                retry: 1, // 실패 시 1회 재시도
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}