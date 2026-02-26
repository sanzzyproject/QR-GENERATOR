// =========================================
// LOGIC LANDING PAGE & DOCUMENTATION
// =========================================
const landingPage = document.getElementById('landingPage');
const mainApp = document.getElementById('mainApp');
const footerCredits = document.getElementById('footerCredits');
const startAppBtn = document.getElementById('startAppBtn');
const exploreBtn = document.getElementById('exploreBtn');

// Elemen Dokumentasi
const docModal = document.getElementById('docModal');
const closeDocBtn = document.getElementById('closeDocBtn');
const openDocFooter = document.getElementById('openDocFooter');
const openDocFooter2 = document.getElementById('openDocFooter2');

// Fungsi Transisi dari Landing Page ke Main App
function enterApplication() {
    landingPage.classList.add('fade-out');
    setTimeout(() => {
        landingPage.style.display = 'none';
        mainApp.classList.remove('hidden-start');
        footerCredits.classList.remove('hidden-start');
    }, 600);
}

// Buka Dokumentasi (Dari Landing atau dari Footer)
function openDocumentation() {
    docModal.classList.add('show');
}

// Tutup Dokumentasi
function closeDocumentation() {
    docModal.classList.remove('show');
}

// Event Listener Utama Aplikasi
startAppBtn.addEventListener('click', enterApplication);
exploreBtn.addEventListener('click', openDocumentation); // Tombol Pelajari Fitur di Landing
closeDocBtn.addEventListener('click', closeDocumentation);
openDocFooter.addEventListener('click', (e) => { e.preventDefault(); openDocumentation(); });
openDocFooter2.addEventListener('click', (e) => { e.preventDefault(); openDocumentation(); });

// Tutup modal jika user mengklik area luar box modal
docModal.addEventListener('click', (e) => {
    if(e.target === docModal) { closeDocumentation(); }
});


// =========================================
// SISA KODE APLIKASI UTAMA (TIDAK ADA YANG DIHAPUS)
// =========================================
// Konfigurasi Awal Library qr-code-styling
const qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    data: "https://example.com",
    margin: 5,
    qrOptions: { errorCorrectionLevel: 'H' },
    imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 10,
        crossOrigin: 'anonymous'
    },
    dotsOptions: { type: "rounded", color: "#000000" },
    backgroundOptions: { color: "#ffffff" },
    cornersSquareOptions: { type: "extra-rounded", color: "#000000" },
    cornersDotOptions: { type: "dot", color: "#000000" }
});

// Render QR awal ke DOM
qrCode.append(document.getElementById("qrPreview"));

// Element Selectors
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
let currentLogoUrl = null;

// Handle Logo Upload Click
uploadBox.addEventListener("click", (e) => {
    if (e.target.id !== "removeLogoBtn") {
        logoUpload.click();
    }
});

// Fungsi untuk membuat gambar menjadi bundar menggunakan Canvas
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

        // Gambar image ke dalam path bundar
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

        callback(canvas.toDataURL('image/png'));
    };
    img.src = imageSrc;
}

// Baca file logo dengan FileReader
logoUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const rawImageBase64 = event.target.result;
            
            cropToCircle(rawImageBase64, (circularImageBase64) => {
                currentLogoUrl = circularImageBase64;
                
                uploadText.textContent = "Logo Terpilih: " + file.name;
                logoPreview.src = currentLogoUrl;
                logoPreview.classList.remove("hidden");
                removeLogoBtn.classList.remove("hidden");
                
                generateQR();
            });
        };
        reader.readAsDataURL(file);
    }
});

// Hapus Logo
removeLogoBtn.addEventListener("click", (e) => {
    e.stopPropagation(); 
    currentLogoUrl = null;
    logoUpload.value = "";
    uploadText.textContent = "Klik atau Drag logo ke sini";
    logoPreview.src = "";
    logoPreview.classList.add("hidden");
    removeLogoBtn.classList.add("hidden");
    generateQR();
});

// Fungsi Utama: Generate/Update QR Realtime
function generateQR() {
    loadingOverlay.classList.remove("hidden");
    
    setTimeout(() => {
        qrCode.update({
            data: urlInput.value || "https://example.com",
            image: currentLogoUrl,
            dotsOptions: {
                type: dotsType.value,
                color: qrColor.value
            },
            backgroundOptions: {
                color: bgColor.value
            },
            cornersSquareOptions: {
                type: cornerType.value,
                color: qrColor.value
            },
            cornersDotOptions: {
                type: "dot",
                color: qrColor.value
            }
        });
        loadingOverlay.classList.add("hidden");
    }, 300);
}

// Event Listeners Inputs
generateBtn.addEventListener("click", generateQR);
[dotsType, cornerType].forEach(el => {
    el.addEventListener("change", generateQR);
});

// Color Picker Modernization Logic
qrColor.addEventListener("input", (e) => {
    qrColorPreview.style.backgroundColor = e.target.value;
    qrColorValue.textContent = e.target.value;
    generateQR();
});
bgColor.addEventListener("input", (e) => {
    bgColorPreview.style.backgroundColor = e.target.value;
    bgColorValue.textContent = e.target.value;
    generateQR();
});

// Fungsi Copy URL
document.getElementById("copyUrlBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(urlInput.value).then(() => {
        showToast("URL berhasil disalin!");
    });
});

// Fungsi Download PNG & SVG
document.getElementById("downloadPngBtn").addEventListener("click", () => {
    qrCode.download({ name: "QR_Premium", extension: "png" });
    showToast("Mendownload PNG...");
});

document.getElementById("downloadSvgBtn").addEventListener("click", () => {
    qrCode.download({ name: "QR_Premium", extension: "svg" });
    showToast("Mendownload SVG...");
});

// Fungsi Notifikasi (Toast)
function showToast(message) {
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.classList.add("hidden"), 300);
    }, 3000);
}
