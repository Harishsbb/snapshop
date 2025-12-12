import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import axios from 'axios';
import '../index.css';

const Scanner = () => {
    const [scannedItems, setScannedItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [scanning, setScanning] = useState(false);
    const [recommendations, setRecommendations] = useState([]);

    const scannerRef = useRef(null); // Stores the Html5Qrcode instance
    const lastScannedCode = useRef(null);
    const lastScannedTime = useRef(0);

    const fetchCart = async () => {
        try {
            const res = await axios.get('/get-scanned-items');
            setScannedItems(res.data.products || []);
            setTotalPrice(res.data.total_prize || 0);
        } catch (err) {
            console.error("Error fetching cart", err);
        }
    };

    const fetchRecommendations = async () => {
        try {
            const res = await axios.get('/recommended');
            setRecommendations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Initial load
    useEffect(() => {
        fetchCart();
        fetchRecommendations();
    }, []);

    const handleScanSuccess = async (decodedText, decodedResult) => {
        const now = Date.now();
        // Debounce: Ignore same code if scanned within 2 seconds
        if (decodedText === lastScannedCode.current && (now - lastScannedTime.current) < 2000) {
            return;
        }

        lastScannedCode.current = decodedText;
        lastScannedTime.current = now;

        console.log(`Scan result: ${decodedText}`);

        try {
            const res = await axios.post('/scan-item', { barcode: decodedText });

            if (res.data.status === 'success') {
                const beep = new Audio('/static/sounds/success.mp3');
                beep.play().catch(e => console.log('Sound error', e));
                alert(`Added: ${res.data.product}`);
                fetchCart();
            } else {
                alert(res.data.message || "Product not found");
            }
        } catch (err) {
            console.error("Scan API error detail:", err);
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                alert(`Server Error: ${err.response.status} - ${err.response.data.message || err.response.statusText}`);
            } else if (err.request) {
                // The request was made but no response was received
                alert("Network Error: No response from server. Check if backend is running on port 5000.");
            } else {
                // Something happened in setting up the request that triggered an Error
                alert(`Error: ${err.message}`);
            }
        }
    };

    useEffect(() => {
        // Start scanner when 'scanning' state becomes true
        if (scanning) {
            const startScanner = async () => {
                try {
                    // Ensure previous instance is stopped/cleared
                    if (scannerRef.current) {
                        try {
                            await scannerRef.current.stop();
                        } catch (e) { /* ignore if not running */ }
                        scannerRef.current = null;
                    }

                    const html5QrCode = new Html5Qrcode("reader");
                    scannerRef.current = html5QrCode;

                    const config = {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.QR_CODE]
                    };

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        handleScanSuccess,
                        (errorMessage) => {
                            // console.log(errorMessage); // verbose
                        }
                    );
                } catch (err) {
                    console.error("Error starting scanner", err);
                    setScanning(false);
                    alert("Failed to start camera. Please ensure you gave permission.");
                }
            };

            // Allow a small tick for DOM element #reader to be ready
            setTimeout(startScanner, 100);
        } else {
            // Cleanup when scanning becomes false
            if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current.clear();
                    scannerRef.current = null;
                }).catch(err => {
                    console.warn("Failed to stop scanner", err);
                });
            }
        }

        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop();
                    scannerRef.current.clear();
                } catch (e) { console.warn(e); }
            }
        };
    }, [scanning]);

    const handleStartScan = () => setScanning(true);
    const handleStopScan = () => setScanning(false);

    const handleGenerateBill = () => {
        window.open('/bill', '_blank', 'width=600,height=800');
    };

    return (
        <div className="fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Smart Shopping Scanner</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '20px' }}>
                {/* Left Column: Camera */}
                <div className="card" style={{ backgroundColor: 'white', minHeight: '400px', position: 'relative' }}>
                    {/* The reader div must always exist in DOM if we want to mount to it, 
                         or be conditionally rendered. Here we conditionally render the div 
                         BUT we need to be careful with timing. */}
                    {scanning && <div id="reader" style={{ width: '100%', height: '100%' }}></div>}

                    {!scanning && (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <h3>Ready to Shop?</h3>
                            <button className="btn btn-primary" onClick={handleStartScan} style={{ fontSize: '1.2em', padding: '15px 30px' }}>
                                Start Camera
                            </button>
                        </div>
                    )}

                    {scanning && (
                        <button className="btn btn-danger" onClick={handleStopScan} style={{ marginTop: '10px', width: '100%' }}>
                            Stop Camera
                        </button>
                    )}
                </div>

                {/* Right Column: Cart */}
                <div className="card" style={{ backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#2c3e50' }}>Your Cart</h3>
                        <span style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#27ae60' }}>₹{totalPrice.toFixed(2)}</span>
                    </div>

                    <div style={{ height: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', marginBottom: '15px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
                                <tr>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Item</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Qty</th>
                                    <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scannedItems.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {scannedItems.length === 0 && (
                                    <tr>
                                        <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: '#ccc' }}>
                                            Cart is empty. Scan products to begin!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary" style={{ flex: 1, backgroundColor: '#27ae60' }} onClick={handleGenerateBill} disabled={scannedItems.length === 0}>
                            Generate Bill
                        </button>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div style={{ marginTop: '30px' }}>
                <h3>You might also like</h3>
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {recommendations.map((rec, i) => (
                        <div key={i} className="card" style={{ minWidth: '200px', backgroundColor: 'white', padding: '10px' }}>
                            <img src={rec.image} style={{ width: '100%', height: '120px', objectFit: 'contain' }} alt={rec.name} />
                            <h5 style={{ margin: '10px 0 5px', fontSize: '14px' }}>{rec.name}</h5>
                            <div style={{ fontWeight: 'bold', color: '#e74c3c' }}>₹{rec.price}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Scanner;
