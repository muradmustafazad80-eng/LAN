export function parseLocalDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6] ?? '0')
  const candidate = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day ||
    candidate.getUTCHours() !== hour ||
    candidate.getUTCMinutes() !== minute ||
    candidate.getUTCSeconds() !== second
  ) return null
  return { year, month, day, hour, minute, second }
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone)
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return asUtc - date.getTime()
}

export function zonedDateTimeToDate(value: string, timeZone: string) {
  const local = parseLocalDateTime(value)
  if (!local) return null
  const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second)
  let result = new Date(localAsUtc - getTimeZoneOffsetMs(new Date(localAsUtc), timeZone))
  const correctedOffset = getTimeZoneOffsetMs(result, timeZone)
  result = new Date(localAsUtc - correctedOffset)
  return Number.isNaN(result.getTime()) ? null : result
}

export function localDateTimeToDate(value: string, timeZone = 'Asia/Baku') {
  return zonedDateTimeToDate(value, timeZone)
}

export function getZonedParts(date: Date, timeZone: string) {
  return getTimeZoneParts(date, timeZone)
}

export function getZonedDateAndTime(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone)
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    time: `${pad(parts.hour)}:${pad(parts.minute)}`,
    weekday: new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay(),
  }
}

export function dateToLocalParts(date: Date, timeZone = 'Asia/Baku') {
  const zoned = getZonedDateAndTime(date, timeZone)
  return { date: zoned.date, time: zoned.time }
}

export function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

export function isSameCalendarDay(a: Date, b: Date, timeZone = 'Asia/Baku') {
  return dateToLocalParts(a, timeZone).date === dateToLocalParts(b, timeZone).date
}
