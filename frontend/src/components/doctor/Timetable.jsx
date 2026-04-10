import { memo, useMemo } from 'react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

function Timetable({ value = [], editing = false, onToggle, onEditToggle, onSave }) {
  const timetable = Array.isArray(value) ? value : []

  const timetableMap = useMemo(() => {
    const nextMap = {}
    timetable.forEach((slot) => {
      if (!slot?.day || !slot?.timeSlot) return
      nextMap[`${slot.day}-${slot.timeSlot}`] = Boolean(slot.isAvailable)
    })
    return nextMap
  }, [timetable])

  return (
    <section className="w-full max-w-full overflow-hidden rounded-xl bg-white p-5 shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Doctor Timetable</h3>
          <p className="text-sm text-slate-500">Saved availability for each day and time slot.</p>
        </div>
        {(onEditToggle || onSave) && (
          <div className="flex gap-2">
            {onEditToggle && (
              <button
                type="button"
                onClick={onEditToggle}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {editing ? 'Cancel Edit' : 'Edit Timetable'}
              </button>
            )}
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={!editing}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Timetable
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 w-full max-w-full overflow-x-auto">
        <div className="w-full min-w-full max-w-full rounded-xl border border-slate-200 lg:min-w-275">
          <div className="grid grid-cols-[140px_repeat(13,minmax(58px,1fr))] bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div className="border-r border-slate-200 px-3 py-3">Day / Time</div>
            {TIME_SLOTS.map((time) => (
              <div key={time} className="border-r border-slate-200 px-2 py-3 text-center last:border-r-0">
                {time}
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-200">
            {DAYS.map((day) => (
              <div key={day} className="grid grid-cols-[140px_repeat(13,minmax(58px,1fr))]">
                <div className="border-r border-slate-200 bg-slate-50 px-3 py-4 font-medium text-slate-700">{day}</div>
                {TIME_SLOTS.map((time) => {
                  const key = `${day}-${time}`
                  const checked = timetableMap[key] || false

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!editing}
                      onClick={() => onToggle?.(day, time)}
                      className={`border-r border-slate-200 px-2 py-4 last:border-r-0 transition ${
                        checked ? 'bg-emerald-400' : 'bg-gray-200'
                      } ${editing ? 'hover:opacity-90' : 'cursor-default'}`}
                      aria-label={`${day} ${time} ${checked ? 'available' : 'not available'}`}
                    >
                      <input type="checkbox" checked={checked} readOnly className="pointer-events-none h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export { DAYS, TIME_SLOTS }
export default memo(Timetable)
