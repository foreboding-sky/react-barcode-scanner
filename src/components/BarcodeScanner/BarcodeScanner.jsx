import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const BarcodeScanner = () => {
    const videoRef = useRef < HTMLVideoElement > (null);
    const [barcode, setBarcode] = useState < string | null > (null);
    const [error, setError] = useState < string | null > (null);

    useEffect(() => {
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
        };
    }, []);

    return (
        <div style={{ padding: 10 }}>
            <h2>📷 Barcode Scanner</h2>
            <video ref={videoRef} style={{ width: '100%', borderRadius: 8 }} />

            <div style={{ marginTop: 20 }}>
                {barcode && (
                    <div style={{ color: 'green', fontSize: 18 }}>
                        ✅ Scanned: <strong>{barcode}</strong>
                    </div>
                )}
                {error && (
                    <div style={{ color: 'red' }}>
                        ⚠️ Error: <strong>{error}</strong>
                    </div>
                )}
                {!barcode && !error && (
                    <div style={{ color: '#555' }}>
                        Point the camera at a barcode...
                    </div>
                )}
            </div>
        </div>
    );
};

export default BarcodeScanner;
