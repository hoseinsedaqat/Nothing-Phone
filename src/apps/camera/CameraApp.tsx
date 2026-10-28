import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Zap, ZapOff, Image as ImageIcon, ShieldAlert, Camera as CamIcon, Check } from 'lucide-react';
import { useData } from '../../os/dataStore';
import { useOS } from '../../os/store';
import { uid } from '../../os/storage';
import './CameraApp.css';

type Mode = 'Photo' | 'Portrait' | 'Video';

export default function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState<Mode>('Photo');
  const [flashFx, setFlashFx] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const photos = useData((s) => s.photos);
  const patch = useData((s) => s.patch);
  const showToast = useOS((s) => s.showToast);
  const openApp = useOS((s) => s.openApp);

  const requestCamera = (targetFacing: 'user' | 'environment' = facing) => {
    setPermission('pending');
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission('denied');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: targetFacing }, audio: false })
      .then((s) => {
        setStream(s);
        setPermission('granted');
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => undefined);
        }
      })
      .catch(() => setPermission('denied'));
  };

  useEffect(() => {
    requestCamera(facing);
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  const capture = () => {
    if (mode === 'Video') {
      showToast('Video recording is not available in this web simulation');
      return;
    }
    setFlashFx(flash || permission !== 'granted');
    setTimeout(() => setFlashFx(false), 200);
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d')!;
    const video = videoRef.current;

    if (permission === 'granted' && stream && video && video.videoWidth) {
      if (mode === 'Portrait') {
        ctx.filter = 'blur(8px) saturate(1.05)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        ctx.drawImage(video, canvas.width * 0.2, canvas.height * 0.16, canvas.width * 0.6, canvas.height * 0.52);
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    } else {
      drawDemoScene(ctx);
    }
    const src = canvas.toDataURL('image/jpeg', 0.85);
    patch('photos', [{ id: uid(), src, at: Date.now(), album: 'Camera' }, ...useData.getState().photos]);
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1200);
    showToast('Photo saved to Gallery');
  };

  return (
    <div className="camera-app">
      <div className="viewfinder">
        {permission === 'granted' ? (
          <video ref={videoRef} playsInline muted className={facing === 'user' ? 'mirror' : ''} />
        ) : (
          <div className="demo-viewfinder">
            <div className="demo-sky" />
            <div className="demo-sun" />
            <div className="demo-hills hills-back" />
            <div className="demo-hills hills-front" />
            <div className="demo-grid">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} />
              ))}
            </div>
            <div className="demo-badge">
              <CamIcon size={13} /> Demo viewfinder
            </div>
          </div>
        )}
        <canvas ref={canvasRef} hidden />
        {flashFx && <div className="capture-flash" />}
        {savedTick && (
          <div className="capture-check">
            <Check size={30} />
          </div>
        )}

        <div className="cam-topbar">
          <button onClick={() => setFlash(!flash)} className={`cam-chip ${flash ? 'on' : ''}`} aria-label="Flash">
            {flash ? <Zap size={17} /> : <ZapOff size={17} />}
          </button>
          <button
            onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
            className="cam-chip"
            aria-label="Switch camera"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {permission === 'denied' && (
          <div className="cam-warning">
            <ShieldAlert size={15} />
            <span>Camera unavailable or permission denied — using a simulated viewfinder.</span>
            <button onClick={() => requestCamera()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        )}
        {permission === 'pending' && <div className="cam-loading">Starting camera…</div>}
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
          <button
            className="cam-chip big"
            onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
            aria-label="Flip camera"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Painted demo scene so capture always produces a real, nice image. */
function drawDemoScene(ctx: CanvasRenderingContext2D) {
  const W = 720;
  const H = 1280;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1c2740');
  sky.addColorStop(0.55, '#3a2b46');
  sky.addColorStop(1, '#0c0e16');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Moon / sun glow
  const glow = ctx.createRadialGradient(520, 260, 10, 520, 260, 170);
  glow.addColorStop(0, 'rgba(255,240,220,0.95)');
  glow.addColorStop(0.35, 'rgba(255,220,180,0.35)');
  glow.addColorStop(1, 'rgba(255,220,180,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(300, 40, 420, 420);
  ctx.fillStyle = '#fff4e0';
  ctx.beginPath();
  ctx.arc(520, 260, 52, 0, Math.PI * 2);
  ctx.fill();

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 70; i++) {
    const x = (i * 97) % W;
    const y = (i * 53) % 560;
    ctx.beginPath();
    ctx.arc(x, y, (i % 3) * 0.7 + 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hills
  ctx.fillStyle = '#171a26';
  ctx.beginPath();
  ctx.moveTo(0, 820);
  ctx.quadraticCurveTo(180, 680, 360, 800);
  ctx.quadraticCurveTo(540, 920, 720, 780);
  ctx.lineTo(720, 1280);
  ctx.lineTo(0, 1280);
  ctx.fill();
  ctx.fillStyle = '#0d0f18';
  ctx.beginPath();
  ctx.moveTo(0, 980);
  ctx.quadraticCurveTo(220, 860, 430, 970);
  ctx.quadraticCurveTo(600, 1050, 720, 960);
  ctx.lineTo(720, 1280);
  ctx.lineTo(0, 1280);
  ctx.fill();

  // Red Nothing accent light
  ctx.fillStyle = 'rgba(215,25,33,0.85)';
  ctx.beginPath();
  ctx.arc(130, 1080, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '600 30px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('Nothing Camera · demo capture', 60, 1200);
}
