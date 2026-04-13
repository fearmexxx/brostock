
import asyncio
import sys
import os

# Add parent directory to path
sys.path.append(os.getcwd())

from stock_analyzer import generate_intraday_chart_image

async def test():
    symbol = 'FPT'
    print(f"Testing chart generation for {symbol}...")
    buf = generate_intraday_chart_image(symbol)
    if buf:
        with open("test_chart.png", "wb") as f:
            f.write(buf.getbuffer())
        print("Chart saved to test_chart.png")
    else:
        print("Failed to generate chart.")

if __name__ == "__main__":
    asyncio.run(test())
