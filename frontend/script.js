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
    dotsOptions: { type: "rounded", color: "#ffffff" },
    backgroundOptions: { color: "#121212" },
    cornersSquareOptions: { type: "extra-rounded", color: "#ffffff" },
    cornersDotOptions: { type: "dot", color: "#ffffff" }
});

// Render QR awal ke DOM
qrCode.append(document.getElementById("qrPreview"));

// Element Selectors
const urlInput = document.getElementById("urlInput");
const qrColor = document.getElementById("qrColor");
const bgColor = document.getElementById("bgColor");
const dotsType = document.getElementById("dotsType");
const cornerType = document.getElementById("cornerType");
const uploadBox = document.getElementById("uploadBox");
const logoUpload = document.getElementById("logoUpload");
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

// Baca file logo dengan FileReader (Base64)
logoUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            currentLogoUrl = event.target.result;
            uploadBox.querySelector("span").textContent = "Logo Terpilih: " + file.name;
            removeLogoBtn.classList.remove("hidden");
            generateQR();
        };
        reader.readAsDataURL(file);
    }
});

// Hapus Logo
removeLogoBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    currentLogoUrl = null;
    logoUpload.value = "";
    uploadBox.querySelector("span").textContent = "Klik atau Drag logo ke sini";
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
    }, 300); // Simulasi delay untuk animasi loading modern
}

// Event Listeners Inputs -> Auto update saat ada perubahan setup
generateBtn.addEventListener("click", generateQR);
[qrColor, bgColor, dotsType, cornerType].forEach(el => {
    el.addEventListener("change", generateQR);
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
