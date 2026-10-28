import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Zap, ZapOff, Image as ImageIcon, ShieldAlert } from 'lucide-react';
import { useData } from '../../os/dataStore';
import { useOS } from '../../os/store';
import { uid } from '../../os/storage';
import './CameraApp.css';

type Mode = 'Photo' | 'Portrait' | 'Video';

export default function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState<Mode>('Photo');
  const [flashFx, setFlashFx] = useState(false);
  const photos = useData((s) => s.photos);
  const patch = useData((s) => s.patch);
  const showToast = useOS((s) => s.showToast);
  const openApp = useOS((s) => s.openApp);

  useEffect(() => {
    let active: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((s) => {
        active = s;
        setStream(s);
        setError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => undefined);
        }
      })
      .catch(() => {
        setError('Camera unavailable or permission denied — showing a simulated viewfinder.');
      });
    return () => {
      active?.getTracks().forEach((t) => t.stop());
      setStream(null);
    };
  }, [facing]);

  const capture = () => {
    if (mode !== 'Photo' && mode !== 'Portrait') {
      showToast('Video recording is not available in this web simulation');
      return;
    }
    setFlashFx(flash);
    setTimeout(() => setFlashFx(false), 180);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d')!;
    if (stream && video && video.videoWidth) {
      if (mode === 'Portrait') {
        ctx.filter = 'blur(6px) saturate(1.1)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        ctx.drawImage(video, canvas.width * 0.22, canvas.height * 0.18, canvas.width * 0.56, canvas.height * 0.5);
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    } else {
      // Demo scene
      const grad = ctx.createLinearGradient(0, 0, 0, 1280);
      grad.addColorStop(0, '#1b2735');
      grad.addColorStop(1, '#090a0f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.fillStyle = '#d71921';
      ctx.beginPath();
      ctx.arc(360, 520, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 720, Math.random() * 1280, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = '600 34px sans-serif';
      ctx.fillText('Nothing Camera · demo capture', 90, 1180);
    }
    const src = canvas.toDataURL('image/jpeg', 0.85);
    patch('photos', [{ id: uid(), src, at: Date.now(), album: 'Camera' }, ...photos]);
    showToast('Photo saved to Gallery');
  };

  return (
    <div className="camera-app">
      <div className="viewfinder">
        {stream ? (
          <video ref={videoRef} playsInline muted className={facing === 'user' ? 'mirror' : ''} />
        ) : (
          <div className="demo-viewfinder dot-matrix">
            <div className="demo-ring" />
          </div>
        )}
        <canvas ref={canvasRef} hidden />
        {flashFx && <div className="capture-flash" />}
        <div className="cam-topbar">
          <button onClick={() => setFlash(!flash)} className="cam-chip" aria-label="Flash">
            {flash ? <Zap size={17} /> : <ZapOff size={17} />}
          </button>
          <button onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))} className="cam-chip" aria-label="Switch camera">
            <RefreshCw size={17} />
          </button>
        </div>
        {error && (
          <div className="cam-warning">
            <ShieldAlert size={14} /> {error}
          </div>
        )}
      </div>

      <div className="cam-bottom">
        <div className="cam-modes">
          {(['Video', 'Photo', 'Portrait'] as Mode[]).map((m) => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
              {m}
            </button>
          ))}
        </div>
        <div className="cam-controls">
          <button className="cam-thumb" onClick={() => openApp('photos')} aria-label="Open gallery">
            {photos[0] ? <img src={photos[0].src} alt="" /> : <ImageIcon size={20} />}
          </button>
          <button className={`shutter ${mode === 'Video' ? 'video' : ''}`} onClick={capture} aria-label="Capture" />
          <button className="cam-chip big" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))} aria-label="Flip">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
