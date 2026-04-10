import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function ChartCard({ title, data, bars }) {
  const hasValues = data.some((item) => bars.some((bar) => Number(item[bar.dataKey] || 0) > 0))

  return (
    <div className="rounded-xl bg-white p-4 shadow-lg sm:p-5">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <div className="mt-4 h-72">
        {!hasValues ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            No data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0' }}
              />
              <Legend />
              {bars.map((bar) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  fill={bar.color}
                  radius={[6, 6, 0, 0]}
                  animationDuration={700}
                  name={bar.name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function Charts({ stats }) {
  const monthlyPatientRegistrations = stats?.monthlyPatientRegistrations || []
  const monthlyDoctorRegistrations = stats?.monthlyDoctorRegistrations || []
  const monthlyAppointmentsCreated = stats?.monthlyAppointmentsCreated || []
  const appointmentOutcome = stats?.appointmentOutcome || []

  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Monthly Patient Registrations"
        data={monthlyPatientRegistrations}
        bars={[{ dataKey: 'count', name: 'Patients', color: '#3b82f6' }]}
      />
      <ChartCard
        title="Monthly Doctor Registrations"
        data={monthlyDoctorRegistrations}
        bars={[{ dataKey: 'count', name: 'Doctors', color: '#10b981' }]}
      />
      <ChartCard
        title="Monthly Appointments Created"
        data={monthlyAppointmentsCreated}
        bars={[{ dataKey: 'count', name: 'Appointments', color: '#8b5cf6' }]}
      />
      <ChartCard
        title="Appointments Accepted / Rejected"
        data={appointmentOutcome}
        bars={[
          { dataKey: 'accepted', name: 'Accepted', color: '#22c55e' },
          { dataKey: 'rejected', name: 'Rejected', color: '#f97316' },
        ]}
      />
    </section>
  )
}

export default Charts
