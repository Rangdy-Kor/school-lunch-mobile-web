import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const schoolName = searchParams.get('schoolName');

    if (!schoolName || schoolName.length < 2) {
        return NextResponse.json([]);
    }

    // ATPT_OFCDC_SC_CODE 파라미터를 제외하여 전국 단위로 검색
    const res = await fetch(
        `https://open.neis.go.kr/hub/schoolInfo?Type=json&SCHUL_NM=${encodeURIComponent(schoolName)}`
    );
    const data = await res.json();

    // API 응답 구조에 맞게 로우 데이터 추출
    const rows = data.schoolInfo?.[1]?.row || [];
    return NextResponse.json(rows);
}