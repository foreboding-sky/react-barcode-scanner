import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/browser';

const BarcodeScanner = () => {
    const videoRef = useRef(null);
    const [barcode, setBarcode] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

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
                    await videoRef.current.play();
                    console.log('Video stream started successfully');
                    console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                }

                setHasPermission(true);
                setIsLoading(false);

                // Wait a bit for video to be ready
                setTimeout(() => {
                    try {
                        // Configure hints for better barcode detection
                        const hints = new Map();
                        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
                            BarcodeFormat.QR_CODE,
                            BarcodeFormat.CODE_128,
                            BarcodeFormat.CODE_39,
                            BarcodeFormat.EAN_13,
                            BarcodeFormat.EAN_8,
                            BarcodeFormat.UPC_A,
                            BarcodeFormat.UPC_E,
                            BarcodeFormat.CODABAR,
                            BarcodeFormat.ITF,
                            BarcodeFormat.PDF_417,
                            BarcodeFormat.AZTEC,
                            BarcodeFormat.DATA_MATRIX
                        ]);
                        hints.set(DecodeHintType.TRY_HARDER, true);
                        hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');

                        codeReader = new BrowserMultiFormatReader(hints);
                        setIsScanning(true);

                        console.log('Starting barcode detection...');
                        console.log('Supported formats:', hints.get(DecodeHintType.POSSIBLE_FORMATS));

                        codeReader
                            .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                                if (result && isScanning) {
                                    console.log('Barcode detected:', result.getText(), 'Format:', result.getBarcodeFormat());
                                    setBarcode(result.getText());
                                    setIsScanning(false);
                                    if (codeReader) {
                                        codeReader.reset();
                                    }
                                }
                                if (err) {
                                    console.log('ZXing error:', err.name, err.message);
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
                }, 2000); // Wait 2 seconds for video to be ready

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
            <h2>📷 Barcode Scanner</h2>

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
                            onClick={() => {
                                setRetryCount(prev => prev + 1);
                                setError(null);
                                setBarcode(null);
                                setIsScanning(false);
                                // Force re-initialization
                                setTimeout(() => {
                                    window.location.reload();
                                }, 100);
                            }}
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
                            🔄 Retry ({retryCount})
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
                <p>📊 Debug: Retry count: {retryCount}</p>
                <p>📱 User Agent: {navigator.userAgent.substring(0, 50)}...</p>
                <details style={{ marginTop: '10px' }}>
                    <summary style={{ cursor: 'pointer', color: '#007bff' }}>🔍 Debug Info</summary>
                    <div style={{ marginTop: '5px', fontSize: '12px', textAlign: 'left' }}>
                        <p>Camera Permission: {hasPermission ? '✅ Granted' : '❌ Not granted'}</p>
                        <p>Video Ready: {videoRef.current ? '✅ Yes' : '❌ No'}</p>
                        <p>Scanning Status: {isScanning ? '✅ Active' : '❌ Inactive'}</p>
                        <p>Loading: {isLoading ? '✅ Yes' : '❌ No'}</p>
                    </div>
                </details>
            </div>
        </div>
    );
};

export default BarcodeScanner;
