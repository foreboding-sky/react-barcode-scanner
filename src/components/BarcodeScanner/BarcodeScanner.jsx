import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';

const BarcodeScanner = () => {
    const videoRef = useRef(null);
    const [barcode, setBarcode] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [logs, setLogs] = useState([]);

    // Function to add logs
    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        setLogs(prev => [...prev, logEntry]);
        console.log(logEntry); // Also log to console for debugging
    };

    useEffect(() => {
        let codeReader = null;
        let stream = null;

        const startScanner = async () => {
            addLog('Starting scanner initialization...');
            try {
                // Check if we're on a mobile device
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                addLog(`Device check: ${isMobile ? 'Mobile device detected' : 'Desktop device detected'}`);

                if (!isMobile) {
                    addLog('Desktop device - setting error message');
                    setError('This scanner works best on mobile devices with a camera');
                    setIsLoading(false);
                    return;
                }

                addLog('Requesting camera permission...');
                // Request camera permission with better constraints
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment', // Use back camera on mobile
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 },
                        aspectRatio: { ideal: 1.7777777778 } // 16:9
                    }
                });
                addLog('Camera permission granted!');

                // Set the video stream
                if (videoRef.current) {
                    addLog('Setting video stream to video element...');
                    videoRef.current.srcObject = stream;
                    addLog('Calling video.play()...');
                    await videoRef.current.play();
                    addLog('Video.play() completed');
                    addLog(`Video dimensions: ${videoRef.current.videoWidth} x ${videoRef.current.videoHeight}`);
                } else {
                    addLog('ERROR: videoRef.current is null!');
                }

                setHasPermission(true);
                setIsLoading(false);
                addLog('Camera setup completed, waiting for video to be ready...');

                // Wait a bit for video to be ready
                setTimeout(() => {
                    addLog('Starting barcode detection setup...');
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

                        addLog('Creating BrowserMultiFormatReader...');
                        codeReader = new BrowserMultiFormatReader(hints);
                        setIsScanning(true);
                        addLog('BrowserMultiFormatReader created successfully');

                        addLog('Starting barcode detection...');
                        addLog('Supported formats: ' + hints.get(DecodeHintType.POSSIBLE_FORMATS).join(', '));

                        codeReader
                            .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                                if (result) {
                                    addLog(`Result received: ${result.getText()} (Format: ${result.getBarcodeFormat()})`);
                                    setBarcode(result.getText());
                                    if (codeReader) {
                                        codeReader.reset();
                                    }
                                }
                                if (err) {
                                    //addLog(`ZXing error: ${err.name} - ${err.message}`);
                                    // Don't set error for NotFoundException as it's normal
                                    //if (err.name !== 'NotFoundException') {
                                    //    setError(err.message || 'Unknown error');
                                    //}
                                }
                            })
                            .catch((err) => {
                                addLog(`ZXing initialization error: ${err.message}`);
                                console.error('ZXing initialization error:', err);
                                setError('Failed to initialize scanner: ' + err.message);
                            });
                    } catch (err) {
                        addLog(`CodeReader creation error: ${err.message}`);
                        console.error('CodeReader creation error:', err);
                        setError('Failed to create scanner: ' + err.message);
                    }
                }, 2000); // Wait 2 seconds for video to be ready

            } catch (err) {
                addLog(`Camera permission error: ${err.message}`);
                console.error('Camera permission error:', err);
                setError('Camera permission denied or not available: ' + err.message);
                setIsLoading(false);
            }
        };

        startScanner();

        // Cleanup function
        return () => {
            addLog('Cleaning up scanner...');
            if (codeReader) {
                try {
                    codeReader.reset();
                    addLog('CodeReader reset completed');
                } catch (e) {
                    addLog(`Cleanup error: ${e.message}`);
                    console.log('Cleanup error:', e);
                }
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                addLog('Camera stream stopped');
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
                <div style={{ marginTop: '5px' }}>
                    <textarea
                        readOnly
                        value={logs.join('\n')}
                        style={{
                            width: '100%',
                            height: '200px',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            backgroundColor: '#000',
                            color: '#0f0',
                            border: '1px solid #333',
                            padding: '5px'
                        }}
                    />
                    <button
                        onClick={() => {
                            setLogs([]);
                            addLog('Logs cleared');
                        }}
                        style={{
                            marginTop: '5px',
                            padding: '3px 8px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '10px'
                        }}
                    >
                        Clear Logs
                    </button>
                </div>

                <p>📊 Debug: Retry count: {retryCount}</p>
                <p>📱 User Agent: {navigator.userAgent.substring(0, 50)}...</p>
            </div>
        </div>
    );
};

export default BarcodeScanner;
