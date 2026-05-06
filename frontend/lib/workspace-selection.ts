const RESUME_KEY = "resume-optimizer.selected-resume-id";
const JOB_KEY = "resume-optimizer.selected-job-id";

function canUseStorage() {
  return typeof window !== "undefined";
}

function readNumericValue(key: string) {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  const numericValue = Number.parseInt(rawValue, 10);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function writeNumericValue(key: string, value: number | null) {
  if (!canUseStorage()) {
    return;
  }

  if (value === null) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, String(value));
}

export function readSelectedResumeId() {
  return readNumericValue(RESUME_KEY);
}

export function writeSelectedResumeId(value: number | null) {
  writeNumericValue(RESUME_KEY, value);
}

export function readSelectedJobId() {
  return readNumericValue(JOB_KEY);
}

export function writeSelectedJobId(value: number | null) {
  writeNumericValue(JOB_KEY, value);
}
