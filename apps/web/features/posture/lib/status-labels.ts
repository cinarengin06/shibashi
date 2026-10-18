export function getCameraStatus(
  status: "idle" | "requesting" | "ready" | "denied" | "unsupported",
  phase: "ready" | "calibrate" | "live" | "complete",
): string {
  if (status === "requesting") return "Kamera izni bekleniyor";
  if (status === "denied") return "Kamera izni verilmedi";
  if (status === "unsupported") return "Bu tarayıcı kamera desteklemiyor";
  if (status === "ready" && phase === "live") return "Canlı pratik aktif";
  if (status === "ready") return "Kamera açık, kalibrasyon hazır";
  return "Kamera kapalı";
}

export function getPoseStatusText(status: "bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata"): string {
  const labels = {
    bekliyor: "MediaPipe bekliyor",
    yükleniyor: "MediaPipe yükleniyor",
    aktif: "MediaPipe aktif",
    "beden-yok": "Beden kadrajda değil",
    hata: "MediaPipe başlatılamadı",
  };

  return labels[status];
}
