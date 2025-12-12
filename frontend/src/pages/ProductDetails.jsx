import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

const ProductDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const [product, setProduct] = useState(location.state?.product || null);
    const [loading, setLoading] = useState(!product);

    useEffect(() => {
        if (!product) {
            // Fetch all products and find the one with the matching ID
            const fetchProduct = async () => {
                try {
                    const res = await axios.get('/search?query=');
                    // Ensure we compare strings properly (ObjectId is string)
                    const found = res.data.find(p => String(p.id) === String(id));
                    if (found) {
                        setProduct(found);
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [id, product]);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    if (!product) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Product not found. <Link to="/search" style={{ color: '#fff', textDecoration: 'underline' }}>Go back</Link></div>;

    return (
        <div className="container fade-in" style={{
            paddingTop: '20px',
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div className="card" style={{
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '1200px',
                width: '95%',
                height: '85vh', // Fixed height for "full page" feel
                position: 'relative',
                padding: '30px',
                overflow: 'hidden'
            }}>

                {/* Header Title */}
                <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px', fontSize: '2rem' }}>
                    Product Location: {product.location || 'Section A'}
                </h2>

                <div style={{ display: 'flex', flex: 1, gap: '40px', height: '100%' }}>

                    {/* Left Side: Shelf Grid */}
                    <div style={{ flex: '2 1 600px', height: '100%' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gridTemplateRows: 'repeat(4, 1fr)', // Fixed rows
                            gap: '15px',
                            height: '100%',
                            maxHeight: '100%'
                        }}>
                            {/* Create a 5x4 grid (20 slots) */}
                            {[...Array(20)].map((_, i) => {
                                // Deterministic slot position based on product ID hash
                                const productHash = String(product.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                const activeSlot = productHash % 20;
                                const isActive = (i === activeSlot);

                                return (
                                    <div
                                        key={i}
                                        style={{
                                            backgroundColor: isActive ? '#3498db' : '#ecf0f1',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isActive ? 'white' : '#bdc3c7',
                                            fontWeight: 'bold',
                                            border: isActive ? '4px solid #2980b9' : '1px solid #dcdcdc',
                                            position: 'relative',
                                            boxShadow: isActive ? '0 0 20px rgba(52, 152, 219, 0.6)' : 'none',
                                            transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                            transition: 'all 0.3s ease',
                                            zIndex: isActive ? 10 : 1
                                        }}
                                    >
                                        {isActive ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', padding: '5px', justifyContent: 'center' }}>
                                                <img src={product.image} alt="" style={{ height: '70%', objectFit: 'contain', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.2))' }} />
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>{i + 1}</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right Side: Product Info */}
                    <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', paddingLeft: '20px', justifyContent: 'center' }}>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ marginBottom: 'auto' }}>
                                <h1 style={{ color: '#2c3e50', fontSize: '3rem', margin: '0 0 10px 0', lineHeight: 1.2 }}>{product.name}</h1>
                                <p style={{ fontSize: '2.5rem', color: '#e74c3c', fontWeight: 'bold', margin: '0 0 20px 0' }}>₹{product.price}</p>
                            </div>

                            <div style={{ backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '15px', borderLeft: '6px solid #3498db', marginBottom: '30px' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '1px' }}>Shelf Coordinates</h4>
                                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', color: '#2c3e50' }}>
                                    Row {Math.floor((String(product.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 20) / 5) + 1},
                                    Slot {(String(product.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 20) % 5 + 1}
                                </p>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <Link to="/scanner" className="btn btn-primary" style={{ display: 'block', width: '100%', padding: '25px', fontSize: '1.6rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', borderRadius: '12px', boxShadow: '0 10px 20px rgba(39, 174, 96, 0.3)' }}>
                                Start Scanning
                            </Link>
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <Link to="/search" style={{ color: '#7f8c8d', textDecoration: 'none', fontSize: '1.1rem' }}>&larr; Back to Gallery</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
