import { describe, it, expect } from 'vitest';
import {
  GROUP_ACADEMIC_METADATA,
  ACADEMIC_STAGES,
  ACADEMIC_HOLIDAYS,
  ACADEMIC_WEEKS,
  getAcademicWeekByNumber,
  getAcademicWeekByDate,
  getAcademicStageForDate,
  getHolidayForDate,
} from '../src/data/academicCalendar';

describe('Official KSU Academic Calendar (График учебного процесса 1 курса)', () => {
  it('has correct group metadata for 26-ИСбо-4', () => {
    expect(GROUP_ACADEMIC_METADATA.groupName).toBe('26-ИСбо-4');
    expect(GROUP_ACADEMIC_METADATA.faculty).toBe('ИВИТШ');
    expect(GROUP_ACADEMIC_METADATA.course).toBe(1);
    expect(GROUP_ACADEMIC_METADATA.academicYear).toBe('2026-2027');
    expect(GROUP_ACADEMIC_METADATA.studyPlan).toBe('B09030202_26_1_ИТ.plx');
  });

  it('contains exactly 52 calendar weeks for 2026-2027', () => {
    expect(ACADEMIC_WEEKS).toHaveLength(52);
    expect(ACADEMIC_WEEKS[0].weekNumber).toBe(1);
    expect(ACADEMIC_WEEKS[0].startDate).toBe('2026-08-31');
    expect(ACADEMIC_WEEKS[51].weekNumber).toBe(52);
  });

  it('properly classifies winter examination session (weeks 20-22)', () => {
    const w20 = getAcademicWeekByNumber(20);
    const w21 = getAcademicWeekByNumber(21);
    const w22 = getAcademicWeekByNumber(22);

    expect(w20?.primaryType).toBe('session');
    expect(w20?.primaryCode).toBe('Э');
    expect(w21?.primaryType).toBe('session');
    expect(w22?.primaryType).toBe('session');
  });

  it('properly classifies winter vacation (week 23)', () => {
    const w23 = getAcademicWeekByNumber(23);
    expect(w23?.primaryType).toBe('vacation');
    expect(w23?.primaryCode).toBe('К');
  });

  it('properly classifies summer session, practice, and vacation', () => {
    // Summer session: weeks 41-42
    const w41 = getAcademicWeekByNumber(41);
    const w42 = getAcademicWeekByNumber(42);
    expect(w41?.primaryType).toBe('session');
    expect(w42?.primaryType).toBe('session');

    // Practice: weeks 43-44
    const w43 = getAcademicWeekByNumber(43);
    const w44 = getAcademicWeekByNumber(44);
    expect(w43?.primaryType).toBe('practice');
    expect(w43?.primaryCode).toBe('У');
    expect(w44?.primaryType).toBe('practice');

    // Summer vacation: weeks 45-52
    const w45 = getAcademicWeekByNumber(45);
    const w52 = getAcademicWeekByNumber(52);
    expect(w45?.primaryType).toBe('vacation');
    expect(w45?.primaryCode).toBe('К');
    expect(w52?.primaryType).toBe('vacation');
  });

  it('correctly maps public holidays like 4 Nov, 23 Feb, 8 Mar, 1 May, 12 Jun', () => {
    const nov4 = getHolidayForDate(new Date(2026, 10, 4)); // Month 10 = Nov
    expect(nov4?.name).toBe('День народного единства');

    const feb23 = getHolidayForDate(new Date(2027, 1, 23)); // Month 1 = Feb
    expect(feb23?.name).toBe('День защитника Отечества');

    const mar8 = getHolidayForDate(new Date(2027, 2, 8)); // Month 2 = Mar
    expect(mar8?.name).toBe('Международный женский день');

    const may1 = getHolidayForDate(new Date(2027, 4, 1)); // Month 4 = May
    expect(may1?.name).toBe('Праздник Весны и Труда');

    const jun12 = getHolidayForDate(new Date(2027, 5, 12)); // Month 5 = Jun
    expect(jun12?.name).toBe('День России');
  });

  it('identifies stage for any given date in the semester', () => {
    const studyDate = new Date(2026, 9, 15); // Oct 15, 2026
    const stage = getAcademicStageForDate(studyDate);
    expect(stage?.id).toBe('sem1-theory');
    expect(stage?.semester).toBe(1);

    const sessionDate = new Date(2027, 0, 15); // Jan 15, 2027
    const sessionStage = getAcademicStageForDate(sessionDate);
    expect(sessionStage?.id).toBe('sem1-session');
    expect(sessionStage?.shortCode).toBe('Э');
  });
});
