import asyncio
import os
from telegram import Bot
from dotenv import load_dotenv

async def test_connection():
    load_dotenv()
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("Error: No TELEGRAM_BOT_TOKEN found in .env")
        return

    print(f"Testing connection with token: {token[:5]}...{token[-5:]}")
    bot = Bot(token=token)
    
    try:
        # Try a simple API call
        me = await bot.get_me()
        print(f"Success! Connected as: @{me.username} ({me.id})")
    except Exception as e:
        print(f"Connection Failed: {e}")
        print("\nPossible reasons:")
        print("1. Your internet connection is blocked (try a VPN or Proxy).")
        print("2. The Bot Token is invalid.")
        print("3. Your firewall is blocking outgoing requests to api.telegram.org.")

if __name__ == "__main__":
    asyncio.run(test_connection())