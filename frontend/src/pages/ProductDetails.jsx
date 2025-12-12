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
        <div className="container fade-in" style={{ paddingTop: '50px', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
            <div className="card" style={{ backgroundColor: 'white', display: 'flex', flexDirection: 'column', maxWidth: '800px', width: '100%', position: 'relative' }}>
                <Link to="/search" style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '1.5rem', color: '#333' }}>&larr;</Link>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', padding: '20px' }}>
                    <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img
                            src={product.image}
                            alt={product.name}
                            style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '10px' }}
                            onError={(e) => { e.target.src = '/static/images/placeholder.svg'; }}
                        />
                    </div>

                    <div style={{ flex: '1 1 300px' }}>
                        <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>{product.name}</h1>
                        <p style={{ fontSize: '1.5rem', color: '#e74c3c', fontWeight: 'bold', marginBottom: '20px' }}>₹{product.price}</p>

                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', display: 'inline-block' }}>Description</h3>
                            <p style={{ lineHeight: '1.6', color: '#555', marginTop: '10px' }}>{product.description}</p>
                        </div>

                        <div style={{ backgroundColor: '#ecf0f1', padding: '20px', borderRadius: '8px' }}>
                            <h3 style={{ margin: 0, marginBottom: '10px', color: '#34495e' }}>Location</h3>
                            <p style={{ fontSize: '1.2rem', color: '#2980b9' }}>📍 {product.location}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
