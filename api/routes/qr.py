from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer, SquareModuleDrawer, CircleModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from PIL import Image, ImageDraw
import io
from typing import Optional

router = APIRouter()

# Fungsi mengubah warna Hex ke RGB
def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

@router.post("/generate")
async def generate_qr(
    url: str = Form(...),
    qr_color: str = Form("#000000"),
    bg_color: str = Form("#ffffff"),
    shape: str = Form("square"),
    corner: str = Form("square"),
    logo: Optional[UploadFile] = File(None)
):
    try:
        # 1. Setup dasar QR Code dengan Error Correction Tertinggi (H = 30%)
        qr = qrcode.QRCode(
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=12,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # 2. Setup Gaya Titik (Dots) dan Sudut (Corner)
        # Python memukul rata gaya dots dan corner pada library bawaan, 
        # maka kita atur kombinasinya agar se-akurat mungkin dengan UI Frontend.
        if shape == "dots":
            drawer = CircleModuleDrawer()
        elif shape == "rounded" or corner == "extra-rounded":
            drawer = RoundedModuleDrawer()
        else:
            drawer = SquareModuleDrawer()

        fg_rgb = hex_to_rgb(qr_color)
        bg_rgb = hex_to_rgb(bg_color)

        # 3. Generate base gambar QR
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=drawer,
            color_mask=SolidFillColorMask(front_color=fg_rgb, back_color=bg_rgb)
        ).convert("RGBA")

        # 4. === LOGIC PENTING: MASKING & PLACING LOGO ===
        # Proses ini memastikan logo tidak merusak data agar bisa discan!
        if logo:
            logo_content = await logo.read()
            logo_img = Image.open(io.BytesIO(logo_content)).convert("RGBA")
            
            qr_w, qr_h = img.size
            
            # Batasi ukuran logo maksimal 22% agar sangat aman saat discan HP
            max_logo_size = int(qr_w * 0.22) 
            logo_img.thumbnail((max_logo_size, max_logo_size), Image.Resampling.LANCZOS)
            
            logo_w, logo_h = logo_img.size
            pos_x = (qr_w - logo_w) // 2
            pos_y = (qr_h - logo_h) // 2
            
            # MASKING: Buat lubang kosong (sesuai warna background) di belakang logo
            # Ini simulasi efek "hideBackgroundDots" di backend.
            draw = ImageDraw.Draw(img)
            padding = 12 # Ruang bernafas di sekitar logo
            mask_box = [pos_x - padding, pos_y - padding, pos_x + logo_w + padding, pos_y + logo_h + padding]
            
            # Gambar dasar polos di tengah
            draw.ellipse(mask_box, fill=bg_rgb)

            # Barulah tempel (paste) logo yang sudah bulat di atas ruang kosong tersebut
            img.paste(logo_img, (pos_x, pos_y), logo_img)

        # 5. Return hasilnya ke Frontend sebagai file PNG
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        return Response(content=img_byte_arr.getvalue(), media_type="image/png")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
