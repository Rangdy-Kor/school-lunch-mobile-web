import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const officeCode = searchParams.get('officeCode');
    const schoolCode = searchParams.get('schoolCode');
    const date = searchParams.get('date');

    const res = await fetch(
        `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${date}`
    );
    const data = await res.json();
    return NextResponse.json(data.mealServiceDietInfo?.[1]?.row?.[0] || null);
}