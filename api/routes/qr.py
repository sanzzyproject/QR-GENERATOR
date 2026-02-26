from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer, SquareModuleDrawer, CircleModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
import io
from PIL import Image
import uuid
from typing import Optional

router = APIRouter()

# Mock Database untuk shorten URL (berjalan di memory untuk serverless)
url_database = {}

@router.post("/generate")
async def generate_qr(
    url: str = Form(...),
    qr_color: str = Form("#000000"),
    bg_color: str = Form("#ffffff"),
    shape: str = Form("square"),
    logo: Optional[UploadFile] = File(None)
):
    try:
        # Error correction tinggi (H) agar logo max 30% tidak merusak scan
        qr = qrcode.QRCode(
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=12,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Mapping bentuk QR
        drawers = {
            "square": SquareModuleDrawer(),
            "rounded": RoundedModuleDrawer(),
            "dots": CircleModuleDrawer()
        }
        drawer = drawers.get(shape, SquareModuleDrawer())

        # Convert Hex to RGB
        def hex_to_rgb(hex_color):
            hex_color = hex_color.lstrip('#')
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        
        fg_rgb = hex_to_rgb(qr_color)
        bg_rgb = hex_to_rgb(bg_color)

        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=drawer,
            color_mask=SolidFillColorMask(front_color=fg_rgb, back_color=bg_rgb)
        )

        # Proses embed logo jika ada
        if logo:
            logo_content = await logo.read()
            logo_img = Image.open(io.BytesIO(logo_content)).convert("RGBA")
            
            # Hitung ukuran maksimal logo agar tidak merusak keterbacaan (max 25%)
            qr_w, qr_h = img.size
            max_logo_size = int(qr_w / 4)
            logo_img.thumbnail((max_logo_size, max_logo_size), Image.Resampling.LANCZOS)
            
            # Hitung posisi center
            box = (
                (qr_w - logo_img.size[0]) // 2,
                (qr_h - logo_img.size[1]) // 2
            )
            img.paste(logo_img, box, logo_img)

        # Return sebagai PNG ByteArray
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        return Response(content=img_byte_arr.getvalue(), media_type="image/png")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/shorten")
async def shorten_url(url: str = Form(...)):
    # Generate short UUID 8-character
    short_id = str(uuid.uuid4())[:8]
    short_url = f"https://sann404.vercel.app/s/{short_id}"
    url_database[short_id] = url
    return {"status": "success", "original_url": url, "short_url": short_url, "id": short_id}
