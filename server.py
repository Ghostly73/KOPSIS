# Jalankan file ini di folder frontend untuk membuka web kasir dengan server lokal
from http.server import SimpleHTTPRequestHandler, HTTPServer
import webbrowser
import threading

PORT = 8080

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

def open_browser():
    webbrowser.open(f'http://localhost:{PORT}/index.html')

if __name__ == '__main__':
    import socket
    # Cari IP utama dengan trik UDP (tidak benar-benar membuka koneksi)
    def get_primary_ip():
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            # alamat ini tidak perlu dapat dijangkau, hanya untuk mengetahui interface keluar
            s.connect(('8.8.8.8', 80))
            return s.getsockname()[0]
        except Exception:
            return '127.0.0.1'
        finally:
            s.close()

    primary_ip = get_primary_ip()

    # Coba kumpulkan alamat lain dari getaddrinfo (filter loopback/ipv6)
    addrs = set()
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None):
            addr = info[4][0]
            # ambil hanya IPv4 bukan loopback
            if ':' not in addr and not addr.startswith('127.'):
                addrs.add(addr)
    except Exception:
        pass

    # Sertakan primary ip jika belum ada
    if primary_ip and primary_ip not in addrs and not primary_ip.startswith('127.'):
        addrs.add(primary_ip)

    threading.Timer(1.5, open_browser).start()
    with HTTPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"Serving HTTP on port {PORT} and listening on all interfaces (0.0.0.0)")
        if addrs:
            print('You can access the app from other devices on the same network using one of these addresses:')
            for a in sorted(addrs):
                print(f"  http://{a}:{PORT}/index.html")
        else:
            print(f"Access locally: http://localhost:{PORT}/index.html")
        httpd.serve_forever()
