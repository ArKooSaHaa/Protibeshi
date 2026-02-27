export const totalMarksPerDay = 3;
const buffer = 15 * 60 * 1000; // 15 mins buffer time to account for network/response issues

export const calculateAttendanceMarks = (attendanceAt: string, duration: string, classStartedAt: string): number => {
  const classStartedAtMs = new Date(classStartedAt).getTime();
  let classEndTimeMs = classStartedAtMs + parseInt(duration) * 60 * 1000;
  const attendanceAtMs = new Date(attendanceAt).getTime();
  if (attendanceAtMs > classEndTimeMs) return 0;

  if (attendanceAtMs - classStartedAtMs <= buffer) {
    return totalMarksPerDay;
  }

  const durationStudentAttendedMs = classEndTimeMs - attendanceAtMs;
  const totalMarks = (totalMarksPerDay / (parseInt(duration) * 60 * 1000)) * durationStudentAttendedMs;
  return Math.min(totalMarksPerDay, totalMarks);
};
