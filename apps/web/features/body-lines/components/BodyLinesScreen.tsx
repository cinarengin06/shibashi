"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  getMovementOrganVisuals,
  meridianClinicalBoundary,
  meridianMovements,
  meridianTeachingMethod,
  meridianLivingSteps,
  getMovementEnergyTag,
  type MeridianMovementKnowledge,
} from "@/packages/meridian-knowledge";
import { MovementCameraPractice } from "@/features/living-learning/components/MovementCameraPractice";
import { MilestoneCelebration } from "@/features/home/components/MilestoneCelebration";
import type { PracticeSnapshot } from "@/features/practice/types";
import { deletePracticeSnapshotFromIndexedDb, loadPracticeSnapshotsFromIndexedDb, mergePracticeSnapshots, persistPracticeSnapshotsToLocalStorage, rememberDeletedPracticeSnapshot, savePracticeSnapshotToIndexedDb } from "@/lib/local-history-storage";
import { isCapturedPracticePhoto } from "@/features/home/utils/practice-photo";
import { loadCompletedMovements, markMovementCompleted } from "@/lib/movement-completion";
import { markMovementPracticed } from "@/lib/movement-practice";
import { loadFormSteps, markFormStep } from "@/lib/form-steps";
import type { FormSteps } from "@/packages/gamification";
import { useShibashiAuth } from "@/lib/supabase-auth";
import { toDomainShenId, type ShenActivity } from "@/packages/shen-domain";
import styles from "./body-lines.module.css";
import { FormCatalogWeb } from "./FormCatalogWeb";
import { FormMetaTags } from "@/components/web/FormMetaTags";
import { readFormCatalogFilters } from "@/packages/form-catalog";
import type { FormCatalogFilters } from "@/packages/form-catalog";

function rememberPracticeSession(snapshot: PracticeSnapshot) {
  if (!snapshot.sessionId) return;
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem("shibashi-shen-activities") ?? "[]");
    const activities = Array.isArray(stored)
      ? stored.filter((value): value is ShenActivity => Boolean(value) && typeof value.id === "string")
      : [];
    if (activities.some((activity) => activity.id === snapshot.sessionId)) return;
    const activity: ShenActivity = {
      id: snapshot.sessionId,
      shenId: toDomainShenId(window.localStorage.getItem("ritim-kapisi-selected-shen") ?? "shen"),
      type: "practice",
      createdAt: snapshot.createdAt,
      completed: false,
      movementQuality: snapshot.score,
      practiceId: `movement-${snapshot.movementId}`,
    };
    window.localStorage.setItem("shibashi-shen-activities", JSON.stringify([activity, ...activities].slice(0, 240)));
  } catch {
    // The saved photo still provides the session for home statistics.
  }
}

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
  const { ready: authReady, user } = useShibashiAuth();
  const [movementOrder, setMovementOrder] = useState(1);
  const [mode,setMode]=useState<'catalog'|'detail'>('catalog');
  const [catalogSection,setCatalogSection]=useState<'preparation'|'forms'>('forms');
  const [catalogFilters,setCatalogFilters]=useState<FormCatalogFilters>(readFormCatalogFilters({}));
  const [formSteps, setFormSteps] = useState<FormSteps>({});
  const [completedOrders, setCompletedOrders] = useState<number[]>([]);
  useEffect(() => { setFormSteps(loadFormSteps(user?.id)); }, [user?.id]);
  useEffect(() => { setCompletedOrders(loadCompletedMovements(user?.id)); }, [user?.id]);
  useLayoutEffect(() => {
    const sync=()=>{
      const params=new URLSearchParams(window.location.search);
      const requested=Number(params.get('movementOrder'));
      setCatalogSection(params.get('section')==='preparation'?'preparation':'forms');
      setCatalogFilters(readFormCatalogFilters({energy:params.get('energy'),status:params.get('status'),organ:params.get('organ'),gate:params.get('gate')}));
      if(Number.isInteger(requested)&&requested>=1&&requested<=18){setMovementOrder(requested);setMode('detail')}
      else setMode('catalog');
    };
    sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);
  }, []);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [miniCameraOpen, setMiniCameraOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showFirstVisitTips, setShowFirstVisitTips] = useState(false);
  useEffect(() => {
    try { setShowFirstVisitTips(window.localStorage.getItem("shibashi-form-guide-v1") !== "done"); } catch { setShowFirstVisitTips(true); }
  }, []);
  const dismissFirstVisitTips = () => {
    setShowFirstVisitTips(false);
    try { window.localStorage.setItem("shibashi-form-guide-v1", "done"); } catch {}
  };
  const [targetScore, setTargetScore] = useState(25);
  const demoVideoRef = useRef<HTMLVideoElement>(null);
  const narrationRef = useRef<HTMLAudioElement>(null);
  useLayoutEffect(() => {
    const stopMedia = () => {
      demoVideoRef.current?.pause();
      narrationRef.current?.pause();
    };
    const onVisibilityChange = () => { if (document.hidden) stopMedia(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', stopMedia);
    return () => {
      stopMedia();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', stopMedia);
    };
  }, []);
  const lastDemoTimeRef = useRef(0);
  const playbackCountRef = useRef(1);
  const [photos, setPhotos] = useState<PracticeSnapshot[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PracticeSnapshot | null>(null);
  const [photoSaveError, setPhotoSaveError] = useState(false);
  const [confirmPhotoDelete, setConfirmPhotoDelete] = useState(false);
  const [photoDeleteBusy, setPhotoDeleteBusy] = useState(false);
  const [photoDeleteError, setPhotoDeleteError] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("shibashi-learning-target-score-v2");
    const saved = Number(stored);
    if (stored !== null && saved >= 25 && saved <= 100 && saved % 5 === 0) setTargetScore(saved);
  }, []);
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
    markMovementPracticed(snapshot.movementId,user?.id,snapshot.createdAt);
    rememberPracticeSession(snapshot);
    setPhotoSaveError(false);
    setPhotos((current) => {
      const next = mergePracticeSnapshots([snapshot], current).filter((item) => isCapturedPracticePhoto(item.imageData));
      persistPracticeSnapshotsToLocalStorage(next);
      return next;
    });
    return true;
  }, [user?.id]);
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
  const playNarration = useCallback((restart = false) => {
    const audio = narrationRef.current;
    const video = demoVideoRef.current;
    if (!audio || !video || playbackCountRef.current % 2 === 0) return;
    if (restart) audio.currentTime = 0;
    else if (audio.ended) return;
    void audio.play().catch(() => {});
  }, []);
  const playNarratedVideo = useCallback((restart = false) => {
    const video = demoVideoRef.current;
    if (!video) return;
    if (restart) video.currentTime = 0;
    playNarration(restart);
    void video.play().catch(() => {});
  }, [playNarration]);
  const startFullscreenVideo = useCallback(() => {
    const video = demoVideoRef.current;
    if (!video) return;
    if (video.requestFullscreen) void video.requestFullscreen().catch(() => {});
    else (video as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.();
    playNarratedVideo();
  }, [playNarratedVideo]);
  const chooseMovement = useCallback((order: number) => {
    demoVideoRef.current?.pause();
    narrationRef.current?.pause();
    setVideoPlaying(false);
    lastDemoTimeRef.current = 0;
    playbackCountRef.current = 1;
    setMovementOrder(order);
    setVideoUnavailable(false);
    setMiniCameraOpen(false);
  }, []);
  const stepMovement = useCallback((step: number) => {
    chooseMovement(((movementOrder - 1 + step + 18) % 18) + 1);
  }, [chooseMovement, movementOrder]);
  const movementSteps = meridianLivingSteps[movementOrder - 1];
  const energyTag = getMovementEnergyTag(movementOrder);
  const currentFormSteps = formSteps[movementOrder] ?? {};
  const completedHere = completedOrders.includes(movementOrder);
  const completeCurrentForm = () => {
    if (completedHere) return;
    try {
      const next = markMovementCompleted(movementOrder, user?.id);
      setCompletedOrders(next);
      setFormSteps(markFormStep(movementOrder, "completed", user?.id));
    } catch { /* Keep the action available if local storage cannot be written. */ }
  };
  const completeCurrentFormRef = useRef(completeCurrentForm);
  completeCurrentFormRef.current = completeCurrentForm;
  const onTargetReached = useCallback(() => completeCurrentFormRef.current(), []);
  const currentPhotos = photos.filter((photo) => photo.movementId === movementOrder);

  const openMovement=(order:number)=>{chooseMovement(order);setMode('detail');const url=new URL(window.location.href);url.searchParams.set('movementOrder',String(order));window.history.pushState({},'',url)};
  const openCatalog=()=>{demoVideoRef.current?.pause();narrationRef.current?.pause();setMiniCameraOpen(false);setMode('catalog');const url=new URL(window.location.href);url.searchParams.delete('movementOrder');window.history.pushState({},'',url)};
  const changeCatalogSection=(section:'preparation'|'forms')=>{setCatalogSection(section);const url=new URL(window.location.href);if(section==='preparation')url.searchParams.set('section','preparation');else url.searchParams.delete('section');window.history.replaceState({},'',url)};
  if(mode==='catalog')return <FormCatalogWeb completedOrders={completedOrders} filters={catalogFilters} section={catalogSection} onSectionChange={changeCatalogSection} onFiltersChange={setCatalogFilters} onSelect={openMovement}/>;

  return (
    <main className={styles.page}>
      <button className={styles.catalogBack} onClick={openCatalog} type="button">← 18 Form kataloğuna dön</button>
      {authReady && !miniCameraOpen ? <MilestoneCelebration records={completedOrders.map((order) => ({ order, date: photos.find((item) => item.movementId === order)?.createdAt ?? new Date().toISOString() }))} postureCount={0} userId={user?.id} /> : null}
      <div className={styles.workspace}>
        <aside className={styles.rail} aria-label="Hareket adımları">
          <div className={styles.railHead}>
            <span>HAREKETİ NASIL YAPARSIN?</span>
          </div>
          <ol className={styles.quickSteps}>
            {movementSteps.map((step, index) => <li key={step}><i>{index + 1}</i><span>{step}</span></li>)}
          </ol>
          <div className={styles.practiceActions}>
            {videoPlaying && <button onClick={() => { demoVideoRef.current?.pause(); narrationRef.current?.pause(); }} type="button">Videoyu Durdur <span>■</span></button>}
            <button aria-pressed={miniCameraOpen} className={styles.practiceStart} disabled={videoUnavailable} onClick={() => { if (!miniCameraOpen) { playNarratedVideo(); setFormSteps(markFormStep(movementOrder, "attempted", user?.id)); } else { demoVideoRef.current?.pause(); narrationRef.current?.pause(); } setMiniCameraOpen((open) => !open); }} type="button">{miniCameraOpen ? "Pratiği Bitir" : "▣ Kameranı Aç ve Başla"}<span>{miniCameraOpen ? "×" : "↗"}</span></button>
            {showFirstVisitTips && <div className={styles.guideTip}><b>2/3 · Kendin dene</b><p>Bu düğme kameranı açar. Hocayı takip ederken canlı uyumunu görürsün.</p></div>}
            {completedHere ? <div className={styles.completeNotice} role="status"><strong>✓ Form tamamlandı</strong><span>Bu hareket yolculuğuna eklendi. Dilersen kamerayla tekrar deneyebilirsin.</span></div> : <button className={styles.completeButton} onClick={completeCurrentForm} type="button">✓ Formu Tamamladım</button>}
            {showFirstVisitTips && <div className={styles.guideTip}><b>3/3 · Formu tamamla</b><p>Hedef uyuma ulaştığında form otomatik tamamlanır. İstersen bu düğmeyle kendin de tamamlandı olarak işaretleyebilirsin.</p><button onClick={dismissFirstVisitTips} type="button">Anladım, ipuçlarını kapat</button></div>}
            {!miniCameraOpen && <label className={styles.targetSetting}><span>Otomatik tamamlama hedefi <strong>%{targetScore}</strong></span><input aria-label="Hedef uyum yüzdesi" min={25} max={100} step={5} type="range" value={targetScore} onChange={(event) => { const value=Number(event.target.value); setTargetScore(value); window.localStorage.setItem("shibashi-learning-target-score-v2",String(value)); }} /><small>Hedefe ulaştığında form kendiliğinden tamamlanır.</small></label>}
            <button aria-label={`Bu formun fotoğrafları, ${currentPhotos.length} kayıt`} className={styles.photosButton} onClick={() => setGalleryOpen(true)} type="button">▧ Bu formun fotoğrafları <span>Görüntüle →</span></button>
          </div>
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
              <div className={styles.stageTitleLine}><strong>{movement.sourceTitle}</strong><small className={energyTag.quality === "Yang" ? styles.yangTag : styles.yinTag} title="Hareketin baskın öğretim niteliği">{energyTag.quality} · {energyTag.action}</small></div>
            </div>
            <button
              aria-label="Sonraki hareket"
              onClick={() => stepMovement(1)}
              type="button"
            >
              →
            </button>
          </div>
          <div className={styles.visual}>
              <div className={`${styles.figureFrame} ${styles.videoFrame}`}>
                {videoUnavailable ? (
                  <Image alt={`${movement.sourceTitle} form görseli`} fill sizes="(max-width: 900px) 100vw, 44vw" src={`/images/form-scenes/${movement.order}.jpg`} />
                ) : (
                <video
                  aria-label={`${movement.sourceTitle} hoca videosu`}
                  controls={videoPlaying}
                  key={movement.order}
                  loop
                  muted
                  onError={() => { narrationRef.current?.pause(); setVideoUnavailable(true); }}
                  onPause={() => { setVideoPlaying(false); narrationRef.current?.pause(); }}
                  onPlay={() => { setVideoPlaying(true); setFormSteps(markFormStep(movementOrder, "watched", user?.id)); playNarration(); }}
                  onEnded={() => { if (!currentFormSteps.videoCompleted) setFormSteps(markFormStep(movementOrder, "videoCompleted", user?.id)); }}
                  onTimeUpdate={(event) => {
                    const video = event.currentTarget;
                    if (!currentFormSteps.videoCompleted && video.duration > 1 && video.currentTime >= video.duration - .6) setFormSteps(markFormStep(movementOrder, "videoCompleted", user?.id));
                    const audio = narrationRef.current;
                    if (audio && video.currentTime + 0.7 < lastDemoTimeRef.current) {
                      const naturalLoop = video.duration > 0 && lastDemoTimeRef.current >= video.duration - 1;
                      if (naturalLoop) {
                        playbackCountRef.current += 1;
                        // The first form's narration outlasts its video. Let it finish on the silent second loop.
                        if (playbackCountRef.current % 2 === 1 && !video.paused) {
                          audio.pause();
                          playNarration(true);
                        }
                      } else audio.pause();
                    }
                    lastDemoTimeRef.current = video.currentTime;
                  }}
                  playsInline
                  poster={`/images/form-scenes/${movement.order}.jpg`}
                  preload="metadata"
                  ref={demoVideoRef}
                  src={`/videos/shibashi/${movement.order}.mp4`}
                />
                )}
                {!videoUnavailable && !videoPlaying && <button aria-label="Hareketi Başlat" className={styles.videoStartOverlay} onClick={startFullscreenVideo} type="button"><span aria-hidden="true">▶</span><strong>Hareketi Başlat</strong></button>}
                {showFirstVisitTips && !videoPlaying && !videoUnavailable && <div className={`${styles.guideTip} ${styles.videoGuideTip}`}><b>1/3 · Önce hocayı izle</b><p>“Hareketi Başlat” videoyu tam ekranda açar. Hazır olduğunda dokun.</p><button onClick={dismissFirstVisitTips} type="button">İpuçlarını geç</button></div>}
              </div>
            <audio key={movement.order} preload="auto" ref={narrationRef} src={`/audio/shibashi-18/shibashi_${String(movement.order).padStart(2, "0")}.mp3`} />
            {videoUnavailable ? <span className={styles.videoUnavailable}>Video şu anda açılamıyor. Hareketi yeniden seçerek tekrar deneyebilirsin.</span> : null}
            {miniCameraOpen ? <MovementCameraPractice active compact movementOrder={String(movement.order).padStart(2, "0")} movementName={movement.sourceTitle} retryKey={0} onClose={() => setMiniCameraOpen(false)} onComplete={onTargetReached} onTargetReached={onTargetReached} onPhotoCaptured={savePhoto} teacherVideoRef={demoVideoRef} targetScoreOverride={targetScore} onTargetScoreChange={(value) => { setTargetScore(value); window.localStorage.setItem("shibashi-learning-target-score-v2",String(value)); }} /> : null}
          </div>
        </section>
        <MovementDetail movement={movement} />
      </div>
      <section className={styles.movementSelector} aria-label="18 hareket">
        <div className={styles.selectorHeading}><span className={styles.eyebrow}>HAREKET ŞERİDİ</span><strong>Şu an 18 hareketin {movementOrder}. hareketindesin.</strong><button onClick={() => stepMovement(1)} type="button">Sonraki harekete geç →</button></div>
        <div className={styles.movementTiles}>
          {meridianMovements.map((item) => { const tag = getMovementEnergyTag(item.order); return <button aria-current={item.order === movementOrder ? "step" : undefined} aria-label={`${item.order}. form: ${item.sourceTitle}, ${tag.quality}, ${tag.action}, ${completedOrders.includes(item.order) ? "tamamlandı" : formSteps[item.order]?.attempted ? "denendi" : formSteps[item.order]?.watched ? "izlendi" : "başlanmadı"}`} className={item.order === movementOrder ? styles.movementTileActive : undefined} key={item.movementId} onClick={() => chooseMovement(item.order)} type="button"><Image alt="" aria-hidden="true" fill sizes="180px" src={`/images/form-scenes/${item.order}.jpg`} /><i>{String(item.order).padStart(2, "0")}</i><span aria-hidden="true" className={styles.tilePlay}>▶</span><b className={styles.tileProgress}>{completedOrders.includes(item.order) ? "✓ Tamamlandı" : formSteps[item.order]?.attempted ? "◉ Denendi" : formSteps[item.order]?.watched ? "◌ İzlendi" : ""}</b><strong>{item.sourceTitle}</strong><span className={styles.tileMeta}><FormMetaTags order={item.order} compact/></span></button>; })}
        </div>
      </section>
      <section className={styles.inlinePhotos} aria-label={`${movement.sourceTitle} fotoğraflarım`}><div className={styles.galleryHeader}><div><span className={styles.eyebrow}>HAREKET {String(movementOrder).padStart(2, "0")}</span><h2>Fotoğraflarım</h2><p>{movement.sourceTitle} için kaydedilen fotoğraflar</p></div></div>{currentPhotos.length ? <div className={styles.galleryGrid}>{currentPhotos.map((photo) => <button key={photo.id} onClick={() => { setSelectedPhoto(photo); setGalleryOpen(true); }} type="button"><img alt={`${photo.movementName} fotoğrafı`} loading="lazy" src={photo.imageData} /><span><strong>{photo.movementName}</strong><small>{photo.dateKey} · %{photo.score}</small></span></button>)}</div> : <p>Bu form için henüz fotoğraf yok. Pratikte hedef uyuma ulaştığında burada görünecek.</p>}</section>
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
          </div> : <div className={styles.galleryEmpty}><span>📷</span><strong>Henüz fotoğrafın yok</strong><p>Kameranla hedef uyuma ulaştığında üç fotoğraf burada görünecek.</p></div>}
        </section>
      </div> : null}
      <footer className={styles.note}>
        <p>{meridianTeachingMethod}</p>
        <small>{meridianClinicalBoundary}</small>
      </footer>
    </main>
  );
}
