"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  getMovementOrganVisuals,
  meridianClinicalBoundary,
  meridianMovements,
  meridianTeachingMethod,
  meridianLivingSteps,
  type MeridianMovementKnowledge,
} from "@/packages/meridian-knowledge";
import { MovementCameraPractice } from "@/features/living-learning/components/MovementCameraPractice";
import type { PracticeSnapshot } from "@/features/practice/types";
import { deletePracticeSnapshotFromIndexedDb, loadPracticeSnapshotsFromIndexedDb, mergePracticeSnapshots, persistPracticeSnapshotsToLocalStorage, rememberDeletedPracticeSnapshot, savePracticeSnapshotToIndexedDb } from "@/lib/local-history-storage";
import { isCapturedPracticePhoto } from "@/features/home/utils/practice-photo";
import styles from "./body-lines.module.css";

function MovementDetail({ movement }: { movement: MeridianMovementKnowledge }) {
  return (
    <section className={styles.detail}>
      <div>
        <span className={styles.eyebrow}>Bedenindeki İzleri</span>
      </div>
      <InnerWorld movement={movement} />
      <InfoBlock title="Ana beden hatları" items={movement.primaryMeridians} tone="jade" />
      <InfoBlock title="Eşlik eden hatlar" items={movement.secondaryMeridians} />
    </section>
  );
}

function InnerWorld({ movement }: { movement: MeridianMovementKnowledge }) {
  const organs = getMovementOrganVisuals(
    movement.primaryMeridians,
    movement.secondaryMeridians,
  );
  return (
    <section className={styles.innerWorld}>
      <div
        aria-label={`${organs.map((organ) => organ.label).join(", ")} bu harekette öne çıkan iç beden bölgeleri`}
        className={styles.organMap}
        role="img"
      >
        <Image
          alt=""
          aria-hidden="true"
          fill
          sizes="(max-width: 760px) 88vw, 290px"
          src="/images/body-lines/inner-world-organs-v1.jpg"
        />
        <div className={styles.organShade} />
        {organs.map((organ) => (
          <span
            className={`${styles.organMarker} ${organ.role === "primary" ? styles.organPrimary : styles.organSecondary}`}
            key={organ.id}
            style={{ left: `${organ.left}%`, top: `${organ.top}%` }}
          >
            <i />
            <b>{organ.label}</b>
          </span>
        ))}
        <span className={styles.innerWorldLabel}>İÇ DÜNYA</span>
      </div>
      <div className={styles.organLegend}>
        {organs.map((organ) => (
          <span key={organ.id}>
            <i data-role={organ.role} />
            <b>{organ.label}</b>
            <small>{organ.cue}</small>
          </span>
        ))}
      </div>
    </section>
  );
}

function InfoBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "jade" | "gold";
}) {
  return (
    <div className={styles.infoBlock}>
      <span>{title}</span>
      <div>
        {items.map((item) => (
          <b className={tone ? styles[tone] : undefined} key={item}>
            {item}
          </b>
        ))}
      </div>
    </div>
  );
}

export function BodyLinesScreen() {
  const [movementOrder, setMovementOrder] = useState(1);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [mode, setMode] = useState<"demo" | "camera">("demo");
  const [demoKey, setDemoKey] = useState(0);
  const [photos, setPhotos] = useState<PracticeSnapshot[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PracticeSnapshot | null>(null);
  const [photoSaveError, setPhotoSaveError] = useState(false);
  const [confirmPhotoDelete, setConfirmPhotoDelete] = useState(false);
  const [photoDeleteBusy, setPhotoDeleteBusy] = useState(false);
  const [photoDeleteError, setPhotoDeleteError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void loadPracticeSnapshotsFromIndexedDb().then((saved) => {
      if (!cancelled) setPhotos((current) => mergePracticeSnapshots(saved, current).filter((item) => isCapturedPracticePhoto(item.imageData)));
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!galleryOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setGalleryOpen(false); setSelectedPhoto(null); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [galleryOpen]);
  const savePhoto = useCallback(async (snapshot: PracticeSnapshot) => {
    const saved = await savePracticeSnapshotToIndexedDb(snapshot);
    if (!saved) { setPhotoSaveError(true); return false; }
    setPhotoSaveError(false);
    setPhotos((current) => {
      const next = mergePracticeSnapshots([snapshot], current).filter((item) => isCapturedPracticePhoto(item.imageData));
      persistPracticeSnapshotsToLocalStorage(next);
      return next;
    });
    return true;
  }, []);
  const deletePhoto = useCallback(async (photo: PracticeSnapshot) => {
    setPhotoDeleteBusy(true);
    setPhotoDeleteError(false);
    const deleted = await deletePracticeSnapshotFromIndexedDb(photo.id);
    if (deleted) {
      rememberDeletedPracticeSnapshot(photo.id);
      setPhotos((current) => {
        const remaining = current.filter((item) => item.id !== photo.id);
        persistPracticeSnapshotsToLocalStorage(remaining);
        return remaining;
      });
      setSelectedPhoto(null);
      setConfirmPhotoDelete(false);
    } else {
      setPhotoDeleteError(true);
    }
    setPhotoDeleteBusy(false);
  }, []);
  const movement =
    meridianMovements.find((item) => item.order === movementOrder) ??
    meridianMovements[0];
  const chooseMovement = useCallback((order: number) => {
    setMovementOrder(order);
    setVideoUnavailable(false);
    setMode("demo");
  }, []);
  const stepMovement = useCallback((step: number) => {
    chooseMovement(((movementOrder - 1 + step + 18) % 18) + 1);
  }, [chooseMovement, movementOrder]);
  const completeMovement = useCallback(() => stepMovement(1), [stepMovement]);
  const movementSteps = meridianLivingSteps[movementOrder - 1];

  return (
    <main className={styles.page}>
      <div className={`${styles.workspace} ${mode === "camera" ? styles.workspacePractice : ""}`}>
        <aside className={styles.rail} aria-label="Hareket adımları">
          <div className={styles.railHead}>
            <span>HAREKET {String(movementOrder).padStart(2, "0")}</span>
            <b>3 ADIM</b>
          </div>
          <ol className={styles.quickSteps}>
            {movementSteps.map((step, index) => <li key={step}><i>{index + 1}</i><span>{step}</span></li>)}
          </ol>
          <div className={styles.practiceActions}>
            <button className={mode === "demo" ? styles.practiceActive : undefined} onClick={() => { setMode("demo"); setVideoUnavailable(false); setDemoKey((key) => key + 1); }} type="button">Hoca yapsın <span>↻</span></button>
            <button className={`${styles.practiceStart} ${mode === "camera" ? styles.practiceActive : ""}`} onClick={() => setMode("camera")} type="button">Pratik yaparak öğren <span>→</span></button>
            <button aria-label={`Fotoğraflarım, ${photos.length} kayıt`} className={styles.photosButton} onClick={() => setGalleryOpen(true)} type="button">📷 Fotoğraflarım <span>{photos.length}</span></button>
          </div>
          {mode === "camera" ? <small className={styles.cameraHint}>Canlı uyumunu izle ve hedefi ayarla. Hedefe ulaştığın üç an fotoğraflanıp Fotoğraflarım'a kaydedilir.</small> : null}
          {photoSaveError ? <small className={styles.saveError} role="alert">Fotoğraf saklanamadı. Tarayıcı depolamasını kontrol et.</small> : null}
        </aside>
        <section className={styles.stage}>
          <div className={styles.stageTop}>
            <button
              aria-label="Önceki hareket"
              onClick={() => stepMovement(-1)}
              type="button"
            >
              ←
            </button>
            <div>
              <span>HAREKET {String(movement.order).padStart(2, "0")}</span>
              <strong>{movement.sourceTitle}</strong>
            </div>
            <button
              aria-label="Sonraki hareket"
              onClick={() => stepMovement(1)}
              type="button"
            >
              →
            </button>
          </div>
          {mode === "camera" ? (
            <div className={styles.cameraStage}><MovementCameraPractice active movementOrder={String(movement.order).padStart(2, "0")} movementName={movement.sourceTitle} retryKey={0} onComplete={completeMovement} onPhotoCaptured={savePhoto} /></div>
          ) : <div className={styles.visual}>
              <div className={`${styles.figureFrame} ${styles.videoFrame}`}>
                {videoUnavailable ? (
                  <Image alt={`${movement.sourceTitle} hoca videosunun kapak görseli`} fill sizes="(max-width: 900px) 100vw, 44vw" src={`/images/shibashi-new/${movement.order}.jpg`} />
                ) : (
                <video
                  aria-label={`${movement.sourceTitle} hoca videosu`}
                  autoPlay
                  controls
                  key={`${movement.order}-${demoKey}`}
                  loop
                  muted
                  onError={() => setVideoUnavailable(true)}
                  playsInline
                  poster={`/images/shibashi-new/${movement.order}.jpg`}
                  preload="metadata"
                  src={`/videos/shibashi/${movement.order}.mp4`}
                />
                )}
              </div>
            {videoUnavailable ? <span className={styles.videoUnavailable}>Video şu anda açılamıyor. Hareketi yeniden seçerek tekrar deneyebilirsin.</span> : null}
          </div>}
        </section>
        {mode === "demo" ? <MovementDetail movement={movement} /> : null}
      </div>
      <section className={styles.movementSelector} aria-label="18 hareket">
        <div className={styles.selectorHeading}><span className={styles.eyebrow}>HAREKET ŞERİDİ</span><strong>Şu an 18 hareketin {movementOrder}. hareketindesin.</strong><button onClick={() => stepMovement(1)} type="button">Sonraki harekete geç →</button></div>
        <div className={styles.movementTiles}>
          {meridianMovements.map((item) => <button aria-current={item.order === movementOrder ? "step" : undefined} className={item.order === movementOrder ? styles.movementTileActive : undefined} key={item.movementId} onClick={() => chooseMovement(item.order)} type="button"><Image alt="" aria-hidden="true" fill sizes="180px" src={`/images/shibashi-new/${item.order}.jpg`} /><i>{String(item.order).padStart(2, "0")}</i><strong>{item.sourceTitle}</strong></button>)}
        </div>
      </section>
      {galleryOpen ? <div className={styles.galleryBackdrop} onClick={() => { setGalleryOpen(false); setSelectedPhoto(null); }} role="presentation">
        <section aria-label="Fotoğraflarım" aria-modal="true" className={styles.galleryDialog} onClick={(event) => event.stopPropagation()} role="dialog">
          <div className={styles.galleryHeader}>
            <div><span className={styles.eyebrow}>PRATİK ARŞİVİ</span><h2>Fotoğraflarım</h2><p>Hedef uyuma ulaştığın anlar bu tarayıcıda saklanır.</p></div>
            <button aria-label="Fotoğraflarımı kapat" onClick={() => { setGalleryOpen(false); setSelectedPhoto(null); }} type="button">×</button>
          </div>
          {selectedPhoto ? <div className={styles.photoDetail}>
            <button onClick={() => { setSelectedPhoto(null); setConfirmPhotoDelete(false); setPhotoDeleteError(false); }} type="button">← Tüm fotoğraflar</button>
            <img alt={`${selectedPhoto.movementName} hareketinde çekilen fotoğrafın`} src={selectedPhoto.imageData} />
            <div><strong>{selectedPhoto.movementName}</strong><span>{selectedPhoto.dateKey} · {selectedPhoto.timeLabel} · %{selectedPhoto.score} uyum</span></div>
            <div className={styles.photoActions}>
              {confirmPhotoDelete ? <><span>Bu fotoğrafı kalıcı olarak silmek istiyor musun?</span><button disabled={photoDeleteBusy} onClick={() => { setConfirmPhotoDelete(false); setPhotoDeleteError(false); }} type="button">Vazgeç</button><button className={styles.confirmDeleteButton} disabled={photoDeleteBusy} onClick={() => void deletePhoto(selectedPhoto)} type="button">{photoDeleteBusy ? "Siliniyor…" : "Evet, sil"}</button></> : <button className={styles.deletePhotoButton} onClick={() => setConfirmPhotoDelete(true)} type="button">Fotoğrafı sil</button>}
              {photoDeleteError ? <small role="alert">Fotoğraf silinemedi. Tekrar deneyebilirsin.</small> : null}
            </div>
          </div> : photos.length ? <div className={styles.galleryGrid}>
            {photos.map((photo) => <button aria-label={`${photo.movementName} fotoğrafını aç, yüzde ${photo.score} uyum`} key={photo.id} onClick={() => { setSelectedPhoto(photo); setConfirmPhotoDelete(false); setPhotoDeleteError(false); }} type="button"><img alt="" loading="lazy" src={photo.imageData} /><span><strong>{photo.movementName}</strong><small>{photo.dateKey} · %{photo.score}</small></span></button>)}
          </div> : <div className={styles.galleryEmpty}><span>📷</span><strong>Henüz fotoğrafın yok</strong><p>Pratikte hedef uyuma ulaştığında üç fotoğraf burada görünecek.</p></div>}
        </section>
      </div> : null}
      <footer className={styles.note}>
        <p>{meridianTeachingMethod}</p>
        <small>{meridianClinicalBoundary}</small>
      </footer>
    </main>
  );
}
