import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Pause, Trash2, MicOff, FileAudio } from 'lucide-react';
import { loadSlice, queueSave, uid } from '../../os/storage';
import { useOS } from '../../os/store';
import { EmptyState, ConfirmDialog } from '../../components/ui';
import type { Recording } from '../../os/types';
import './RecorderApp.css';

export default function RecorderApp() {
  const [recordings, setRecordings] = useState<Recording[]>(() => loadSlice<Recording[]>('recordings', []));
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [demo, setDemo] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioMap = useRef<Map<string, string>>(new Map());
  const showToast = useOS((s) => s.showToast);

  useEffect(() => {
    queueSave(
      'recordings',
      recordings.map(({ dataUrl: _d, ...rest }) => rest),
    );
  }, [recordings]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 250);
    return () => clearInterval(t);
  }, [recording]);

  const start = async () => {
    startRef.current = Date.now();
    setElapsed(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const rec: Recording = {
          id: uid(),
          name: `Recording ${recordings.length + 1}`,
          at: Date.now(),
          duration: Math.max(1, Math.round((Date.now() - startRef.current) / 1000)),
          dataUrl: url,
        };
        audioMap.current.set(rec.id, url);
        setRecordings((r) => [rec, ...r]);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setDemo(false);
      setRecording(true);
    } catch {
      // No mic / permission denied -> demo timer mode
      setDemo(true);
      setRecording(true);
      showToast('Microphone unavailable — recording in demo mode');
    }
  };

  const stop = () => {
    if (demo) {
      const rec: Recording = {
        id: uid(),
        name: `Demo recording ${recordings.length + 1}`,
        at: Date.now(),
        duration: elapsed,
      };
      setRecordings((r) => [rec, ...r]);
      setDemo(false);
    } else {
      mediaRef.current?.stop();
    }
    setRecording(false);
  };

  const togglePlay = (r: Recording) => {
    const url = r.dataUrl ?? audioMap.current.get(r.id);
    if (!url) {
      showToast('Demo recording has no audio track');
      return;
    }
    if (playing === r.id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    audioRef.current?.pause();
    const a = new Audio(url);
    a.onended = () => setPlaying(null);
    a.play();
    audioRef.current = a;
    setPlaying(r.id);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="recorder-app app-chrome">
      <header className="app-header"><h1>Recorder</h1></header>
      <div className="app-body app-scroll">
        <div className={`recorder-hero ${recording ? 'live' : ''}`}>
          <div className="rec-wave">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${i * 90}ms`, animationPlayState: recording ? 'running' : 'paused' }} />
            ))}
          </div>
          <strong>{fmt(elapsed)}</strong>
          <small>{recording ? (demo ? 'Demo mode — no microphone' : 'Recording…') : 'Ready to record'}</small>
          <button className={`record-btn ${recording ? 'stop' : ''}`} onClick={recording ? stop : start} aria-label={recording ? 'Stop' : 'Record'}>
            {recording ? <Square size={24} /> : <Mic size={26} />}
          </button>
        </div>

        {recordings.length === 0 ? (
          <EmptyState icon={<MicOff size={26} />} title="No recordings" text="Tap the red button to record your first memo." />
        ) : (
          <div className="n-list-group" style={{ margin: 14 }}>
            {recordings.map((r) => (
              <div className="n-list-row" key={r.id}>
                <span className="row-icon"><FileAudio size={17} /></span>
                <span className="row-text">
                  <span>{r.name}</span>
                  <small>{fmt(r.duration)} · {new Date(r.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</small>
                </span>
                <button className="inline-icon" onClick={() => togglePlay(r)} aria-label="Play">
                  {playing === r.id ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button className="inline-icon danger" onClick={() => setToDelete(r.id)} aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        title="Delete recording?"
        text="This memo will be permanently removed."
        danger
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          setRecordings((r) => r.filter((x) => x.id !== toDelete));
          setToDelete(null);
        }}
      />
    </div>
  );
}
