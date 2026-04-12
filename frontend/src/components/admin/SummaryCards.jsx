import { memo } from 'react'
import { FiCalendar, FiClock, FiUser, FiUsers } from 'react-icons/fi'

const CARD_CONFIG = [
  {
    key: 'patients',
    title: 'Patients',
    countKey: 'totalPatients',
    colorClass: 'from-blue-500 to-sky-500',
    icon: FiUsers,
  },
  {
    key: 'doctors',
    title: 'Doctors',
    countKey: 'totalDoctors',
    colorClass: 'from-emerald-500 to-green-500',
    icon: FiUser,
  },
  {
    key: 'appointments',
    title: 'Appointments',
    countKey: 'totalAppointments',
    colorClass: 'from-violet-500 to-purple-500',
    icon: FiCalendar,
  },
  {
    key: 'pendingDoctors',
    title: 'Pending Doctor Verification',
    countKey: 'totalPendingDoctors',
    colorClass: 'from-amber-500 to-orange-500',
    icon: FiClock,
  },
]

function SummaryCards({ stats, onCardClick }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARD_CONFIG.map((card) => {
        const Icon = card.icon
        const count = Number(stats?.[card.countKey] || 0)

        return (
          <button
            type="button"
            key={card.key}
            onClick={() => onCardClick(card.key)}
            className="group rounded-xl text-left transition duration-200 hover:scale-[1.02]"
          >
            <div className={`rounded-xl bg-linear-to-br ${card.colorClass} p-5 shadow-lg transition group-hover:shadow-2xl`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/90">{card.title}</p>
                <span className="rounded-lg bg-white/20 p-2 text-white">
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">{count}</p>
              <p className="mt-1 text-sm text-white/90">{count === 0 ? `0 ${card.title}` : `${count} ${card.title}`}</p>
            </div>
          </button>
        )
      })}
    </section>
  )
}

export default memo(SummaryCards)
