import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineChatAlt2,
  HiOutlineClipboardCheck,
  HiOutlineDocumentReport,
  HiOutlineVideoCamera,
  HiOutlineCalendar,
  HiOutlinePencilAlt,
  HiOutlineUserGroup,
  HiOutlineArrowNarrowRight,
} from 'react-icons/hi'
import HomeNavbar from '../../components/home/HomeNavbar'
import ServiceCard from '../../components/home/ServiceCard'
import ServiceModal from '../../components/home/ServiceModal'
import HowItWorksStep from '../../components/home/HowItWorksStep'
import TestimonialsSlider from '../../components/home/TestimonialsSlider'
import HomeFooter from '../../components/home/HomeFooter'

const serviceItems = [
  {
    id: 'symptom-analysis',
    title: 'Symptom Analysis',
    description: 'Describe your symptoms and receive a fast AI-guided clinical summary.',
    icon: HiOutlineClipboardCheck,
    details:
      'Our symptom analysis engine transforms your input into a structured report that highlights potential causes, severity indicators, and suggested next steps for care.',
    workflow:
      'You enter symptoms and duration, the system maps clinical signals, then a prioritized report is generated for you and your doctor before consultation.',
  },
  {
    id: 'book-appointment',
    title: 'Book Appointment',
    description: 'Choose specialists, compare time slots, and confirm in seconds.',
    icon: HiOutlineCalendar,
    details:
      'Find verified doctors by specialty and language preference, then reserve a slot with automatic reminders and appointment readiness prompts.',
    workflow:
      'You select a specialty, pick an available doctor and time, receive instant confirmation, and get reminders before your visit.',
  },
  {
    id: 'chat-consultation',
    title: 'Chat Consultation',
    description: 'Connect securely with doctors through guided in-app messaging.',
    icon: HiOutlineChatAlt2,
    details:
      'Start a confidential chat session where doctors can review your symptom summary, ask focused follow-up questions, and guide immediate care decisions.',
    workflow:
      'After booking, you open chat, share updates, receive doctor feedback, and continue follow-up messages until your consultation completes.',
  },
  {
    id: 'report-generation',
    title: 'Report Generation',
    description: 'Generate and store clean medical reports for future consultations.',
    icon: HiOutlineDocumentReport,
    details:
      'Every consultation produces structured reports with symptom timeline, clinician notes, and recommendations that can be referenced in future visits.',
    workflow:
      'Once consultation ends, your report is generated automatically, reviewed in-app, and archived in your health record library.',
  },
  {
    id: 'video-consultation',
    title: 'Video Consultation',
    description: 'Meet your doctor face-to-face through stable virtual sessions.',
    icon: HiOutlineVideoCamera,
    details:
      'Launch HD video sessions directly from your appointment dashboard for real-time doctor interactions and visual check-ins.',
    workflow:
      'At appointment time, you join with one tap, consult your doctor live, and receive recommendations with report updates.',
  },
]

const steps = [
  {
    number: 1,
    title: 'Enter Symptoms',
    description: 'Answer a few guided questions so our AI can understand your condition clearly.',
    icon: HiOutlinePencilAlt,
  },
  {
    number: 2,
    title: 'Get AI Report',
    description: 'Receive a concise report with key observations and care recommendations.',
    icon: HiOutlineDocumentReport,
  },
  {
    number: 3,
    title: 'Connect Doctor',
    description: 'Share your report with a certified doctor and continue with informed treatment.',
    icon: HiOutlineUserGroup,
  },
]

const testimonials = [
  { id: 1, name: 'Ava Thompson', feedback: 'The symptom summary helped my doctor diagnose faster than ever.', rating: 5 },
  { id: 2, name: 'Lucas Hall', feedback: 'Booking and follow-up chat were smooth and very reassuring.', rating: 5 },
  { id: 3, name: 'Emma Patel', feedback: 'I felt supported through every step, especially during video visits.', rating: 4 },
  { id: 4, name: 'Noah Rivera', feedback: 'Clear reports made it easy to track my recovery progress.', rating: 5 },
  { id: 5, name: 'Sophia Bennett', feedback: 'The platform saved me time and reduced clinic waiting stress.', rating: 4 },
  { id: 6, name: 'Mason Kim', feedback: 'Excellent experience, from symptom input to doctor connection.', rating: 5 },
  { id: 7, name: 'Isabella Reed', feedback: 'I appreciate the clean interface and practical care guidance.', rating: 5 },
  { id: 8, name: 'Elijah Morris', feedback: 'Quick, reliable, and very professional telehealth support.', rating: 4 },
  { id: 9, name: 'Mia Collins', feedback: 'It helped me explain my symptoms accurately before my consult.', rating: 5 },
]

function HomePage() {
  const [selectedServiceId, setSelectedServiceId] = useState(null)

  const selectedService = useMemo(
    () => serviceItems.find((item) => item.id === selectedServiceId) || null,
    [selectedServiceId]
  )

  return (
    <div id="top" className="min-h-screen bg-linear-to-b from-sky-50/70 via-white to-emerald-50/50 text-slate-900">
      <HomeNavbar />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute -left-20 top-14 h-60 w-60 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute -right-24 top-24 h-64 w-64 rounded-full bg-emerald-200/50 blur-3xl" />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
            <div className="animate-[fadeIn_0.7s_ease-out]">
              <p className="inline-flex rounded-full border border-sky-200 bg-sky-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700">
                AI-Powered Healthcare Companion
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                Smart Healthcare Starts With Your Symptoms
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                SymptoNarrator helps you describe symptoms better, get faster medical clarity, and connect with trusted doctors from anywhere.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-700"
                >
                  Get Started Today
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-xl border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  Book Appointment
                </Link>
              </div>
            </div>

            <div className="animate-[fadeIn_0.9s_ease-out]">
              <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl shadow-sky-100">
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80"
                  alt="Doctor discussing care with a patient"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">What We Offer</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Our Services</h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {serviceItems.map((service) => (
              <ServiceCard
                key={service.id}
                icon={service.icon}
                title={service.title}
                description={service.description}
                onLearnMore={() => setSelectedServiceId(service.id)}
              />
            ))}
          </div>
        </section>

        <section id="how-it-works" className="bg-slate-50/70 py-16 lg:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Simple Process</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">How It Works</h2>
            </div>

            <div className="relative mt-10 grid gap-6 lg:grid-cols-3">
              <div className="absolute left-[16%] right-[16%] top-5.5 hidden h-0.5 bg-linear-to-r from-sky-200 via-emerald-300 to-sky-200 lg:block" />
              {steps.map((step) => (
                <HowItWorksStep
                  key={step.number}
                  number={step.number}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">Patient Stories</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">What Our Patients Say</h2>
          </div>
          <TestimonialsSlider testimonials={testimonials} />
        </section>

        <section id="about" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="overflow-hidden rounded-3xl bg-linear-to-r from-sky-600 via-sky-700 to-emerald-600 p-8 text-center text-white shadow-2xl shadow-sky-200 sm:p-12">
            <h3 className="text-3xl font-bold sm:text-4xl">Take control of your health today</h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-sky-50 sm:text-base">
              Join thousands of users who start with better symptom narration and move toward faster, confident clinical care.
            </p>
            <Link
              to="/login"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-sky-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50"
            >
              Get Started Now
              <HiOutlineArrowNarrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <HomeFooter />

      <ServiceModal service={selectedService} onClose={() => setSelectedServiceId(null)} />
    </div>
  )
}

export default HomePage
