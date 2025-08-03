import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const BarcodeScanner = () => {
    const videoRef = useRef(null);
    const [barcode, setBarcode] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        let codeReader = null;
        let stream = null;

        const startScanner = async () => {
            try {
                // Check if we're on a mobile device
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                if (!isMobile) {
                    setError('This scanner works best on mobile devices with a camera');
                    setIsLoading(false);
                    return;
                }

                // Request camera permission with better constraints
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment', // Use back camera on mobile
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 },
                        aspectRatio: { ideal: 1.7777777778 } // 16:9
                    }
                });

                // Set the video stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }

                setHasPermission(true);
                setIsLoading(false);

                // Wait a bit for video to be ready
                setTimeout(() => {
                    try {
                        codeReader = new BrowserMultiFormatReader();
                        setIsScanning(true);

                        codeReader
                            .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                                if (result && isScanning) {
                                    setBarcode(result.getText());
                                    setIsScanning(false);
                                    if (codeReader) {
                                        codeReader.reset();
                                    }
                                }
                                if (err && !(err.name === 'NotFoundException')) {
                                    console.log('ZXing error:', err);
                                    // Don't set error for NotFoundException as it's normal
                                    if (err.name !== 'NotFoundException') {
                                        setError(err.message || 'Unknown error');
                                    }
                                }
                            })
                            .catch((err) => {
                                console.error('ZXing initialization error:', err);
                                setError('Failed to initialize scanner: ' + err.message);
                            });
                    } catch (err) {
                        console.error('CodeReader creation error:', err);
                        setError('Failed to create scanner: ' + err.message);
                    }
                }, 1000); // Wait 1 second for video to be ready

            } catch (err) {
                console.error('Camera permission error:', err);
                setError('Camera permission denied or not available: ' + err.message);
                setIsLoading(false);
            }
        };

        startScanner();

        // Cleanup function
        return () => {
            if (codeReader) {
                try {
                    codeReader.reset();
                } catch (e) {
                    console.log('Cleanup error:', e);
                }
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
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
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                marginLeft: '10px',
                                padding: '5px 10px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            🔄 Retry
                        </button>
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
                        {isScanning ? (
                            <div>
                                🔍 Scanning for barcodes...
                                <div style={{ fontSize: '12px', marginTop: '5px', color: '#888' }}>
                                    Make sure the barcode is well-lit and clearly visible
                                </div>
                            </div>
                        ) : (
                            <div>📱 Point your camera at a barcode to scan...</div>
                        )}
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
