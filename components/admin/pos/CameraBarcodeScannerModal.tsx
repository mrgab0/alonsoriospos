'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function CameraBarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
}: CameraBarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [supportedFormats, setSupportedFormats] = useState<string[]>([]);
  const isDetectingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    setScanning(true);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        startDetectionLoop();
      }
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      setError(
        'No se pudo acceder a la cámara. Asegúrate de conceder permisos de video en tu navegador.'
      );
      setScanning(false);
    }
  };

  const stopCamera = () => {
    isDetectingRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz Beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // AudioContext ignorado si no está disponible
    }
  };

  const startDetectionLoop = async () => {
    isDetectingRef.current = true;

    // Verificar si el navegador soporta BarcodeDetector nativo (Chrome, Edge, Opera, Android)
    const BarcodeDetectorClass = (window as any).BarcodeDetector;

    if (!BarcodeDetectorClass) {
      // Si el navegador no tiene la API nativa, dejamos la vista de cámara activa con input manual de respaldo
      return;
    }

    try {
      const formats = await BarcodeDetectorClass.getSupportedFormats();
      setSupportedFormats(formats);
      const detector = new BarcodeDetectorClass({
        formats: formats.length > 0 ? formats : ['ean_13', 'ean_8', 'code_128', 'qr_code', 'upc_a'],
      });

      const detectFrame = async () => {
        if (!isDetectingRef.current || !videoRef.current) return;

        if (videoRef.current.readyState >= 2) {
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const detected = barcodes[0].rawValue;
              if (detected) {
                playBeep();
                onScan(detected);
                stopCamera();
                onClose();
                return;
              }
            }
          } catch (e) {
            // Error en frame de detección ignorado para el siguiente ciclo
          }
        }

        if (isDetectingRef.current) {
          requestAnimationFrame(detectFrame);
        }
      };

      requestAnimationFrame(detectFrame);
    } catch (e) {
      console.warn('BarcodeDetector no pudo iniciarse:', e);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      playBeep();
      onScan(manualCode.trim());
      stopCamera();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                Lector de Código de Barras
              </h3>
              <span className="text-[10px] text-gray-400">Enfoca el código con la cámara</span>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visor de Cámara */}
        <div className="relative bg-black h-72 flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-rose-400 space-y-2">
              <AlertCircle size={32} className="mx-auto" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />

              {/* Guía visual de escaneo */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-36 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500/80 animate-pulse shadow-sm" />
                </div>
              </div>

              <div className="absolute bottom-3 inset-x-0 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono">
                  Alinea el código dentro del recuadro
                </span>
              </div>
            </>
          )}
        </div>

        {/* Entrada Manual de Respaldo */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="O ingresa código manualmente..."
              className="flex-1 p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono dark:text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
            >
              Listo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
