// Ringkas, aman, dan fungsional: barcode scanner helper (Quagga)
const $ = id => document.getElementById(id);
const READERS = ['code_128_reader','ean_reader','ean_8_reader','code_39_reader','upc_reader','upc_e_reader'];

function setOut(txt){ const o = $('barcode-result'); if(o) o.innerText = txt; }
function appendOut(txt){ const o = $('barcode-result'); if(o) o.innerText = (o.innerText? o.innerText + '\n' : '') + txt; }

function handleBarcode(code){ setOut('Barcode: ' + code); if(!autoIsiProdukByBarcode(code)) appendOut('Barcode tidak ditemukan di produk!'); }

function startScanBarcode(){
  const area = $('barcode-reader');
  if(!area) return console.warn('startScanBarcode: #barcode-reader tidak ditemukan');
  if(typeof Quagga === 'undefined') return area.innerText = 'QuaggaJS tidak ditemukan';
  area.innerHTML = '';
  let seen = false;
  Quagga.init({
    inputStream: { name: 'Live', type: 'LiveStream', target: area, constraints: { facingMode: 'environment' } },
    decoder: { readers: READERS }
  }, function(err){
    if(err) return area.innerText = 'ERROR: ' + err;
    try{ Quagga.start(); } catch(e){ area.innerText = 'Gagal memulai scanner: ' + e; }
  });

  Quagga.onDetected(function(res){
    if(seen) return; if(!res || !res.codeResult) return;
    seen = true; handleBarcode(res.codeResult.code);
    try{ Quagga.stop(); } catch(e){ console.warn('Quagga.stop error', e); }
  });
}

function scanBarcodeFromImage(evt){
  const f = evt?.target?.files?.[0]; if(!f) return;
  if(typeof Quagga === 'undefined') return setOut('QuaggaJS tidak ditemukan');
  const reader = new FileReader();
  reader.onload = function(e){
    Quagga.decodeSingle({ src: e.target.result, numOfWorkers: 0, decoder: { readers: READERS } }, function(r){
      if(r && r.codeResult) handleBarcode(r.codeResult.code); else setOut('Barcode tidak ditemukan!');
    });
  };
  reader.readAsDataURL(f);
}

function scanBarcodeFromImageSelect(){ const sel = $('barcode-image-select'); if(!sel) return; const v = sel.value; if(!v) return; handleBarcode(v.replace(/\.[^.]+$/, '')); }

// LOCAL fallback product map (used only if window.PRODUCT_MAP isn't available)
const LOCAL_PRODUCT_MAP = {
  'buku_tulis':1,'pulpen':2,'penggaris':3,'pensil':4,'penghapus':5,'spidol':6,'map':7,'kertas_hvs':8,'amplop':9,'stabilo':10,'tipex':11,'rautan':12,'binder':13,'sticky_note':14,'penggaris_besi':15,
  '9781234567890':1,'8998765432101':2,'8801122334455':3
};

function autoIsiProdukByBarcode(barcode){
  if(!barcode) return false;
  const sel = $('produk-select'); if(!sel) return false;
  const key = barcode.replace(/\.[^.]+$/, '');
  const map = (typeof window !== 'undefined' && window.PRODUCT_MAP) ? window.PRODUCT_MAP : LOCAL_PRODUCT_MAP;
  const id = map[key.toLowerCase()] || map[key];
  if(id){ sel.value = id; appendOut('Produk otomatis terisi!'); return true; }
  return false;
}
