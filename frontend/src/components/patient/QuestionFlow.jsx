import { useEffect, useMemo, useRef, useState } from "react";
import { FiMic, FiMicOff } from "react-icons/fi";

function sanitizeSymptomToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function extractCurrentToken(text) {
  const value = String(text || "");
  const parts = value.split(",");
  const token = parts[parts.length - 1] || "";
  return token.trim();
}

function replaceCurrentToken(text, replacement) {
  const value = String(text || "");
  const parts = value.split(",");
  parts[parts.length - 1] = ` ${replacement}`;
  return parts.join(",").replace(/^\s+/, "").replace(/,\s+/g, ", ").trim();
}

function ensureSymptomInText(text, symptom) {
  const normalized = sanitizeSymptomToken(symptom);
  if (!normalized) return text;

  const parts = String(text || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const exists = parts.some(
    (part) => sanitizeSymptomToken(part) === normalized,
  );
  if (exists) {
    return parts.join(", ");
  }

  return [...parts, symptom].join(", ");
}

function parseSymptomsFromSpeech(transcript) {
  const splitPattern = /,|;|\band\b|\bplus\b|\balso\b|\baur\b|\n/gi;

  return String(transcript || "")
    .split(splitPattern)
    .map((item) =>
      item
        .trim()
        .replace(
          /^(i\s+have|i\s+am\s+having|having|with|feeling|suffering\s+from|mujhe|mujhko)\s+/i,
          "",
        ),
    )
    .filter(Boolean);
}

function QuestionFlow({
  answers,
  onChange,
  onGenerate,
  generating,
  suggestionPool = [],
  symptomHistory = [],
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [speechLanguage, setSpeechLanguage] = useState("en-US");
  const recognitionRef = useRef(null);
  const symptomsValueRef = useRef(answers.symptoms);
  const silenceTimeoutRef = useRef(null);
  const interimTranscriptRef = useRef("");
  const isStartingRef = useRef(false);

  useEffect(() => {
    symptomsValueRef.current = answers.symptoms;
  }, [answers.symptoms]);

  const speechSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        window.clearTimeout(silenceTimeoutRef.current);
      }
      recognitionRef.current?.stop();
    };
  }, []);

  const suggestions = useMemo(() => {
    const currentToken = sanitizeSymptomToken(
      extractCurrentToken(answers.symptoms),
    );
    if (!currentToken || currentToken.length < 2) {
      return [];
    }

    const uniquePool = [
      ...new Set(
        (suggestionPool || [])
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      ),
    ];

    const startsWithMatches = uniquePool.filter((item) =>
      sanitizeSymptomToken(item).startsWith(currentToken),
    );

    const containsMatches = uniquePool.filter((item) => {
      const normalized = sanitizeSymptomToken(item);
      return (
        !normalized.startsWith(currentToken) &&
        normalized.includes(currentToken)
      );
    });

    return [...startsWithMatches, ...containsMatches].slice(0, 8);
  }, [answers.symptoms, suggestionPool]);

  const startSpeech = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setSpeechError("");

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLanguage;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        isStartingRef.current = false;
        setIsRecording(true);
      };
      recognition.onend = () => {
        isStartingRef.current = false;
        if (silenceTimeoutRef.current) {
          window.clearTimeout(silenceTimeoutRef.current);
        }

        // Some browsers may emit interim-only text for a while. Commit it on end.
        if (interimTranscriptRef.current) {
          const spokenSymptoms = parseSymptomsFromSpeech(
            interimTranscriptRef.current,
          );
          const nextText = spokenSymptoms.reduce(
            (current, symptom) => ensureSymptomInText(current, symptom),
            symptomsValueRef.current,
          );

          onChange("symptoms", nextText);
          symptomsValueRef.current = nextText;
          interimTranscriptRef.current = "";
          setShowSuggestions(false);
        }

        setIsRecording(false);
      };
      recognition.onerror = (event) => {
        isStartingRef.current = false;
        if (silenceTimeoutRef.current) {
          window.clearTimeout(silenceTimeoutRef.current);
        }
        setIsRecording(false);

        if (
          event?.error === "not-allowed" ||
          event?.error === "service-not-allowed"
        ) {
          setSpeechError(
            "Microphone permission is blocked. Please allow mic access in your browser.",
          );
          return;
        }

        if (event?.error === "no-speech") {
          setSpeechError(
            "No speech detected. Try speaking a little closer to the microphone.",
          );
          return;
        }

        if (event?.error === "audio-capture") {
          setSpeechError(
            "No microphone was found. Check your audio input device and try again.",
          );
          return;
        }

        setSpeechError("Voice input failed. Please try again.");
      };
      recognition.onresult = (event) => {
        if (silenceTimeoutRef.current) {
          window.clearTimeout(silenceTimeoutRef.current);
        }

        const spokenChunks = [];
        const interimChunks = [];

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const segment = event.results[i];
          const piece = segment[0]?.transcript || "";
          if (!piece) continue;

          if (segment?.isFinal) {
            spokenChunks.push(piece);
          } else {
            interimChunks.push(piece);
          }
        }

        interimTranscriptRef.current = interimChunks.join(", ").trim();

        if (spokenChunks.length > 0) {
          const spokenSymptoms = parseSymptomsFromSpeech(
            spokenChunks.join(", "),
          );
          const nextText = spokenSymptoms.reduce(
            (current, symptom) => ensureSymptomInText(current, symptom),
            symptomsValueRef.current,
          );

          onChange("symptoms", nextText);
          symptomsValueRef.current = nextText;
          setShowSuggestions(false);
        }

        // Auto-stop after a short silence so input feels responsive and final text is committed.
        silenceTimeoutRef.current = window.setTimeout(() => {
          recognitionRef.current?.stop();
        }, 4500);
      };
      recognitionRef.current = recognition;
    }

    recognitionRef.current.lang = speechLanguage;

    if (isStartingRef.current || isRecording) return;

    try {
      isStartingRef.current = true;
      recognitionRef.current.start();
    } catch (error) {
      isStartingRef.current = false;
      if (error?.name !== "InvalidStateError") {
        setSpeechError(
          "Unable to start microphone right now. Please try again.",
        );
      }
    }
  };

  const stopSpeech = () => {
    isStartingRef.current = false;
    if (silenceTimeoutRef.current) {
      window.clearTimeout(silenceTimeoutRef.current);
    }
    recognitionRef.current?.stop();
  };

  const handleSymptomsInputChange = (value) => {
    onChange("symptoms", value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    const next = replaceCurrentToken(answers.symptoms, suggestion);
    onChange("symptoms", next);
    setShowSuggestions(false);
  };

  const handleHistoryClick = (symptom) => {
    const next = ensureSymptomInText(answers.symptoms, symptom);
    onChange("symptoms", next);
  };

  return (
    <section className="rounded-xl bg-white p-5 shadow-lg">
      <h3 className="text-xl font-semibold text-slate-900">
        How are you feeling today?
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Answer the questions below to generate your health report.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">
            What symptoms are you experiencing?
          </label>
          <div className="mt-1 space-y-2">
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="relative w-full">
                <textarea
                  value={answers.symptoms}
                  onChange={(event) =>
                    handleSymptomsInputChange(event.target.value)
                  }
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowSuggestions(false), 120);
                  }}
                  rows={3}
                  placeholder="Example: headache, dizziness, sore throat"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                />

                {showSuggestions && suggestions.length > 0 ? (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Suggestions
                    </p>
                    <div className="max-h-44 overflow-y-auto">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full rounded-md px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-purple-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={isRecording ? stopSpeech : startSpeech}
                disabled={!speechSupported}
                className={`h-10 rounded-lg px-3 text-sm font-medium text-white transition sm:shrink-0 ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-purple-600 hover:bg-purple-700"
                } disabled:cursor-not-allowed disabled:bg-slate-300`}
              >
                {isRecording ? <FiMicOff /> : <FiMic />}
              </button>

              <select
                value={speechLanguage}
                onChange={(event) => setSpeechLanguage(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 sm:text-sm"
                aria-label="Speech language"
              >
                <option value="en-US">English</option>
                <option value="hi-IN">Hindi</option>
              </select>
            </div>

            {speechError ? (
              <p className="text-xs text-red-600">{speechError}</p>
            ) : null}

            {symptomHistory.length > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Symptom history
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {symptomHistory.slice(0, 12).map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleHistoryClick(symptom)}
                      className="rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-50"
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Since how many days?
          </label>
          <input
            value={answers.duration}
            onChange={(event) => onChange("duration", event.target.value)}
            placeholder="Example: 4 days"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Any previous illness?
          </label>
          <input
            value={answers.previousIllness}
            onChange={(event) =>
              onChange("previousIllness", event.target.value)
            }
            placeholder="Example: migraine"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? "Generating..." : "Generate Report"}
        </button>
      </div>
    </section>
  );
}

export default QuestionFlow;
