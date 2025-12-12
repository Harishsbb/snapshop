from flask import Flask, render_template, request, jsonify, send_file, make_response, redirect, url_for, session
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import qrcode
from io import BytesIO
from werkzeug.security import generate_password_hash, check_password_hash
import re
from datetime import datetime
import os
import random

# --- Global State & Setup ---
app = Flask(__name__)
app.secret_key = 'your_super_secure_secret_key' # Use a strong key sessions
CORS(app, supports_credentials=True) # Enable Cross-Origin Resource Sharing

# MongoDB configuration
MONGO_URI = 'mongodb+srv://admin:harish123@cluster0.cfoj6si.mongodb.net/barcodedb?retryWrites=true&w=majority&appName=Cluster0'
DB_NAME = 'barcodedb'

# --- Utility Function for Database Connection ---
def get_db():
    try:
        client = MongoClient(MONGO_URI)
        return client[DB_NAME]
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "SnapShop API is running", "environment": "Vercel"})

# --- Cart Helper Functions ---
def get_cart_for_user():
    # ... logic using session or user_id ...
    # Note: Sessions across domains (Frontend on Vercel -> Backend on Vercel) require careful cookie settings (SameSite=None, Secure).
    # For simplicity, we might assume the frontend sends a custom header 'X-User-ID' or similar if cookies fail, 
    # but let's try standard session first.
    if 'username' not in session:
        return {'products': [], 'total_price': 0.0}
    
    db = get_db()
    if db is None: return {'products': [], 'total_price': 0.0}

    username = session['username']
    cart = db.carts.find_one({"username": username})
    
    if not cart:
         return {'products': [], 'total_price': 0.0}
    
    return cart

def update_cart_in_db(products, total_price):
    if 'username' not in session:
        return
    
    db = get_db()
    if db is None: return

    username = session['username']
    db.carts.update_one(
        {"username": username},
        {"$set": {"products": products, "total_price": total_price, "updated_at": datetime.now()}},
        upsert=True
    )


# --- Routes ---

@app.route('/scan-item', methods=['POST'])
def scan_item():
    """API endpoint to handle barcode scan from frontend."""
    if 'username' not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
        
    data = request.json
    barcode = data.get('barcode').strip()
    
    db = get_db()
    product = db.products.find_one({"barcodedata": barcode})
    
    if not product:
         return jsonify({"status": "error", "message": "Product not found"})
    
    try:
        # Get current cart
        cart = get_cart_for_user()
        current_products = cart.get('products', [])
        
        # Check if item exists in cart
        found = False
        for p in current_products:
            if p['name'] == product['product_name']:
                p['quantity'] += 1
                found = True
                break
                
        if not found:
            try:
                price = float(product['product_price'])
            except (ValueError, TypeError):
                print(f"Price conversion error for {product['product_name']}: {product['product_price']}")
                price = 0.0 # Fallback
                
            current_products.append({
                "name": product['product_name'],
                "price": price,
                "quantity": 1
            })
            
        # Recalculate total
        total_price = sum(float(p['price']) * int(p['quantity']) for p in current_products)
        
        # Save back to DB
        update_cart_in_db(current_products, total_price)
        
        return jsonify({"status": "success", "product": product['product_name']})
    except Exception as e:
        print(f"CRITICAL ERROR in scan_item: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get-scanned-items', methods=['GET'])
def get_scanned_items():
    """Returns the user's cart."""
    cart = get_cart_for_user()
    return jsonify({"products": cart.get('products', []), "total_prize": cart.get('total_price', 0.0)})

@app.route('/change-quantity', methods=['POST'])
def change_quantity():
    if 'username' not in session: return jsonify({"status": "error"}), 401
    
    data = request.json
    product_name = data.get('product_name')
    # Use 'quantity' or 'action' logic. Assuming simple set logic for now or increment.
    # The original was setting specific quantity.
    
    # ... implementation for cart update ...
    # For brevity, let's just implement remove for now if quantity is needed.
    return jsonify({"status": "not implemented yet"})

@app.route('/start', methods=['POST'])
def start_scanning():
    # Only useful if we want to CLEAR the cart
    if 'username' in session:
         update_cart_in_db([], 0.0)
    return jsonify({"status": "Cart cleared"})

@app.route('/')
def home():
    if 'loggedin' in session:
        return redirect(url_for('home_page'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Handles raw JSON from axios (react) OR form data (html)
        if request.is_json:
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
        else:
            username = request.form.get('username')
            password = request.form.get('password')

        db = get_db()
        account = db.users.find_one({"username": username})

        if account and check_password_hash(account['password'], password):
            session['loggedin'] = True
            session['username'] = account['username']
            return jsonify({"status": "success"}) if request.is_json else redirect(url_for('home_page'))
        else:
            msg = 'Invalid credentials'
            return jsonify({"status": "error", "message": msg}) if request.is_json else render_template('login.html', error=msg)

    return render_template('login.html')

@app.route('/home')
def home_page():
    if 'loggedin' in session:
        return render_template('home.html', username=session['username'])
    return redirect(url_for('login'))

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
            email = data.get('email')
        else:
            username = request.form.get('username')
            password = request.form.get('password')
            email = request.form.get('email')
            
        db = get_db()
        hashed_password = generate_password_hash(password)
        
        if db.users.find_one({"username": username}):
             return jsonify({"status": "error", "message": "User exists"}) if request.is_json else "User exists"
             
        db.users.insert_one({
            "username": username,
            "password": hashed_password,
            "email": email,
            "created_at": datetime.now()
        })
        
        return jsonify({"status": "success"}) if request.is_json else redirect(url_for('login'))
        
    return render_template('register.html')

# Stock/Sales Routines (kept relatively same)
@app.route('/api/stock')
def get_stock():
    db = get_db()
    stock_data = list(db.products.find({}, {'_id': 0}))
    return jsonify(stock_data)

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', '')
    db = get_db()
    results = []
    if db:
        # Simple regex search
        products = list(db.products.find({"product_name": {"$regex": query, "$options": "i"}}))
        for p in products:
            results.append({
                "id": str(p.get('_id')),
                "name": p.get('product_name'),
                "price": p.get('product_price'),
                "image": p.get('image', '/static/images/placeholder.svg'),
                "description": p.get('description', ''),
                "location": p.get("location", "") 
            })
    return jsonify(results)

@app.route('/recommended', methods=['GET'])
def recommended():
    db = get_db()
    if db is not None:
        pipeline = [{"$sample": {"size": 5}}]
        products_db = list(db.products.aggregate(pipeline))
        result = []
        for p in products_db:
             result.append({
                "name": p.get("product_name"),
                "price": p.get("product_price"),
                "image": p.get("image", "/static/images/placeholder.svg")
            })
        return jsonify(result)
    return jsonify([])

# --- Vercel requires app to be exported as 'app' or 'application' ---

if __name__ == '__main__':
    app.run(debug=True)
