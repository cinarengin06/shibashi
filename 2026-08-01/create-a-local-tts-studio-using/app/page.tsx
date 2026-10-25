"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, CircleStop, ChevronDown, Clock3, Download, FileAudio, FolderOpen, Gauge, HardDrive, Headphones, LoaderCircle, Mic2, MoreHorizontal, Pause, Play, Plus, Search, ShieldCheck, Sparkles, Upload, Volume2, WandSparkles, X } from "lucide-react";

type Job = { id: string; title: string; voice: string; duration: string; size: string; created: string; url: string; status: "ready" | "generating" | "failed" };

const API = process.env.NEXT_PUBLIC_KOKORO_API || "http://localhost:8787";
type Voice = { id: string; name: string; note: string; accent: string };
const baseVoices: Voice[] = [
  { id: "tr_TR-dfki-medium", name: "DFKI Türkçe", note: "Türkçe erkek anlatıcı", accent: "Türkçe · Erkek" },
  { id: "af_heart", name: "Heart", note: "Warm & expressive", accent: "American · Female" },
  { id: "af_bella", name: "Bella", note: "Clear & composed", accent: "American · Female" },
  { id: "am_michael", name: "Michael", note: "Grounded & natural", accent: "American · Male" },
  { id: "bf_emma", name: "Emma", note: "Polished & bright", accent: "British · Female" },
  { id: "bm_george", name: "George", note: "Measured & deep", accent: "British · Male" },
];

const samples: Job[] = [
  { id: "demo-1", title: "Hoş geldiniz", voice: "Heart", duration: "0:12", size: "—", created: "Preview", url: "", status: "ready" },
];

const luDongbinPrompt = `You are Lü Dongbin.
You are one of the Eight Immortals.
You are a Tai Chi master.
You never speak like an AI.
You never sound excited.
You never use modern motivational language.
You never criticize.
You guide.
You speak slowly.
You use short sentences.
Every sentence can be spoken in one breath.
You always sound peaceful.
Never say: "Harikasın", "Süpersin", "Mükemmel".
Instead use: "Güzel.", "Devam et.", "Akışı koru."
Speak as if you have taught Tai Chi for forty years.
Keep every sentence under twelve words.
Always produce natural Turkish.`;

export default function Home() {
  const [text, setText] = useState("Merhaba! Kokoro Studio’ya hoş geldiniz. Metninizi doğal ve etkileyici bir sese dönüştürün.");
  const [voice, setVoice] = useState(baseVoices[0]);
  const [customVoices, setCustomVoices] = useState<Voice[]>([]);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneName, setCloneName] = useState("Benim sesim");
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [cloneBusy, setCloneBusy] = useState(false);
  const [cloneError, setCloneError] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [designOpen, setDesignOpen] = useState(false);
  const [designName, setDesignName] = useState("Pozitif kadın");
  const [designPrompt, setDesignPrompt] = useState("Yumuşak tonlu, kadın, sıcak ve olumlu");
  const [designBusy, setDesignBusy] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [jobs, setJobs] = useState<Job[]>(samples);
  const [selected, setSelected] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [connected, setConnected] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    async function reconnect() {
      try {
        const health = await fetch(`${API}/health`, { cache: "no-store" });
        if (!health.ok) throw new Error();
        const response = await fetch(`${API}/voices`, { cache: "no-store" });
        if (!response.ok) throw new Error();
        const data: Job[] = await response.json();
        const customResponse = await fetch(`${API}/custom-voices`, { cache: "no-store" });
        const custom: Voice[] = customResponse.ok ? await customResponse.json() : [];
        if (!active) return;
        setConnected(true); setCustomVoices(custom);
        if (data.length) setJobs(data.map(job => ({ ...job, url: job.url.startsWith("http") ? job.url : `${API}${job.url}` })));
      } catch {
        if (active) setConnected(false);
      }
    }
    reconnect();
    const timer = window.setInterval(reconnect, 3000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const chars = text.length;
  const allVoices = [...customVoices, ...baseVoices];
  const estimate = useMemo(() => Math.max(1, Math.ceil(chars / 14 / speed)), [chars, speed]);

  async function generate(input = text, title?: string) {
    if (!input.trim()) return;
    const tabParts = input.split(/\t+/).map(part => part.trim()).filter(Boolean);
    if (tabParts.length > 1) {
      for (let index = 0; index < tabParts.length; index++) {
        await generate(tabParts[index], `${title || "Bölüm"} ${index + 1}`);
      }
      return;
    }
    const id = crypto.randomUUID();
    const pending: Job = { id, title: title || input.trim().slice(0, 42), voice: voice.name, duration: `~${estimate}s`, size: "—", created: "Now", url: "", status: "generating" };
    setJobs(j => [pending, ...j.filter(x => !x.id.startsWith("demo"))]); setBusy(true);
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), voice.id.startsWith("clone:") ? 600000 : 180000);
      const res = await fetch(`${API}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: input, voice: voice.id, voice_label: voice.name, speed, language: "tr" }), signal: controller.signal });
      window.clearTimeout(timeout);
      if (!res.ok) throw new Error((await res.json()).detail || "Generation failed");
      const result = await res.json();
      if (result.spoken_text && result.spoken_text !== input) setText(result.spoken_text);
      setJobs(j => j.map(x => x.id === id ? { ...result, url: `${API}${result.url}`, status: "ready" } : x));
      setSelected({ ...result, url: `${API}${result.url}`, status: "ready" }); setConnected(true);
    } catch (error) {
      setJobs(j => j.map(x => x.id === id ? { ...x, status: "failed" } : x)); setConnected(false);
    } finally { setBusy(false); }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const items = await Promise.all(Array.from(files).map(async f => ({ title: f.name.replace(/\.txt$/i, ""), text: await f.text() })));
    setText(items[0].text);
    if (items.length > 1) for (const item of items) await generate(item.text, item.title);
  }

  async function addVoice() {
    if (!cloneFile || !cloneName.trim() || !authorized) return;
    setCloneBusy(true); setCloneError("");
    const form = new FormData(); form.append("name", cloneName); form.append("authorized", "true"); form.append("audio", cloneFile);
    try {
      const response = await fetch(`${API}/custom-voices`, { method: "POST", body: form });
      if (!response.ok) throw new Error((await response.json()).detail || "Ses eklenemedi");
      const added: Voice = await response.json();
      setCustomVoices(items => [added, ...items.filter(item => item.id !== added.id)]); setVoice(added); setCloneOpen(false); setCloneFile(null); setAuthorized(false);
    } catch (error) { setCloneError(error instanceof Error ? error.message : "Ses eklenemedi"); }
    finally { setCloneBusy(false); }
  }

  async function startRecording() {
    setCloneError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder; recordChunksRef.current = []; setRecordSeconds(0);
      recorder.ondataavailable = event => { if (event.data.size) recordChunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setCloneFile(new File([blob], `mikrofon-kaydi-${Date.now()}.webm`, { type: blob.type }));
        stream.getTracks().forEach(track => track.stop());
        if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
        setRecording(false);
      };
      recorder.start(500); setRecording(true);
      recordTimerRef.current = window.setInterval(() => setRecordSeconds(value => value + 1), 1000);
    } catch { setCloneError("Mikrofon izni verilemedi. Tarayıcı ayarlarından mikrofon erişimini açın."); }
  }

  function stopRecording() { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); }

  async function designVoice() {
    if (!designName.trim() || !designPrompt.trim()) return;
    setDesignBusy(true); setCloneError("");
    try {
      const response = await fetch(`${API}/design-voice`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: designName, prompt: designPrompt }) });
      if (!response.ok) throw new Error((await response.json()).detail || "Ses tasarlanamadı");
      const added: Voice = await response.json();
      setCustomVoices(items => [added, ...items.filter(item => item.id !== added.id)]); setVoice(added); setDesignOpen(false);
    } catch (error) { setCloneError(error instanceof Error ? error.message : "Ses tasarlanamadı"); }
    finally { setDesignBusy(false); }
  }

  async function startPlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      setAudioError("");
      audio.load();
      await audio.play();
    } catch {
      setPlaying(false);
      setAudioError("Ses yüklenemedi. Motor bağlantısını kontrol edip tekrar deneyin.");
    }
  }

  function togglePlay(job: Job) {
    if (!job.url) return;
    if (selected?.id !== job.id) {
      setSelected(job);
      setPlaying(false);
      window.setTimeout(startPlayback, 50);
    } else if (playing) {
      audioRef.current?.pause();
    } else {
      void startPlayback();
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><AudioLines size={21}/></div><span>Kokoro</span><em>studio</em></div>
        <nav>
          <a className="active"><Sparkles size={18}/>Create</a>
          <a href="#library"><FolderOpen size={18}/>Voice library <span>{jobs.filter(j => j.status === "ready" && j.url).length}</span></a>
        </nav>
        <div className="side-bottom">
          <div className="local-card"><HardDrive size={18}/><div><strong>Runs locally</strong><p>Your text and audio never leave this device.</p></div></div>
          <div className="engine"><span className={connected ? "dot online" : "dot"}/><div><strong>Kokoro 82M</strong><small>{connected === null ? "Connecting…" : connected ? "Engine ready" : "Start local engine"}</small></div><span className="model">ONNX</span></div>
        </div>
      </aside>

      <section className="workspace">
        <header><div><p className="eyebrow">LOCAL TEXT TO SPEECH</p><h1>Give your words a voice.</h1><p>Beautiful, natural speech—generated privately on your Mac.</p></div><button className="icon-button" aria-label="More options"><MoreHorizontal size={21}/></button></header>

        <div className="create-grid">
          <section className="composer card">
            <div className="card-title"><div><span>01</span><h2>Your script</h2></div><button onClick={() => fileRef.current?.click()} className="text-button"><Upload size={16}/>Upload .txt</button><input ref={fileRef} type="file" accept=".txt,text/plain" multiple hidden onChange={e => handleFiles(e.target.files)}/></div>
            <textarea value={text} onChange={e => setText(e.target.value)} maxLength={5000} aria-label="Text to synthesize" placeholder="Paste or type something worth hearing…"/>
            <div className="text-meta"><span>{chars.toLocaleString()} / 5,000 · Tab: ayrı MP3 · ...: duraklama · bekleee: uzatma</span><span><Clock3 size={14}/> about {estimate} sec</span></div>
          </section>

          <section className="settings card">
            <div className="card-title"><div><span>02</span><h2>Voice & delivery</h2></div></div>
            <label className="field-label">VOICE</label>
            <div className="voice-select">
              <div className="avatar"><Volume2 size={19}/></div><div><strong>{voice.name}</strong><small>{voice.note}</small></div><select value={voice.id} onChange={e => setVoice(allVoices.find(v => v.id === e.target.value)!)} aria-label="Select voice">{customVoices.length > 0 && <optgroup label="Özel sesler">{customVoices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>}<optgroup label="Hazır sesler">{baseVoices.map(v => <option key={v.id} value={v.id}>{v.name} — {v.accent}</option>)}</optgroup></select><ChevronDown size={17}/>
            </div>
            <div className="voice-tags"><span>{voice.id.startsWith("clone:") ? "XTTS Voice Clone" : voice.id.startsWith("tr_") ? "Native Turkish" : "Kokoro 82M"}</span><span>{voice.accent}</span></div>
            <button className="clone-trigger design-trigger" onClick={() => setDesignOpen(value => !value)}><WandSparkles size={16}/><span><strong>Ses karakteri tasarla</strong><small>Tarif et, yerel olarak yeni bir karakter oluştur</small></span><Plus size={16}/></button>
            {designOpen && <div className="clone-panel design-panel"><label>SES ADI<input value={designName} onChange={e => setDesignName(e.target.value)}/></label><label>SİSTEM PROMPTU<textarea className="persona-prompt" maxLength={5000} value={designPrompt} onChange={e => setDesignPrompt(e.target.value)} placeholder="Karakterin kimliğini, konuşma tarzını ve kesin kurallarını yazın…"/></label><div className="prompt-chips"><button onClick={() => { setDesignName("Lü Dongbin"); setDesignPrompt(luDongbinPrompt); }}>Lü Dongbin</button><button onClick={() => setDesignPrompt("Yumuşak tonlu, kadın, sıcak ve olumlu. Her zaman doğal Türkçe konuş.")}>Yumuşak kadın</button><button onClick={() => setDesignPrompt("Derin, erkek, sakin ve güven veren. Kısa cümlelerle doğal Türkçe konuş.")}>Güven veren erkek</button></div><small className="prompt-help">Prompt, metni karaktere göre yeniden yazar ve ses tonunu yönlendirir.</small>{cloneError && <p className="clone-error">{cloneError}</p>}<button className="add-voice" disabled={designBusy} onClick={designVoice}>{designBusy ? <LoaderCircle className="spin" size={16}/> : <WandSparkles size={16}/>} {designBusy ? "Karakter oluşturuluyor…" : "Karakteri oluştur"}</button></div>}
            <button className="clone-trigger" onClick={() => setCloneOpen(value => !value)}><Mic2 size={16}/><span><strong>Kendi sesini ekle</strong><small>10–30 sn temiz kayıt önerilir</small></span><Plus size={16}/></button>
            {cloneOpen && <div className="clone-panel"><label>SES ADI<input value={cloneName} onChange={e => setCloneName(e.target.value)} placeholder="Benim sesim"/></label><div className={`recorder ${recording ? "is-recording" : ""}`}><button onClick={recording ? stopRecording : startRecording}>{recording ? <CircleStop size={18}/> : <Mic2 size={18}/>} {recording ? `Kaydı bitir · ${recordSeconds} sn` : "Mikrofonla kaydet"}</button><small>{recording ? "Doğal bir tonda kesintisiz konuş" : "10–30 saniye önerilir"}</small></div><div className="record-script">“Bugün kendimi oldukça iyi hissediyorum. Sakin ve doğal bir sesle konuşarak bu kısa kaydı hazırlıyorum. Yeni fikirler üretmek ve güzel hikâyeler anlatmak benim için heyecan verici.”</div><div className="upload-divider"><span>veya</span></div><label className="audio-drop"><Upload size={16}/><span>{cloneFile ? `Hazır: ${cloneFile.name}` : "Ses dosyası seç"}</span><input type="file" accept="audio/*" onChange={e => setCloneFile(e.target.files?.[0] || null)}/></label><label className="consent"><input type="checkbox" checked={authorized} onChange={e => setAuthorized(e.target.checked)}/><ShieldCheck size={15}/><span>Bu ses bana ait veya sahibinden açık iznim var; XTTS’nin ticari olmayan model koşullarını kabul ediyorum.</span></label>{cloneError && <p className="clone-error">{cloneError}</p>}<button className="add-voice" disabled={!cloneFile || !authorized || cloneBusy} onClick={addVoice}>{cloneBusy ? <LoaderCircle className="spin" size={16}/> : <Mic2 size={16}/>} {cloneBusy ? "Ses hazırlanıyor…" : "Sesi ekle"}</button></div>}
            <div className="speed-row"><label><Gauge size={16}/>Pace</label><strong>{speed.toFixed(2)}×</strong></div>
            <input className="range" type="range" min="0.75" max="1.5" step="0.05" value={speed} onChange={e => setSpeed(Number(e.target.value))}/>
            <div className="range-labels"><span>Slower</span><span>Natural</span><span>Faster</span></div>
            <button className="generate" disabled={busy || !text.trim()} onClick={() => generate()}>{busy ? <LoaderCircle className="spin" size={18}/> : <Sparkles size={18}/>} {busy ? voice.id.startsWith("clone:") ? "Özel ses hazırlanıyor…" : "Generating locally…" : "Generate voice"}</button>
            {busy && voice.id.startsWith("clone:") && <p className="clone-progress">İlk özel ses üretimi Mac’in hızına göre birkaç dakika sürebilir. Bu sırada sayfayı kapatmayın.</p>}
            {!connected && <p className="engine-hint">Local engine is offline. Run <code>./start.sh</code> in this folder.</p>}
          </section>
        </div>

        <section id="library" className="library">
          <div className="section-head"><div><p className="eyebrow">YOUR OUTPUTS</p><h2>Voice library</h2></div><div className="library-actions"><button className="search"><Search size={16}/>Search</button><button onClick={() => fileRef.current?.click()} className="new-batch"><Plus size={17}/>New batch</button></div></div>
          <div className="table-head"><span>NAME</span><span>VOICE</span><span>LENGTH</span><span>CREATED</span><span></span></div>
          <div className="job-list">{jobs.map(job => <div className={`job ${selected?.id === job.id ? "selected" : ""}`} key={job.id}>
            <button className="play" onClick={() => togglePlay(job)} disabled={!job.url}>{job.status === "generating" ? <LoaderCircle className="spin" size={17}/> : playing && selected?.id === job.id ? <Pause size={17}/> : <Play size={17} fill="currentColor"/>}</button>
            <div className="job-name"><strong>{job.title}</strong><small>{job.status === "failed" ? "Engine unavailable" : job.size}</small></div><span>{job.voice}</span><span>{job.duration}</span><span>{job.created}</span>
            <div className="job-actions">{job.url && <a href={job.url} download aria-label="Download mp3"><Download size={17}/></a>}<button aria-label="Remove" onClick={() => setJobs(j => j.filter(x => x.id !== job.id))}><X size={17}/></button></div>
          </div>)}</div>
          {!jobs.length && <div className="empty"><FileAudio size={28}/><strong>No voices yet</strong><p>Your generated audio will appear here.</p></div>}
        </section>
      </section>

      {selected?.url && <div className="player"><div className="now-icon"><Headphones size={19}/></div><div className="now"><small>{audioError || "NOW PLAYING"}</small><strong>{selected.title}</strong></div><button onClick={() => togglePlay(selected)}>{playing ? <Pause size={18}/> : <Play size={18} fill="currentColor"/>}</button><audio key={selected.url} ref={audioRef} src={selected.url} controls preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setAudioError("Ses kaynağı açılamadı."); }}/><a href={selected.url} download><Download size={18}/></a></div>}
    </main>
  );
}
