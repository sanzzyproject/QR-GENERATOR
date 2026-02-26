from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import qr

app = FastAPI(title="QR Premium API", docs_url="/api/docs")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Router
app.include_router(qr.router, prefix="/api")

@app.get("/api")
def read_root():
    return {"status": "success", "message": "QR Generator API is running by SANN404 FORUM"}
