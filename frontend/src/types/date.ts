import { Dayjs } from 'dayjs';

export type RangeValue<T = Dayjs> = [T | null, T | null] | null;

export interface DateRange {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
}

export type DateRangeValue = RangeValue<Dayjs>; 