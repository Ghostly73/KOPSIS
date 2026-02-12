from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime

app = Flask(__name__)
CORS(app)

# Dummy data
USERS = {'kasir': '1234'}
PRODUK = [
    {'id': 1, 'nama': 'Buku Tulis', 'harga': 5000},
    {'id': 2, 'nama': 'Pulpen', 'harga': 3000},
    {'id': 3, 'nama': 'Penggaris', 'harga': 2000}
]
RIWAYAT = []

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if username in USERS and USERS[username] == password:
        return jsonify({'success': True, 'token': 'dummy-token'})
    return jsonify({'success': False, 'message': 'Login gagal!'}), 401

@app.route('/api/produk', methods=['GET'])
def get_produk():
    token = request.headers.get('Authorization')
    if token != 'Bearer dummy-token':
        return jsonify({'message': 'Unauthorized'}), 401
    return jsonify(PRODUK)

@app.route('/api/transaksi', methods=['POST'])
def transaksi():
    token = request.headers.get('Authorization')
    if token != 'Bearer dummy-token':
        return jsonify({'message': 'Unauthorized'}), 401
    data = request.json
    produk_id = int(data.get('produk_id'))
    jumlah = int(data.get('jumlah'))
    produk = next((p for p in PRODUK if p['id'] == produk_id), None)
    if not produk:
        return jsonify({'message': 'Produk tidak ditemukan'}), 404
    total = produk['harga'] * jumlah
    RIWAYAT.append({
        'produk': produk['nama'],
        'jumlah': jumlah,
        'total': total,
        'tanggal': datetime.datetime.now().strftime('%d-%m-%Y %H:%M')
    })
    return jsonify({'message': 'Transaksi berhasil', 'total': total})

@app.route('/api/riwayat', methods=['GET'])
def riwayat():
    token = request.headers.get('Authorization')
    if token != 'Bearer dummy-token':
        return jsonify({'message': 'Unauthorized'}), 401
    return jsonify(RIWAYAT)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)