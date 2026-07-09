from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Meri Push Notification API")

# Browser se request aane par error na aaye, iske liye CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ab sirf Title aur Message chahiye, Token nahi
class BroadcastModel(BaseModel):
    title: str
    message: str

@app.get("/")
def home():
    return {"message": "Bhai, API ekdum sahi chal rahi hai!"}

@app.post("/send-notification/")
async def send_push_to_all(data: BroadcastModel):
    # Asli app mein yahan par Firebase/OneSignal ka 'Topic' ya 'Segment' wala code aayega
    # Jo sabhi users ko ek sath bhejega
    print("Sabhi users ko notification ja raha hai...")
    print(f"Title: {data.title} | Message: {data.message}")

    return {
        "status": "success",
        "message": "Sabhi users ko notification successfully process ho gaya hai! 🎉",
        "sent_data": data
    }
