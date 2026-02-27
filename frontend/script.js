// =========================================
// LOGIC LANDING PAGE & DOCUMENTATION MODAL
// =========================================
const landingPage = document.getElementById('landingPage');
const mainApp = document.getElementById('mainApp');
const footerCredits = document.getElementById('footerCredits');
const startAppBtn = document.getElementById('startAppBtn');
const exploreBtn = document.getElementById('exploreBtn');

const docModal = document.getElementById('docModal');
const closeDocBtn = document.getElementById('closeDocBtn');
const openDocFooter = document.getElementById('openDocFooter');
const openDocFooter2 = document.getElementById('openDocFooter2');

function enterApplication() {
    landingPage.classList.add('fade-out');
    setTimeout(() => {
        landingPage.style.display = 'none';
        mainApp.classList.remove('hidden-start');
        footerCredits.classList.remove('hidden-start');
        // Saat masuk aplikasi pertama kali, langsung request QR ke backend
        generateQRFromServer();
    }, 600);
}

function openDocumentation() {
    docModal.style.display = 'flex';
    setTimeout(() => { docModal.classList.add('show'); }, 10);
    document.body.style.overflow = 'hidden';
}

function closeDocumentation() {
    docModal.classList.remove('show');
    setTimeout(() => { docModal.style.display = 'none'; }, 300);
    document.body.style.overflow = 'auto';
}

// Event Listeners Navigasi
startAppBtn.addEventListener('click', enterApplication);
exploreBtn.addEventListener('click', openDocumentation);
closeDocBtn.addEventListener('click', closeDocumentation);
openDocFooter.addEventListener('click', (e) => { e.preventDefault(); openDocumentation(); });
openDocFooter2.addEventListener('click', (e) => { e.preventDefault(); openDocumentation(); });

docModal.addEventListener('click', (e) => {
    if(e.target === docModal) { closeDocumentation(); }
});


// =========================================
// LOGIC UTAMA: KONEKSI KE BACKEND FASTAPI
// =========================================

const urlInput = document.getElementById("urlInput");
const qrColor = document.getElementById("qrColor");
const qrColorPreview = document.getElementById("qrColorPreview");
const qrColorValue = document.getElementById("qrColorValue");
const bgColor = document.getElementById("bgColor");
const bgColorPreview = document.getElementById("bgColorPreview");
const bgColorValue = document.getElementById("bgColorValue");
const dotsType = document.getElementById("dotsType");
const cornerType = document.getElementById("cornerType");
const uploadBox = document.getElementById("uploadBox");
const logoUpload = document.getElementById("logoUpload");
const logoPreview = document.getElementById("logoPreview");
const uploadText = document.getElementById("uploadText");
const removeLogoBtn = document.getElementById("removeLogoBtn");
const generateBtn = document.getElementById("generateBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const toast = document.getElementById("toast");
const qrResultImage = document.getElementById("qrResultImage");

let currentImageBlob = null; // Untuk download file
let croppedLogoBlob = null;  // Untuk dikirim ke backend server

// Buka dialog file
uploadBox.addEventListener("click", (e) => {
    if (e.target.id !== "removeLogoBtn") { logoUpload.click(); }
});

// Fungsi memotong gambar jadi bundar sempurna via Canvas (SEBELUM DIKIRIM KE BACKEND)
function cropToCircle(imageSrc, callback) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Buat path bundar
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        // Gambar image ke dalam path bundar (di tengah)
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

        // Convert canvas ke Blob untuk dikirim ke API
        canvas.toBlob((blob) => {
            // Callback mengirim data blob (untuk server) & base64 (untuk preview lokal)
            callback(blob, canvas.toDataURL('image/png'));
        }, 'image/png');
    };
    img.src = imageSrc;
}

// Proses file saat di-upload
logoUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            // Potong foto lokal jadi bundar
            cropToCircle(event.target.result, (blob, dataUrl) => {
                croppedLogoBlob = blob; // Simpan file Blob bundar untuk dikirim ke Backend API
                uploadText.textContent = "Logo Terpilih: " + file.name;
                logoPreview.src = dataUrl; // Tampilkan preview bundar di atas
                logoPreview.classList.remove("hidden");
                removeLogoBtn.classList.remove("hidden");
            });
        };
        reader.readAsDataURL(file);
    }
});

// Hapus Logo
removeLogoBtn.addEventListener("click", (e) => {
    e.stopPropagation(); 
    croppedLogoBlob = null;
    logoUpload.value = "";
    uploadText.textContent = "Klik atau Drag logo ke sini";
    logoPreview.src = "";
    logoPreview.classList.add("hidden");
    removeLogoBtn.classList.add("hidden");
});

// ==================================================
// FUNGSI INTI: REQUEST GENERATE KE SERVER FASTAPI
// ==================================================
async function generateQRFromServer() {
    loadingOverlay.classList.remove("hidden");
    qrResultImage.style.opacity = "0.5";

    // Kumpulkan semua data UI untuk dikirim ke Backend
    const formData = new FormData();
    formData.append("url", urlInput.value || "https://example.com");
    formData.append("qr_color", qrColor.value);
    formData.append("bg_color", bgColor.value);
    formData.append("shape", dotsType.value);
    formData.append("corner", cornerType.value); // Dikirim agar data gaya QR lengkap

    // Kirim Foto BUNDAR ke server (jika ada)
    if (croppedLogoBlob) {
        formData.append("logo", croppedLogoBlob, "logo.png");
    }

    try {
        // Fetch ke Vercel Serverless Function Anda
        const response = await fetch('/api/generate', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        // Ambil balasan dari Python Backend berupa File Gambar (PNG Blob)
        const blob = await response.blob();
        currentImageBlob = blob; // Simpan untuk fungsi download
        
        // Tampilkan gambar dari server ke tag <img>
        const imageUrl = URL.createObjectURL(blob);
        qrResultImage.src = imageUrl;
        qrResultImage.style.display = "block";
        
        showToast("QR Berhasil diproses Server!");

    } catch (error) {
        console.error("Gagal koneksi ke API:", error);
        showToast("Error: Backend API gagal merespon.");
    } finally {
        loadingOverlay.classList.add("hidden");
        qrResultImage.style.opacity = "1";
    }
}

// Tombol Trigger ke API
generateBtn.addEventListener("click", generateQRFromServer);

// Sinkronisasi Input Warna
qrColor.addEventListener("input", (e) => {
    qrColorPreview.style.backgroundColor = e.target.value;
    qrColorValue.textContent = e.target.value;
});
bgColor.addEventListener("input", (e) => {
    bgColorPreview.style.backgroundColor = e.target.value;
    bgColorValue.textContent = e.target.value;
});

// Fungsi Copy URL Target
document.getElementById("copyUrlBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(urlInput.value).then(() => {
        showToast("URL target berhasil disalin!");
    });
});

// Fungsi Download (Mengambil Data dari Server)
document.getElementById("downloadPngBtn").addEventListener("click", () => {
    if (!currentImageBlob) {
        showToast("Harap klik Update Preview terlebih dahulu!");
        return;
    }
    const url = URL.createObjectURL(currentImageBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "QR_Premium_SANN404.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Mendownload File Server...");
});

// Notifikasi UI Toast
function showToast(message) {
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.classList.add("hidden"), 300);
    }, 3000);
}
