export type BusinessHourValue = {
  startTime: string
  endTime: string
  isOpen: boolean
}

export const DEFAULT_BUSINESS_HOURS: Record<number, BusinessHourValue> = {
  0: { startTime: '11:00', endTime: '20:00', isOpen: true },
  1: { startTime: '10:00', endTime: '22:00', isOpen: true },
  2: { startTime: '10:00', endTime: '22:00', isOpen: true },
  3: { startTime: '10:00', endTime: '22:00', isOpen: true },
  4: { startTime: '10:00', endTime: '22:00', isOpen: true },
  5: { startTime: '10:00', endTime: '22:00', isOpen: true },
  6: { startTime: '10:00', endTime: '22:00', isOpen: true },
}

export function getDefaultBusinessHours(weekday: number): BusinessHourValue {
  return DEFAULT_BUSINESS_HOURS[weekday] ?? DEFAULT_BUSINESS_HOURS[1]
}
