from fastapi import FastAPI
from pydantic import BaseModel

# API ka naam set kar rahe hain
app = FastAPI(title="Meri Push Notification API")

# Notification data ka structure (Title, Message, aur User ka Token)
class NotificationModel(BaseModel):
    title: str
    message: str
    device_token: str 

# Check karne ke liye basic Home Route
@app.get("/")
def home():
    return {"message": "Bhai, API ekdum sahi chal rahi hai!"}

# Notification bhejne ka main endpoint
@app.post("/send-notification/")
async def send_push(data: NotificationModel):
    # Yahan par aap aage chal kar Firebase (FCM) ya OneSignal ka code add karenge
    # Abhi ke liye hum ise print kara rahe hain
    print(f"Token [{data.device_token}] par message ja raha hai...")
    print(f"Title: {data.title} | Message: {data.message}")

    return {
        "status": "success",
        "message": "Notification successfully process ho gaya hai!",
        "sent_data": data
    }
