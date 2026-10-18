export function getPracticeMessage(phase: "ready" | "calibrate" | "live" | "complete"): string {
  const messages = {
    ready: "Beden kadrajını hazırla.",
    calibrate: "Omuzlar ve dizler kalibre ediliyor.",
    live: "Canlı düzeltme seni dinliyor.",
    complete: "Pratik kapandı. Sırada günlük var.",
  };

  return messages[phase];
}
