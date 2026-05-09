import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SchoolState {
    selectedOfficeCode: string;
    selectedSchool: {
        code: string;
        name: string;
        officeCode: string;
    } | null;
    setOffice: (code: string) => void;
    setSchool: (code: string, name: string, officeCode: string) => void;
}

export const useSchoolStore = create<SchoolState>()(
    persist(
        (set) => ({
            selectedOfficeCode: '',
            selectedSchool: null,
            setOffice: (code) => set({ selectedOfficeCode: code }),
            setSchool: (code, name, officeCode) =>
                set({ selectedSchool: { code, name, officeCode } }),
        }),
        { name: 'school-storage' } // 로컬 스토리지 유지
    )
);