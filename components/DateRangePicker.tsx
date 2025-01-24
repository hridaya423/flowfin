'use client'

import { format } from 'date-fns'

interface DateRangePickerProps {
  startDate: Date
  endDate: Date
  onDateChange: (start: Date, end: Date) => void
}

export default function DateRangePicker({ startDate, endDate, onDateChange }: DateRangePickerProps) {
  return (
    <div className="flex items-end gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
        <input
          type="date"
          value={format(startDate, 'yyyy-MM-dd')}
          onChange={(e) => onDateChange(new Date(e.target.value), endDate)}
          className="block w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-gray-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
        <input
          type="date"
          value={format(endDate, 'yyyy-MM-dd')}
          onChange={(e) => onDateChange(startDate, new Date(e.target.value))}
          className="block w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-gray-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        />
      </div>
    </div>
  )
}