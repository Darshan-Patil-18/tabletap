import { useState, useRef } from 'react';
import { parseOCRText, mergeParsedIntoMenu } from '../ocrParser.js';
import ReviewMenu from './ReviewMenu.jsx';

export default function CameraCapture({ email, existingMenu, onSave, onCancel }) {
  const [mode, setMode] = useState('choose'); // choose | progress | review | error
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [parsed, setParsed] = useState([]);
  const [errMsg, setErrMsg] = useState('');
  const galleryRef = useRef();
  const cameraRef = useRef();

  async function runOCR(file) {
    setMode('progress');
    setOcrProgress(0);
    setOcrStatus('Initializing OCR engine…');
    try {
      const TesseractModule = await import('tesseract.js');
      const createWorker = TesseractModule.createWorker || (TesseractModule.default && TesseractModule.default.createWorker);
      if (!createWorker) {
        throw new Error('Could not initialize OCR worker');
      }
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          } else {
            setOcrStatus(m.status);
          }
        },
      });
      setOcrStatus('Reading text…');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      setOcrProgress(100);
      setOcrStatus('Parsing menu…');

      const result = parseOCRText(text);
      if (!result.length) {
        setErrMsg("Couldn't find any menu items. The image might be unclear — try again or add manually.");
        setMode('error');
        return;
      }
      setParsed(result);
      setMode('review');
    } catch (err) {
      setErrMsg('OCR failed: ' + (err.message || 'Unknown error'));
      setMode('error');
    }
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (file) runOCR(file);
  }

  if (mode === 'choose') return (
    <div className="fade-in p-6 flex flex-col gap-4 items-center">
      <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Scan Menu Photo</h2>
      <p className="text-sm text-center" style={{ color: 'var(--text2)' }}>
        Point your camera at a printed menu or upload a photo from gallery.
        OCR runs fully on your device — no data is sent anywhere.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {/* Gallery upload */}
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button className="btn btn-primary w-full py-4 text-base"
          onClick={() => galleryRef.current.click()}>
          🖼️ Upload from Gallery
        </button>

        {/* Camera (direct capture) */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <button className="btn btn-secondary w-full py-4 text-base"
          onClick={() => cameraRef.current.click()}>
          📷 Take Photo Now
        </button>

        <button className="btn btn-ghost w-full" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );

  if (mode === 'progress') return (
    <div className="fade-in p-8 flex flex-col items-center gap-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        <span className="text-3xl">🔍</span>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Reading Menu…</h2>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>{ocrStatus || 'Please wait…'}</p>
      </div>
      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text2)' }}>
          <span>Progress</span><span>{ocrProgress}%</span>
        </div>
        <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: 'var(--surface2)' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${ocrProgress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        </div>
      </div>
      <p className="text-xs" style={{ color: 'var(--text2)' }}>
        This runs entirely in your browser. No image is uploaded anywhere.
      </p>
    </div>
  );

  if (mode === 'error') return (
    <div className="fade-in p-8 flex flex-col items-center gap-4 text-center">
      <div className="text-5xl">😕</div>
      <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Couldn't Read Menu</h2>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text2)' }}>{errMsg}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button className="btn btn-primary" onClick={() => setMode('choose')}>Try Again</button>
        <button className="btn btn-secondary" onClick={onCancel}>Add Manually Instead</button>
      </div>
    </div>
  );

  if (mode === 'review') return (
    <ReviewMenu
      parsed={parsed}
      existingMenu={existingMenu}
      onSave={onSave}
      onBack={() => setMode('choose')}
    />
  );

  return null;
}
