import React, { useRef, useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (imageDataUrl: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string>('');

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError('');
        } catch (err) {
            console.error("Camera error:", err);
            setError('No se pudo acceder a la cámara. Verifique los permisos.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                // Set canvas dimensions to match video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Draw video frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert to data URL
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                onCapture(dataUrl);
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto bg-gray-100 p-4 rounded-xl shadow-inner">
            {error ? (
                <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
                    <p>{error}</p>
                    <button onClick={startCamera} className="mt-2 text-blue-600 underline">Reintentar</button>
                </div>
            ) : (
                <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <button
                            onClick={takePhoto}
                            className="bg-white p-4 rounded-full shadow-lg active:scale-95 transition-transform"
                            aria-label="Tomar foto"
                        >
                            <div className="w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center">
                                <Camera className="w-6 h-6 text-blue-500" />
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
