let html5QrCodeInstance = null; // Deklarasikan di scope global
let isScanning = false; // Tambahkan flag untuk status scanning

// Consolidated product data and simplified helpers
const PRODUCTS = [
  { id: 1, nama: 'Buku Tulis', harga: 5000 },{ id: 2, nama: 'Pulpen', harga: 3500 },{ id: 3, nama: 'Penggaris', harga: 3000 },{ id: 4, nama: 'Pensil', harga: 2500 },{ id: 5, nama: 'Penghapus', harga: 2000 },{ id: 6, nama: 'Spidol', harga: 6000 },{ id: 7, nama: 'Map', harga: 2500 },{ id: 8, nama: 'Kertas HVS', harga: 1000 },{ id: 9, nama: 'Amplop', harga: 1500 },{ id: 10, nama: 'Stabilo', harga: 7000 },{ id: 11, nama: 'Tip-Ex', harga: 4000 },{ id: 12, nama: 'Rautan', harga: 2000 },{ id: 13, nama: 'Binder', harga: 12000 },{ id: 14, nama: 'Sticky Note', harga: 3500 },{ id: 15, nama: 'Penggaris Besi', harga: 5000 }
];

const findProductById = id => PRODUCTS.find(p => String(p.id) === String(id));
const findProductByName = name => PRODUCTS.find(p => p.nama.toLowerCase() === String(name).trim().toLowerCase());

// Build a global PRODUCT_MAP for other modules (e.g., barcode.js) to reuse
// key: product name (lowercased) -> id, and include sample barcode numbers
window.PRODUCT_MAP = window.PRODUCT_MAP || {};
PRODUCTS.forEach(p => {
  window.PRODUCT_MAP[p.nama.toLowerCase()] = p.id;
  window.PRODUCT_MAP[String(p.id)] = p.id;
});

// let html5QrCodeInstance = null; // Ini sudah dideklarasikan di atas, jangan duplikasi
// let isScanning = false; // Ini sudah dideklarasikan di atas, jangan duplikasi

function scanQRFromCamera(){
  const holder = document.getElementById('barcode-reader');
  if(!holder) return;

  if (isScanning) {
    console.log("Kamera sudah aktif atau sedang dalam proses scan.");
    return; // Hindari memulai scan berulang kali
  }

  holder.innerHTML='';

  // Inisialisasi instance hanya sekali jika belum ada
  if (!html5QrCodeInstance) {
    html5QrCodeInstance = new Html5Qrcode('barcode-reader');
  }

  isScanning = true;
  document.getElementById('barcode-result').innerText = 'Memulai kamera... Mohon tunggu.'; // Pesan loading

  html5QrCodeInstance.start(
    {facingMode:'environment'},
    {fps:10,qrbox:{width:220,height:220}},
    qr=>{
      document.getElementById('barcode-result').innerText='QR: '+qr;
      autoIsiProdukByQR(qr);
      // Hentikan scan setelah terdeteksi
      html5QrCodeInstance.stop().catch(e => console.warn('Error stopping QR scanner:', e));
      isScanning = false;
    },
    ()=>{} // onScanError, bisa ditambahkan logging jika perlu
  ).catch(e => {
    holder.innerText='Tidak bisa akses kamera: ' + e;
    console.error('Gagal memulai scanner QR:', e);
    isScanning = false;
  });
}

        // Tambahkan fungsi untuk menghentikan kamera secara eksplisit jika diperlukan
        function stopQRScanner() {
          if (html5QrCodeInstance && isScanning) {
            html5QrCodeInstance.stop().catch(e => console.warn('Error stopping QR scanner:', e));
            isScanning = false;
            document.getElementById('barcode-result').innerText = 'Kamera dihentikan.';
          }
        }
        
function scanQRFromImage(e){
  const input = e?.target;
  const files = input?.files;
  if(!files || files.length === 0) return;
  let resultText = '';
  let promises = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    promises.push(new Promise(async (resolve) => {
      let localQrCodeInstance = new Html5Qrcode('barcode-reader');
      try {
        const qr = await localQrCodeInstance.scanFile(f,true);
        resultText += `QR: ${qr}\n`;
        const success = autoIsiProdukByQR(qr);
        if (!success) {
          resultText += 'QR tidak cocok dengan produk manapun!\n';
        }
      } catch {
        resultText += 'QR tidak ditemukan!\n';
      }
      resolve();
    }));
  }
  Promise.all(promises).then(() => {
    document.getElementById('barcode-result').innerText = resultText.trim();
    input.value = '';
  });
}

function autoIsiProdukByQR(qr){
  // Cocokkan nama produk (tanpa spasi, case-insensitive) atau ID produk
  const cleanQR = String(qr).replace(/\s+/g, '').toLowerCase();
  let p = PRODUCTS.find(prod => prod.nama.replace(/\s+/g, '').toLowerCase() === cleanQR);
  if (!p) {
    // Coba cocokkan dengan ID produk
    p = PRODUCTS.find(prod => String(prod.id) === cleanQR);
  }
  if(p){
    document.getElementById('produk-select').value = p.id;
    document.getElementById('jumlah').value = 1;
    document.getElementById('barcode-result').innerText += '\nProduk otomatis terisi!';
    tambahKeranjang(); // tambah 1 produk setiap scan
    // Cari index produk di keranjang, highlight baris yang benar
    setTimeout(() => {
      const idx = keranjang.findIndex(it => String(it.id) === String(p.id));
      if (idx !== -1) highlightRow(idx);
    }, 100);
    return true;
  }
  return false;
}

// Keranjang & nota (sederhana)
let keranjang = [];

// highlight a row briefly when item is added/updated
function highlightRow(index){ try{ const tbody=document.querySelector('#keranjang-table tbody'); if(!tbody) return; const tr=tbody.children[index]; if(!tr) return; tr.classList.add('row-new'); tr.addEventListener('animationend', function _rm(){ tr.classList.remove('row-new'); tr.removeEventListener('animationend', _rm); }); // fallback removal
  setTimeout(()=>{ if(tr.classList) tr.classList.remove('row-new') }, 1200);
}catch(e){ /* ignore */ } }

// modify tambahKeranjang to mark which row to highlight
function tambahKeranjang(){ const sel=document.getElementById('produk-select'); const jumlah=parseInt(document.getElementById('jumlah').value)||0; const msg=document.getElementById('transaksi-message'); if(!sel.value || jumlah<=0){ msg.innerText='Pilih produk dan masukkan jumlah!'; msg.style.color='red'; return } const id=sel.value; const nama=sel.options[sel.selectedIndex].text; const idx=keranjang.findIndex(it=>it.id===id); let highlightIndex; if(idx!==-1){ keranjang[idx].jumlah+=jumlah; highlightIndex = idx; } else { keranjang.push({id,nama,jumlah}); highlightIndex = keranjang.length-1; } msg.innerText=`Ditambahkan ke keranjang: ${nama} x ${jumlah}`; msg.style.color='green'; renderKeranjang(); // add visual highlight to the affected row
highlightRow(highlightIndex);
}

function hapusItemKeranjang(idx){ keranjang.splice(idx,1); renderKeranjang(); }

function renderKeranjang(){
  const tbody=document.querySelector('#keranjang-table tbody'); if(!tbody) return;
  tbody.innerHTML='';
  const theadRow=document.querySelector('#keranjang-table thead tr');
  if(theadRow) theadRow.innerHTML = '<th>Produk</th><th>Jumlah</th><th>Harga (Rp)</th><th>Subtotal (Rp)</th><th>Aksi</th>';
  let total = 0;
  keranjang.forEach((it,idx)=>{
    const p = findProductById(it.id);
    const harga = typeof p?.harga === 'number' && !isNaN(p.harga) ? p.harga : 0;
    const jumlah = typeof it.jumlah === 'number' && !isNaN(it.jumlah) ? it.jumlah : 0;
    const subtotal = harga * jumlah;
    total += subtotal;
    const hargaStr = 'Rp' + harga.toLocaleString('id-ID');
    const subtotalStr = 'Rp' + subtotal.toLocaleString('id-ID');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${it.nama}</td>
      <td>${jumlah}</td>
      <td>${hargaStr}</td>
      <td>${subtotalStr}</td>
      <td><button class="action-btn" onclick="hapusItemKeranjang(${idx})">Hapus</button></td>
    `;
    tbody.appendChild(tr);
  });
  // Add total row (selalu tampilkan total)
  const trTotal = document.createElement('tr');
  trTotal.innerHTML = `
    <td style="background:#e3f2fd;"></td>
    <td style="background:#e3f2fd;"></td>
    <td style="text-align:right;font-weight:bold;color:#1565c0;background:#e3f2fd;">Harga total</td>
    <td style="font-weight:bold;color:#1565c0;background:#e3f2fd;">Rp${total.toLocaleString('id-ID')}</td>
    <td style="background:#e3f2fd;"></td>
  `;
  tbody.appendChild(trTotal);
  // Update info kembalian jika ada input
  updateKembalian(total);
  // Remove summary below table if exists
  const summaryElem = document.getElementById('keranjang-summary');
  if (summaryElem) summaryElem.remove();
}

function prosesBayar(){
  if(keranjang.length===0){ alert('Keranjang kosong!'); return }
  // Ambil total
  let total = 0;
  keranjang.forEach(it=>{
    const p = findProductById(it.id);
    const harga = typeof p?.harga === 'number' && !isNaN(p.harga) ? p.harga : 0;
    const jumlah = typeof it.jumlah === 'number' && !isNaN(it.jumlah) ? it.jumlah : 0;
    total += harga * jumlah;
  });
  const uangInput = document.getElementById('uang-diterima');
  const kembalianInfo = document.getElementById('kembalian-info');
  const uangDiterima = uangInput ? parseInt(uangInput.value) || 0 : 0;
  if (uangDiterima < total) {
    kembalianInfo.innerText = 'Uang kurang!';
    kembalianInfo.style.color = 'red';
    uangInput && uangInput.focus();
    return;
  }
  const kembalian = uangDiterima - total;
  kembalianInfo.innerText = 'Kembalian: Rp' + kembalian.toLocaleString('id-ID');
  kembalianInfo.style.color = '#1565c0';
  tampilkanNotaKeranjang(keranjang, uangDiterima, kembalian);
  keranjang=[];
  renderKeranjang();
  document.getElementById('transaksi-message').innerText='';
  if(uangInput) uangInput.value = '';
}

function updateKembalian(total) {
  const uangInput = document.getElementById('uang-diterima');
  const kembalianInfo = document.getElementById('kembalian-info');
  if (!uangInput || !kembalianInfo) return;
  const uangDiterima = parseInt(uangInput.value) || 0;
  if (uangDiterima === 0) {
    kembalianInfo.innerText = '';
    return;
  }
  if (uangDiterima < total) {
    kembalianInfo.innerText = 'Uang kurang!';
    kembalianInfo.style.color = 'red';
  } else {
    const kembalian = uangDiterima - total;
    kembalianInfo.innerText = 'Kembalian: Rp' + kembalian.toLocaleString('id-ID');
    kembalianInfo.style.color = '#1565c0';
  }
}

// Event listener untuk update kembalian realtime
document.addEventListener('DOMContentLoaded', function() {
  const uangInput = document.getElementById('uang-diterima');
  if (uangInput) {
    uangInput.addEventListener('input', function() {
      // Hitung total terbaru
      let total = 0;
      keranjang.forEach(it=>{
        const p = findProductById(it.id);
        const harga = typeof p?.harga === 'number' && !isNaN(p.harga) ? p.harga : 0;
        const jumlah = typeof it.jumlah === 'number' && !isNaN(it.jumlah) ? it.jumlah : 0;
        total += harga * jumlah;
      });
      updateKembalian(total);
    });
  }
});

function tampilkanNotaKeranjang(items){
  const notaSection=document.getElementById('nota-section');
  const notaContent=document.getElementById('nota-content');
  if(!notaContent||!notaSection) return;
  let total=0;
  let html = `<strong>KASIR KOPERASI SISWA SMAN 2 PROBOLINGGO</strong><hr><table style='width:100%;border-collapse:separate;border-radius:14px;box-shadow:0 8px 32px rgba(12,35,80,0.10);font-size:1em;'><thead><tr><th style='text-align:left;background:linear-gradient(90deg,#1976d2 80%,#42a5f5 100%);color:#fff;'>Produk</th><th style='text-align:right;background:linear-gradient(90deg,#1976d2 80%,#42a5f5 100%);color:#fff;'>Jumlah</th><th style='text-align:right;background:linear-gradient(90deg,#1976d2 80%,#42a5f5 100%);color:#fff;'>Harga</th><th style='text-align:right;background:linear-gradient(90deg,#1976d2 80%,#42a5f5 100%);color:#fff;'>Subtotal</th></tr></thead><tbody>`;
  items.forEach(it=>{
    const p=findProductById(it.id);
    const harga=p? p.harga:0;
    const subtotal=harga*it.jumlah;
    total+=subtotal;
    html+=`<tr><td>${it.nama}</td><td style='text-align:right'>${it.jumlah}</td><td style='text-align:right'>Rp${harga.toLocaleString('id-ID')}</td><td style='text-align:right'>Rp${subtotal.toLocaleString('id-ID')}</td></tr>`;
  });
  if(items.length>1 && total>0){
    html+=`<tr><td style='background:#e3f2fd;'></td><td style='background:#e3f2fd;'></td><td style='text-align:right;font-weight:bold;color:#1565c0;background:#e3f2fd;'>Total</td><td style='font-weight:bold;color:#1565c0;background:#e3f2fd;'>Rp${total.toLocaleString('id-ID')}</td></tr>`;
  }
  html+='</tbody></table><hr>';
  // Tampilkan uang diterima dan kembalian jika ada
  if (arguments.length >= 3) {
    const uangDiterima = arguments[1];
    const kembalian = arguments[2];
    html+=`<div class='total'>Uang Diterima: Rp${uangDiterima.toLocaleString('id-ID')}</div>`;
    html+=`<div class='total'>Kembalian: Rp${kembalian.toLocaleString('id-ID')}</div>`;
  }
  html+=`<div class='total'>Total Bayar: Rp${total.toLocaleString('id-ID')}</div><div class='tanggal'>${new Date().toLocaleString()}</div><div class='thanks'>Terima kasih telah berbelanja!</div>`;
  notaContent.innerHTML=html;
  notaSection.style.display='block';
}

function tampilkanNota(produk,jumlah){ const notaSection=document.getElementById('nota-section'); const notaContent=document.getElementById('nota-content'); if(!notaContent||!notaSection) return; notaContent.innerHTML=`<strong>KASIR KOPERASI SISWA SMAN 2 PROBOLINGGO</strong><hr><b>Produk:</b> ${produk}<br><b>Jumlah:</b> ${jumlah}<br><b>Waktu:</b> ${new Date().toLocaleString()}<hr><i>Terima kasih telah berbelanja!</i>`; notaSection.style.display='block'; }

function printNota(){ const notaContent=document.getElementById('nota-content').innerHTML; const w=window.open('','', 'width=400,height=600'); w.document.write(`<html><head><title>Nota Pembayaran</title></head><body>${notaContent}</body></html>`); w.document.close(); w.print(); }

function closeNota(){ const s=document.getElementById('nota-section'); if(s) s.style.display='none'; }

function logoutKasir(){
  const d=document.getElementById('dashboard');
  const l=document.getElementById('login-section');
  if(d) d.style.display='none';
  if(l) l.style.display='block';
  const u=document.getElementById('username');
  const p=document.getElementById('password');
  if(u) u.value='';
  if(p) p.value='';
  stopQRScanner(); // Panggil fungsi stop saat logout
}

function isiProdukSelect(){ const sel=document.getElementById('produk-select'); if(!sel) return; sel.innerHTML=''; PRODUCTS.forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.text=p.nama; sel.appendChild(o); }); }

function inputTransaksi(){ tambahKeranjang(); }

// Camera helpers for other QR widget (camera select)
let html5QrCode=null, cameras=[];
async function initCameras(){ try{ const devices=await Html5Qrcode.getCameras(); cameras=devices; const sel=document.getElementById('camera-select'); if(!sel) return; sel.innerHTML=''; if(devices.length===0) sel.innerHTML='<option>Tidak ada kamera terdeteksi</option>'; else devices.forEach(cam=>{ const o=document.createElement('option'); o.value=cam.id; o.text=cam.label||cam.id; sel.appendChild(o); }); }catch(e){ alert('Gagal mendeteksi kamera: '+e); } }

async function startScan(){ await initCameras(); const select=document.getElementById('camera-select'); const deviceId= select? select.value || (cameras[0]?cameras[0].id:null) : (cameras[0]?cameras[0].id:null); if(!deviceId){ alert('Tidak ada kamera tersedia.'); return } if(html5QrCode){ await html5QrCode.stop().catch(()=>{}); await html5QrCode.clear().catch(()=>{}); } html5QrCode=new Html5Qrcode('qr-reader'); html5QrCode.start({deviceId:{exact:deviceId}},{fps:10,qrbox:{width:250,height:250}}, txt=>{ document.getElementById('result').innerText='QR: '+txt; html5QrCode.stop().catch(()=>{}); }).catch(err=>alert('Error memulai kamera: '+err)); }

function loginKasir(){ const username=document.getElementById('username')?.value.trim(); const password=document.getElementById('password')?.value.trim(); const msg=document.getElementById('login-message'); if(username==='kasir' && password==='1234'){ document.getElementById('login-section').style.display='none'; document.getElementById('dashboard').style.display='block'; if(msg) msg.innerText=''; isiProdukSelect(); } else { if(msg) { msg.innerText='Username atau password salah!'; msg.style.color='red'; } } }

