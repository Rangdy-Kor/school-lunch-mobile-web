// 시도 교육청 정보
export interface Office {
    code: string;
    name: string;
}

// 학교 검색 결과
export interface School {
    ATPT_OFCDC_SC_CODE: string; // 시도교육청코드
    SD_SCHUL_CODE: string;      // 표준학교코드
    SCHUL_NM: string;           // 학교명
    ORG_RDNMA: string;          // 도로명주소
}

// 급식 정보
export interface MealInfo {
    MLSV_YMD: string;           // 급식일자
    DDISH_NM: string;           // 요리명
    ORPLC_INFO: string;         // 원산지정보
    CAL_INFO: string;           // 칼로리정보
    NTR_INFO: string;           // 영양정보
}