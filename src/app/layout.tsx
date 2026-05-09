import '../styles/globals.css'; // 전역 스타일 로드
import type { Metadata } from 'next';
import Providers from './providers'; // TanStack Query 설정용 (아래 참고)

export const metadata: Metadata = {
    title: '오늘의 학교 급식',
    description: '우리 학교 급식 메뉴를 모바일에서 확인하세요.',
    // 모바일에서 줌 기능을 제어하고 화면 너비에 맞게 설정
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: '학교급식',
    },
  };
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <head>
                {/* 모바일 최적화를 위한 메타 태그들이 여기 포함됩니다 */}
            </head>
            <body>
                {/* React Query 상태를 공유하기 위한 Provider 감싸기 */}
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}