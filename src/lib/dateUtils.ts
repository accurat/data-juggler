import dayjs from 'dayjs';
import { isString, isNumber, isDate } from 'lodash';

export const timestampToDate = (timestamp: number | string) => {
  return new Date(Number(timestamp) * 1000);
};

export const dateToTimestamp = (date: string | number | Date) => {
  if (isString(date)) {
    return Date.parse(date);
  } else if (isNumber(date)) {
    return dayjs(date * 1000).unix();
  } else if (isDate(date)) {
    return date.getTime();
  } else {
    throw new Error(`${date} is not a valid date format.`);
  }
};

// to remove
export const convertToUnix = <V extends string | number>(v: V): number => {
  if (isNumber(v)) {
    return dayjs(v * 1000).unix();
  } else {
    return dayjs(v).unix();
  }
};
