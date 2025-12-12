import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import axios from 'axios';
import '../index.css';

const Scanner = () => {
    const [scannedItems, setScannedItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [scanning, setScanning] = useState(false);
    const [recommendations, setRecommendations] = useState([]);

    // Sounds
    const beepSound = useRef(null);
    const successSound = useRef(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        // Initialize sounds
        beepSound.current = new Audio('/static/sounds/beep-02.mp3'); // We will need to move sounds to public folder or standard URL
        // Fallback or use standard browser beep if file missing? 
        // For now let's assume assets exist in public. 
        // NOTE: In Vercel React, static assets typically go in 'public' folder. 
        // The python backend used to serve them. We should likely move them or point key urls there.
    }, []);

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

    const handleScanSuccess = async (decodedText, decodedResult) => {
        // Prevent spamming requests for the same barcode instantly? 
        // Html5QrcodeScanner has fps limit, but we can also debounce here.

        console.log(`Scan result: ${decodedText}`, decodedResult);

        // Play Beep
        // beepSound.current.play().catch(e => console.log('Audio play failed', e));

        try {
            // Send barcode to backend
            const res = await axios.post('/scan-item', { barcode: decodedText });

            if (res.data.status === 'success') {
                // Update UI
                fetchCart();
            } else {
                console.log("Product not found or error:", res.data);
            }
        } catch (err) {
            console.error("Scan API error", err);
        }
    };

    const handleScanFailure = (error) => {
        // console.warn(`Code scan error = ${error}`);
    };

    useEffect(() => {
        if (scanning) {
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.QR_CODE]
            };

            // Render scanner
            // We need to ensure the DOM element exists
            const scannerId = "reader";

            if (!scannerRef.current) {
                scannerRef.current = new Html5QrcodeScanner(scannerId, config, /* verbose= */ false);
                scannerRef.current.render(handleScanSuccess, handleScanFailure);
            }
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
                scannerRef.current = null;
            }
        };
    }, [scanning]);

    // Initial load
    useEffect(() => {
        fetchCart();
        fetchRecommendations();
    }, []);

    const handleStartScan = () => {
        setScanning(true);
        // Also call backend to clear session/cart if needed?
        // axios.post('/start', ...); 
    };

    const handleStopScan = () => {
        setScanning(false);
    };

    const handleGenerateBill = () => {
        window.open('/bill', '_blank', 'width=600,height=800');
    };

    return (
        <div className="fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Smart Shopping Scanner</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left Column: Camera */}
                <div className="card" style={{ backgroundColor: 'white', minHeight: '400px', position: 'relative' }}>
                    {!scanning ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <h3>Ready to Shop?</h3>
                            <button className="btn btn-primary" onClick={handleStartScan} style={{ fontSize: '1.2em', padding: '15px 30px' }}>
                                Start Camera
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div id="reader"></div>
                            <button className="btn btn-danger" onClick={handleStopScan} style={{ marginTop: '10px', width: '100%' }}>
                                Stop Camera
                            </button>
                        </div>
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
                                    <th style={{ padding: '10px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {scannedItems.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                            {/* <small>{item.barcode}</small> */}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                            {/* Could add remove button here */}
                                        </td>
                                    </tr>
                                ))}
                                {scannedItems.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#ccc' }}>
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
