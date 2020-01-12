export const timestampToDate = (timestamp: number | string) => {
  return new Date(Number(timestamp) * 1000)
}

export const dateToTimestamp = (date: string | Date) => {
  if(typeof date === 'string') {
    return Date.parse(date)
  } else if(date && Object.prototype.toString.call(date) === "[object Date]") {
    return date.getTime()
  } else {
    throw new Error(`${date} is not a valid date format.`)
  }
}