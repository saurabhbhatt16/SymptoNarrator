import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import Fuse from "fuse.js";
import { toast } from "react-toastify";
import { logout } from "../../redux/authSlice";
import { setAuth } from "../../redux/authSlice";
import {
  cancelAppointmentApi,
  getPatientAppointmentsApi,
  rescheduleAppointmentApi,
} from "../../services/appointment.service";
import {
  analyzeSymptomsApi,
  predictDiseaseApi,
} from "../../services/ai.service";
import {
  getPatientProfileApi,
  updatePatientProfileApi,
} from "../../services/patient.service";
import EditProfileModal from "../../components/patient/EditProfileModal";
import ProfileCard from "../../components/patient/ProfileCard";
import QuestionFlow from "../../components/patient/QuestionFlow";
import ReportCard from "../../components/patient/ReportCard";
import SummaryCards from "../../components/patient/SummaryCards";
import AppointmentDashboardCard from "../../components/patient/AppointmentDashboardCard";
import {
  createMyReportApi,
  getMyReportsApi,
} from "../../services/report.service";
import {
  isAppointmentCompletedForView,
  isAppointmentUpcomingForView,
} from "../../utils/appointmentTime";
import { processSymptomInput } from "../../utils/symptomInputProcessor";
import { FiBell } from "react-icons/fi";

const PATIENT_FORM_KEY = "patientForm";
const PATIENT_APPOINTMENT_NOTIFICATIONS_KEY = "patientAppointmentNotifications";

const SYMPTOM_DATASET = [
  "dizziness",
  "headache",
  "fever",
  "cough",
  "cold",
  "sore throat",
  "fatigue",
  "nausea",
  "vomiting",
  "diarrhea",
  "stomach pain",
  "chest pain",
  "shortness of breath",
  "body pain",
  "back pain",
  "joint pain",
  "loss of appetite",
  "runny nose",
  "sneezing",
  "chills",
  "weakness",
  "anxiety",
  "insomnia",
  "blurred vision",
];

const symptomFuse = new Fuse(SYMPTOM_DATASET, {
  includeScore: true,
  threshold: 0.4,
});

function correctExtractedKeywords(keywords = []) {
  const corrected = (keywords || [])
    .map((word) =>
      String(word || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean)
    .map((word) => {
      const result = symptomFuse.search(word);
      if (!result.length) return word;

      const best = result[0];
      // Keep original keyword when fuzzy confidence is weak to avoid harmful rewrites.
      return best.score != null && best.score <= 0.28
        ? String(best.item || word).toLowerCase()
        : word;
    });

  return [...new Set(corrected)];
}

function extractSymptomsFromText(value) {
  return String(value || "")
    .split(/[,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getNotificationStorageKey(user) {
  const identifier = user?.id || user?.email || user?.name || "anonymous";
  return `${PATIENT_APPOINTMENT_NOTIFICATIONS_KEY}_${identifier}`;
}

function getStoredNotifications(user) {
  const key = getNotificationStorageKey(user);
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function setStoredNotifications(user, notifications) {
  const key = getNotificationStorageKey(user);
  localStorage.setItem(key, JSON.stringify(notifications));
}

function getMinutesUntil(dateValue) {
  const appointmentMs = new Date(dateValue).getTime();
  if (!Number.isFinite(appointmentMs)) return Number.POSITIVE_INFINITY;
  return (appointmentMs - Date.now()) / (1000 * 60);
}

function buildAppointmentNotifications(appointments, existingNotifications) {
  const existingKeys = new Set(
    (existingNotifications || []).map((item) => item.key),
  );
  const additions = [];

  appointments.forEach((appointment) => {
    const doctorName = appointment.doctor?.fullName || "Doctor";
    const appointmentDate = new Date(appointment.date);
    const displayDate = Number.isFinite(appointmentDate.getTime())
      ? appointmentDate.toLocaleString()
      : "the selected time";

    const requestKey = `request-${appointment.id}`;
    if (!existingKeys.has(requestKey)) {
      additions.push({
        key: requestKey,
        message: `Appointment request sent to the doctor (${doctorName}) for ${displayDate}.`,
        createdAt:
          appointment.createdAt ||
          appointment.updatedAt ||
          new Date().toISOString(),
        isRead: false,
      });
      existingKeys.add(requestKey);
    }

    if (
      appointment.status === "accepted" ||
      appointment.status === "completed"
    ) {
      const acceptedKey = `accepted-${appointment.id}`;
      if (!existingKeys.has(acceptedKey)) {
        additions.push({
          key: acceptedKey,
          message: `Doctor accepted the appointment request. Be ready at ${displayDate}.`,
          createdAt: appointment.updatedAt || new Date().toISOString(),
          isRead: false,
        });
        existingKeys.add(acceptedKey);
      }
    }

    if (["pending", "accepted"].includes(appointment.status)) {
      const minutesUntilAppointment = getMinutesUntil(appointment.date);
      const reminderKey = `reminder-30-${appointment.id}`;
      if (
        minutesUntilAppointment > 0 &&
        minutesUntilAppointment <= 30 &&
        !existingKeys.has(reminderKey)
      ) {
        additions.push({
          key: reminderKey,
          message: `Be ready to meet the doctor in 30 mins. (${doctorName})`,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
        existingKeys.add(reminderKey);
      }
    }
  });

  return additions;
}

function PatientDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role, token } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({
    symptoms: "",
    duration: "",
    previousIllness: "",
  });
  const [report, setReport] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [summaryModal, setSummaryModal] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rescheduleValues, setRescheduleValues] = useState({});
  const [rescheduleOpenId, setRescheduleOpenId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);
  const hasFetchedReportsRef = useRef(false);
  const hasLoadedDashboardRef = useRef(false);

  const fetchReports = async (forceRefresh = false) => {
    if (hasFetchedReportsRef.current) return;
    hasFetchedReportsRef.current = true;

    try {
      const reportsResponse = await getMyReportsApi({ forceRefresh });
      const nextReports = Array.isArray(reportsResponse?.data)
        ? reportsResponse.data
        : [];
      setPredictions(nextReports);
    } catch (_error) {
      setPredictions([]);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [profileResponse, appointmentsResponse] = await Promise.all([
        getPatientProfileApi(),
        getPatientAppointmentsApi(),
      ]);

      const nextProfile = profileResponse;
      setProfile(nextProfile);
      const nextAppointments = appointmentsResponse.data || [];
      setAppointments(nextAppointments);

      const existingNotifications = getStoredNotifications(user);
      const generatedNotifications = buildAppointmentNotifications(
        nextAppointments,
        existingNotifications,
      );
      const mergedNotifications = [
        ...generatedNotifications,
        ...existingNotifications,
      ]
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        )
        .slice(0, 30);

      setNotifications(mergedNotifications);
      setStoredNotifications(user, mergedNotifications);

      dispatch(
        setAuth({
          user: {
            ...user,
            name:
              nextProfile.user?.name ||
              nextProfile.fullName ||
              nextProfile.name ||
              user?.name,
            needsOnboarding: false,
          },
          role: role || nextProfile?.user?.role || user?.role || "patient",
          token,
        }),
      );
    } catch (requestError) {
      const status = requestError?.response?.status;
      if (status === 403 || status === 401) {
        setError("");
        dispatch(logout());
        navigate("/login");
        toast.error("Session expired. Please log in again.");
        return;
      }

      console.error(requestError);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    if (hasLoadedDashboardRef.current) return;
    hasLoadedDashboardRef.current = true;

    const savedForm = localStorage.getItem(PATIENT_FORM_KEY);

    setSummaryModal(null);

    if (savedForm) {
      try {
        const restoredAnswers = JSON.parse(savedForm);
        setAnswers((current) => ({ ...current, ...restoredAnswers }));
      } catch (_error) {
        localStorage.removeItem(PATIENT_FORM_KEY);
      }
    }

    loadDashboard();
  }, [user?.id]);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    localStorage.setItem(PATIENT_FORM_KEY, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleToggleNotifications = () => {
    setNotificationOpen((current) => {
      const next = !current;
      if (!current) {
        const markedAsRead = notifications.map((item) => ({
          ...item,
          isRead: true,
        }));
        setNotifications(markedAsRead);
        setStoredNotifications(user, markedAsRead);
      }
      return next;
    });
  };

  const fullName = profile?.fullName || profile?.name || user?.name || "...";
  const hasAppointment = appointments.length > 0;

  const lastPrediction = predictions[0] || null;
  const upcomingAppointments = useMemo(() => {
    const now = Date.now();
    return appointments.filter((item) =>
      isAppointmentUpcomingForView(item, now),
    );
  }, [appointments]);

  const totalAppointments = useMemo(() => {
    const now = Date.now();
    return appointments.filter((item) =>
      isAppointmentCompletedForView(item, now),
    );
  }, [appointments]);

  const stats = useMemo(() => {
    const lastPredictionLabel =
      lastPrediction?.diagnosis?.diseaseName ||
      lastPrediction?.disease ||
      "No prediction yet";

    return {
      upcomingCount: upcomingAppointments.length,
      totalCount: totalAppointments.length,
      lastPrediction: lastPredictionLabel,
      lastPredictionData: lastPrediction,
      upcomingDetails: upcomingAppointments.map(
        (item) =>
          `${item.doctor?.fullName || "Doctor"} - ${new Date(item.date).toLocaleString()}`,
      ),
      totalDetails: totalAppointments.map(
        (item) =>
          `${item.doctor?.fullName || "Doctor"} - ${new Date(item.date).toLocaleString()}`,
      ),
      predictionDetails: lastPrediction
        ? [
            `Disease: ${lastPrediction?.diagnosis?.diseaseName || "--"}`,
            `Severity: ${lastPrediction?.diagnosis?.severity || "--"}`,
            `Category: ${lastPrediction?.diagnosis?.category || "--"}`,
            `${lastPrediction.date || ""} ${lastPrediction.time ? `| ${lastPrediction.time}` : ""}`,
          ]
        : ["Generate a report to see prediction details."],
    };
  }, [lastPrediction, totalAppointments, upcomingAppointments]);

  const symptomSuggestionPool = useMemo(() => {
    const fromReports = predictions
      .flatMap((item) => extractSymptomsFromText(item?.form?.symptoms))
      .filter(Boolean);

    return [...new Set([...SYMPTOM_DATASET, ...fromReports])];
  }, [predictions]);

  const symptomHistory = useMemo(() => {
    return [
      ...new Set(
        predictions.flatMap((item) =>
          extractSymptomsFromText(item?.form?.symptoms),
        ),
      ),
    ].slice(0, 20);
  }, [predictions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <main className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
          <p className="text-center text-slate-600">Loading...</p>
        </main>
      </div>
    );
  }

  const handleAnswerChange = (key, value) => {
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  const handleCancelAppointment = (id) => {
    setCancelConfirmId(id);
  };

  const confirmCancelAppointment = async () => {
    if (!cancelConfirmId) return;

    setActionLoadingId(cancelConfirmId);
    try {
      await cancelAppointmentApi(cancelConfirmId);
      setCancelConfirmId(null);
      await loadDashboard();
      toast.success("Appointment cancelled");
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message || "Failed to cancel appointment",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRescheduleAppointment = async (id) => {
    const newDate = rescheduleValues[id];
    if (!newDate) {
      toast.error("Please choose a new date and time");
      return;
    }

    const confirmed = window.confirm("Confirm reschedule appointment?");
    if (!confirmed) return;

    setActionLoadingId(id);
    try {
      await rescheduleAppointmentApi(id, new Date(newDate).toISOString());
      setRescheduleValues((current) => ({ ...current, [id]: "" }));
      setRescheduleOpenId(null);
      await loadDashboard();
      toast.success("Appointment rescheduled");
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          "Failed to reschedule appointment",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const saveToHistory = (reportData) => {
    setPredictions((current) => {
      const deduped = current.filter(
        (item) => item.generatedAt !== reportData.generatedAt,
      );
      return [reportData, ...deduped];
    });
  };

  const downloadPDF = () => {
    if (!report) return;

    const reportDate = report.generatedAt
      ? new Date(report.generatedAt)
      : new Date();
    const treatmentPlan = report.treatmentPlan || [];
    const medicines = report.medicines || [];

    const doc = new jsPDF();
    let y = 12;

    doc.setFontSize(16);
    doc.text("Patient Report", 10, y);
    y += 8;

    doc.setFontSize(11);
    doc.text(
      `Date: ${reportDate.toLocaleDateString()} ${reportDate.toLocaleTimeString()}`,
      10,
      y,
    );
    y += 8;

    doc.setFontSize(13);
    doc.text("Patient Details", 10, y);
    y += 6;
    doc.setFontSize(11);
    doc.text(`Name: ${report.patient?.name || "--"}`, 10, y);
    y += 5;
    doc.text(`Age: ${report.patient?.age ?? "--"}`, 10, y);
    y += 5;
    doc.text(`Gender: ${report.patient?.gender || "--"}`, 10, y);
    y += 5;
    doc.text(`Phone: ${report.patient?.phone || "--"}`, 10, y);
    y += 8;

    doc.setFontSize(13);
    doc.text("Form Details", 10, y);
    y += 6;
    doc.setFontSize(11);
    doc.text(`Symptoms: ${report.form?.symptoms || "--"}`, 10, y);
    y += 5;
    doc.text(`Duration: ${report.form?.durationDays ?? "--"} day(s)`, 10, y);
    y += 5;
    doc.text(
      `Previous Illness: ${report.form?.previousIllness || "--"}`,
      10,
      y,
    );
    y += 8;

    doc.setFontSize(13);
    doc.text("Diagnosis", 10, y);
    y += 6;
    doc.setFontSize(11);
    doc.text(`Disease: ${report.diagnosis?.diseaseName || "--"}`, 10, y);
    y += 5;
    doc.text(
      `Specialist Doctor: ${report.diagnosis?.specialistDoctor || "--"}`,
      10,
      y,
    );
    y += 5;
    doc.text(`Severity: ${report.diagnosis?.severity || "--"}`, 10, y);
    y += 5;
    doc.text(`Category: ${report.diagnosis?.category || "--"}`, 10, y);
    const prevalence = String(report.diagnosis?.prevalence || "").trim();
    if (prevalence && prevalence.toLowerCase() !== "not specified") {
      y += 5;
      doc.text(`Prevalence: ${prevalence}`, 10, y);
    }
    y += 5;
    doc.text(
      `Recovery: ${report.recovery?.estimatedRange || `${report.recovery?.minDays || "--"} - ${report.recovery?.maxDays || "--"} days`}`,
      10,
      y,
    );
    y += 8;

    doc.setFontSize(13);
    doc.text("Treatment Plan", 10, y);
    y += 6;
    doc.setFontSize(11);
    if (treatmentPlan.length > 0) {
      treatmentPlan.forEach((line) => {
        doc.text(`- ${line}`, 10, y);
        y += 5;
      });
    } else {
      doc.text("No treatment plan available.", 10, y);
      y += 5;
    }
    y += 3;

    doc.setFontSize(13);
    doc.text("Suggested Medicines", 10, y);
    y += 6;
    doc.setFontSize(11);
    doc.text(
      medicines.length > 0
        ? medicines.join(", ")
        : "No suggested medicines available.",
      10,
      y,
    );
    y += 8;

    doc.setFontSize(13);
    doc.text("Summary", 10, y);
    y += 6;
    doc.setFontSize(11);
    const summaryForPdf =
      report.translatedSummary ||
      report.translated_summary ||
      report.summary ||
      "Summary not available.";
    const wrappedSummary = doc.splitTextToSize(
      summaryForPdf,
      180,
    );
    doc.text(wrappedSummary, 10, y);

    doc.save("report.pdf");
  };

  const generateReport = async () => {
    const symptoms = answers.symptoms?.trim();
    const duration = answers.duration?.trim();
    const previousIllnessInput = answers.previousIllness?.trim();

    if (!symptoms || !duration || !previousIllnessInput) {
      toast.error("Please fill all details");
      return;
    }

    setIsGenerating(true);
    try {
      const processedInputPayload = processSymptomInput({
        input: symptoms,
        knownSymptoms: SYMPTOM_DATASET,
      });
      const extractedKeywords = correctExtractedKeywords(
        processedInputPayload.symptoms,
      );
      const keywordSymptomsText = extractedKeywords.join(", ");
      const displaySymptomsText =
        processedInputPayload.processed_input || keywordSymptomsText;

      if (extractedKeywords.length === 0) {
        toast.error(
          "No matching symptom keywords found. Please use clearer symptom words (Hindi or English).",
        );
        return;
      }

      const parsedDuration = Number.parseInt(duration, 10);
      if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
        toast.error("Duration must be a valid number of days");
        return;
      }

      const phone = profile?.phone || user?.phone || "";
      const previousIllness = previousIllnessInput || "None";
      const patientAge = profile?.age ?? "--";
      const patientGender = profile?.gender || "--";
      const now = new Date();
      let reportPersisted = false;
      let persistedViaCreateEndpoint = false;

      let reportData;
      try {
        const analysisResponse = await analyzeSymptomsApi({
          original_input: processedInputPayload.original_input,
          processed_input: processedInputPayload.processed_input,
          symptoms: extractedKeywords,
          days: parsedDuration,
        });
        reportPersisted = Boolean(analysisResponse?.savedReport?.id);
        const analysis = analysisResponse?.data;

        if (!analysis || analysis.status !== "success") {
          throw new Error(analysis?.error || "Unable to generate report");
        }

        reportData = {
          patient: {
            name: fullName,
            age: analysis?.patient?.age ?? patientAge,
            gender: analysis?.patient?.gender || patientGender,
            phone,
          },
          form: {
            symptoms: displaySymptomsText,
            durationDays: parsedDuration,
            previousIllness,
            originalInput: processedInputPayload.original_input,
            processedInput: processedInputPayload.processed_input,
            extractedKeywords,
          },
          diagnosis: {
            diseaseName:
              analysis?.diagnosis?.disease_name || "General health concern",
            severity: analysis?.severity?.level || "Moderate",
            category: analysis?.diagnosis?.category || "General",
            prevalence: analysis?.diagnosis?.prevalence || "",
            specialistDoctor:
              analysis?.specialist_required || "General Physician",
            diseaseType: analysis?.diagnosis?.type || "General",
          },
          recovery: {
            minDays: analysis?.recovery?.min_days ?? null,
            maxDays: analysis?.recovery?.max_days ?? null,
            estimatedRange: analysis?.recovery?.estimated_range || "",
          },
          treatmentPlan: Array.isArray(analysis?.treatment?.plan)
            ? analysis.treatment.plan
            : [],
          medicines: Array.isArray(analysis?.treatment?.medicines)
            ? analysis.treatment.medicines
            : [],
          summary: analysis?.summary || "Summary not available.",
          translatedSummary:
            analysis?.translated_summary ||
            analysis?.summary ||
            "Summary not available.",
          generatedAt: now.toISOString(),
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString(),
        };
      } catch (_analysisError) {
        let prediction = {};
        try {
          const predictionResponse = await predictDiseaseApi({
            original_input: processedInputPayload.original_input,
            processed_input: processedInputPayload.processed_input,
            symptoms: extractedKeywords,
          });
          prediction = predictionResponse?.data || {};
        } catch (_predictionError) {
          prediction = {};
        }

        const loweredSymptoms = keywordSymptomsText.toLowerCase();
        const hasCardioPattern =
          loweredSymptoms.includes("chest pain") ||
          loweredSymptoms.includes("chest tightness") ||
          loweredSymptoms.includes("chest pressure") ||
          loweredSymptoms.includes("pressure") ||
          loweredSymptoms.includes("radiating arm pain") ||
          loweredSymptoms.includes("arm pain");

        const heuristicDisease =
          hasCardioPattern || loweredSymptoms.includes("breath")
            ? "Angina"
            : loweredSymptoms.includes("fever") ||
                loweredSymptoms.includes("cough")
              ? "Possible Viral Infection"
              : loweredSymptoms.includes("headache")
                ? "Possible Tension Headache"
                : "General health concern";

        const heuristicCategory =
          hasCardioPattern || loweredSymptoms.includes("breath")
            ? "Cardiovascular"
            : loweredSymptoms.includes("fever") ||
                loweredSymptoms.includes("cough")
              ? "Respiratory"
              : "General";

        const heuristicSeverity =
          loweredSymptoms.includes("chest pain") ||
          loweredSymptoms.includes("breath")
            ? "High"
            : parsedDuration > 7
              ? "Moderate"
              : "Mild";

        const treatmentPlan = String(
          prediction?.treatment_plan ||
            prediction?.treatment ||
            "Rest;Stay hydrated;Monitor symptoms;Consult doctor if condition worsens",
        )
          .split(";")
          .map((line) => line.trim())
          .filter(Boolean);

        const medicines = String(prediction?.medicines || "Paracetamol;ORS")
          .split(";")
          .map((line) => line.trim())
          .filter(Boolean);

        const fallbackSeverity = prediction?.severity || heuristicSeverity;
        const fallbackCategory =
          prediction?.disease_category ||
          prediction?.category ||
          prediction?.specialist_doctor ||
          heuristicCategory;

        const fallbackDisease =
          prediction?.disease_name || prediction?.disease || heuristicDisease;
        const fallbackSpecialist =
          prediction?.specialist_doctor ||
          (hasCardioPattern ? "Cardiologist" : "General Physician");
        const fallbackPrevalence = prediction?.prevalence || "";
        const fallbackMinDays = Number.isFinite(
          Number(prediction?.min_recovery_days),
        )
          ? Number(prediction.min_recovery_days)
          : hasCardioPattern
            ? 30
            : null;
        const fallbackMaxDays = Number.isFinite(
          Number(prediction?.max_recovery_days),
        )
          ? Number(prediction.max_recovery_days)
          : hasCardioPattern
            ? 60
            : null;

        const fallbackSummary =
          `${fullName} (${patientAge}, ${String(patientGender).toLowerCase()}) has reported ${displaySymptomsText} for ${parsedDuration} day(s). ` +
          `The most likely disease pattern is ${fallbackDisease} under the ${fallbackCategory} category, with a severity level of ${fallbackSeverity}. ` +
          `${fallbackPrevalence ? `The disease prevalence is marked as ${fallbackPrevalence}. ` : ""}` +
          `Suggested specialist doctor is ${fallbackSpecialist}. ` +
          `${
            fallbackMinDays !== null && fallbackMaxDays !== null
              ? `Estimated recovery may take ${fallbackMinDays} to ${fallbackMaxDays} days depending on response to treatment.`
              : "Recovery duration should be confirmed after specialist evaluation."
          }`;

        reportData = {
          patient: {
            name: fullName,
            age: patientAge,
            gender: patientGender,
            phone,
          },
          form: {
            symptoms: displaySymptomsText,
            durationDays: parsedDuration,
            previousIllness,
            originalInput: processedInputPayload.original_input,
            processedInput: processedInputPayload.processed_input,
            extractedKeywords,
          },
          diagnosis: {
            diseaseName: fallbackDisease,
            severity: fallbackSeverity,
            category: fallbackCategory,
            prevalence: fallbackPrevalence,
            specialistDoctor: fallbackSpecialist,
            diseaseType: prediction?.disease_type || "General",
          },
          recovery: {
            minDays: fallbackMinDays,
            maxDays: fallbackMaxDays,
            estimatedRange:
              fallbackMinDays !== null && fallbackMaxDays !== null
                ? `${fallbackMinDays} - ${fallbackMaxDays} days`
                : "",
          },
          treatmentPlan,
          medicines,
          summary: fallbackSummary,
          generatedAt: now.toISOString(),
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString(),
        };
      }

      if (!reportPersisted) {
        try {
          await createMyReportApi(reportData);
          reportPersisted = true;
          persistedViaCreateEndpoint = true;
        } catch (_saveError) {
          reportPersisted = false;
        }
      }

      setReport(reportData);
      setPredictions((current) => {
        const deduped = current.filter(
          (item) => item.generatedAt !== reportData.generatedAt,
        );
        return [reportData, ...deduped];
      });

      if (reportPersisted && !persistedViaCreateEndpoint) {
        try {
          const latest = await getMyReportsApi({ forceRefresh: true });
          if (Array.isArray(latest?.data) && latest.data.length > 0) {
            setPredictions(latest.data);
          }
        } catch (_refreshError) {
          // Keep the locally generated report visible even if the library refresh fails.
        }
      }
      setAnswers({ symptoms: "", duration: "", previousIllness: "" });
      if (reportPersisted) {
        toast.success("Report generated and saved");
      } else {
        toast.success("Report generated (save pending)");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to generate report. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProfile = async (form) => {
    if (!profile) {
      toast.error("Profile is not ready yet");
      return;
    }

    const parsedAge = Number.parseInt(String(form.age ?? "").trim(), 10);
    if (!Number.isFinite(parsedAge) || parsedAge < 0) {
      toast.error("Please enter a valid age");
      return;
    }

    setSavingProfile(true);
    try {
      const nextBloodGroup = String(
        form.bloodGroup || profile.bloodGroup || "",
      ).trim();

      await updatePatientProfileApi({
        name: String(
          form.name || profile.fullName || profile.name || user?.name || "",
        ).trim(),
        age: parsedAge,
        gender: String(form.gender || profile.gender || "").trim(),
        phone: String(form.phone || "").trim(),
        bloodGroup: nextBloodGroup,
        profileImage: form.profileImage,
        symptoms: profile?.symptoms || answers.symptoms || "Not specified",
        medicalHistory:
          profile?.medicalHistory || answers.previousIllness || "",
      });

      // Refresh from DB so profile card always reflects persisted values.
      const refreshedProfile = await getPatientProfileApi();
      setProfile(refreshedProfile);
      setEditOpen(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      const detail = error?.response?.data?.details;
      const detailMessage =
        Array.isArray(detail) && detail.length > 0 ? detail[0] : null;
      toast.error(
        detailMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to update profile",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome, {fullName}
          </h1>
          <div ref={notificationRef} className="relative shrink-0">
            <button
              type="button"
              onClick={handleToggleNotifications}
              aria-label="Open appointment notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FiBell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationOpen ? (
              <div className="absolute right-0 z-40 mt-2 w-[min(90vw,22rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <p className="px-1 text-sm font-semibold text-slate-800">
                  Notifications
                </p>
                <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {notifications.length > 0 ? (
                    notifications.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <p className="text-sm text-slate-700">{item.message}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      No notifications yet.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)_280px] lg:grid-cols-2">
          <div>
            <ProfileCard
              profile={profile}
              onPhotoEdit={() => setEditOpen(true)}
              onEdit={() => setEditOpen(true)}
            />
          </div>

          <div className="space-y-6">
            <QuestionFlow
              answers={answers}
              onChange={handleAnswerChange}
              onGenerate={generateReport}
              generating={isGenerating}
              suggestionPool={symptomSuggestionPool}
              symptomHistory={symptomHistory}
            />

            {report ? (
              <ReportCard report={report} onDownloadPdf={downloadPDF} />
            ) : null}

            <button
              type="button"
              onClick={() => navigate("/book-appointment")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Book Appointment
            </button>
          </div>

          <div className="space-y-6">
            <AppointmentDashboardCard
              appointments={appointments}
              loading={loading}
            />
            <SummaryCards
              stats={stats}
              onCardClick={(card) => {
                if (card.key === "prediction") {
                  navigate("/patient/report-library");
                  return;
                }
                setSummaryModal(card);
              }}
            />
          </div>
        </section>
      </main>

      <EditProfileModal
        isOpen={editOpen}
        initialValues={profile}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveProfile}
        saving={savingProfile}
      />

      {summaryModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {summaryModal.title}
            </h3>
            {summaryModal.key === "upcoming" ? (
              <div className="mt-4 max-h-72 space-y-3 overflow-auto">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment) => {
                    const canReschedule =
                      appointment.status === "pending" ||
                      appointment.status === "accepted";
                    const nextDateValue =
                      rescheduleValues[appointment.id] || "";
                    const statusLabel =
                      appointment.status === "accepted"
                        ? "Accepted by doctor"
                        : "Pending appointment";

                    return (
                      <div
                        key={appointment.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <span className="mb-2 inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          {statusLabel}
                        </span>
                        <p className="text-sm font-medium text-slate-800">
                          {appointment.doctor?.fullName || "Doctor"}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {new Date(appointment.date).toLocaleString()}
                        </p>

                        <div className="mt-3 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleCancelAppointment(appointment.id)
                            }
                            disabled={actionLoadingId === appointment.id}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel appointment
                          </button>

                          {canReschedule ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setRescheduleOpenId((current) =>
                                    current === appointment.id
                                      ? null
                                      : appointment.id,
                                  )
                                }
                                disabled={actionLoadingId === appointment.id}
                                className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Reschedule appointment
                              </button>

                              {rescheduleOpenId === appointment.id ? (
                                <div className="mt-1 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2">
                                  <label className="text-xs font-medium text-slate-600">
                                    Select date and time
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={nextDateValue}
                                    onChange={(event) =>
                                      setRescheduleValues((current) => ({
                                        ...current,
                                        [appointment.id]: event.target.value,
                                      }))
                                    }
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRescheduleAppointment(
                                        appointment.id,
                                      )
                                    }
                                    disabled={
                                      actionLoadingId === appointment.id
                                    }
                                    className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Confirm reschedule
                                  </button>
                                </div>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    No upcoming appointments.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 max-h-72 space-y-2 overflow-auto">
                {(summaryModal.details || []).map((line) => (
                  <p
                    key={line}
                    className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSummaryModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cancelConfirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-sm rounded-xl bg-slate-100 p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900">
              Confirm Cancel Appointment
            </h3>
            <p className="mt-2 text-sm text-slate-700">
              Are you sure you want to cancel this appointment?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelConfirmId(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={confirmCancelAppointment}
                disabled={actionLoadingId === cancelConfirmId}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PatientDashboard;
