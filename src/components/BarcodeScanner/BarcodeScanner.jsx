import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const BarcodeScanner = () => {
    const videoRef = useRef(null);
    const [barcode, setBarcode] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const startScanner = async () => {
            try {
                // Check if we're on a mobile device
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                if (!isMobile) {
                    setError('This scanner works best on mobile devices with a camera');
                    setIsLoading(false);
                    return;
                }

                // Request camera permission
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment', // Use back camera on mobile
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });

                setHasPermission(true);
                setIsLoading(false);

                const codeReader = new BrowserMultiFormatReader();
                let isScanning = true;

                codeReader
                    .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                        if (result && isScanning) {
                            setBarcode(result.getText());
                            isScanning = false;
                            codeReader.reset(); // stop scanning after success
                        }
                        if (err && !(err.name === 'NotFoundException')) {
                            setError(err.message || 'Unknown error');
                        }
                    })
                    .catch((err) => setError(err.message));

                return () => {
                    codeReader.reset(); // Cleanup
                    stream.getTracks().forEach(track => track.stop());
                };
            } catch (err) {
                setError('Camera permission denied or not available: ' + err.message);
                setIsLoading(false);
            }
        };

        startScanner();
    }, []);

    return (
        <div style={{ padding: 20, maxWidth: '100%', textAlign: 'center' }}>
            <h2>📷 Mobile Barcode Scanner</h2>

            {isLoading && (
                <div style={{ color: '#666', fontSize: 16, margin: '20px 0' }}>
                    🔄 Initializing camera...
                </div>
            )}

            {hasPermission && (
                <video
                    ref={videoRef}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        borderRadius: 12,
                        border: '2px solid #ddd'
                    }}
                    autoPlay
                    playsInline
                    muted
                />
            )}

            <div style={{ marginTop: 20 }}>
                {barcode && (
                    <div style={{
                        color: 'green',
                        fontSize: 18,
                        padding: '15px',
                        backgroundColor: '#f0fff0',
                        borderRadius: 8,
                        border: '1px solid #90EE90'
                    }}>
                        ✅ Scanned: <strong>{barcode}</strong>
                    </div>
                )}
                {error && (
                    <div style={{
                        color: 'red',
                        padding: '15px',
                        backgroundColor: '#fff0f0',
                        borderRadius: 8,
                        border: '1px solid #ffcccb'
                    }}>
                        ⚠️ Error: <strong>{error}</strong>
                    </div>
                )}
                {hasPermission && !barcode && !error && !isLoading && (
                    <div style={{
                        color: '#555',
                        padding: '15px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: 8,
                        border: '1px solid #ddd'
                    }}>
                        📱 Point your camera at a barcode to scan...
                    </div>
                )}
            </div>

            <div style={{
                marginTop: 30,
                fontSize: 14,
                color: '#888',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: 8
            }}>
                <p>💡 Tip: This scanner works best on mobile devices with a back camera</p>
                <p>🔒 Camera permission is required for scanning</p>
            </div>
        </div>
    );
};

export default BarcodeScanner;
