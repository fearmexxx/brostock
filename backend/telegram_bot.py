import os
import logging
import asyncio
from datetime import datetime, time as dt_time
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler
from dotenv import load_dotenv

# Import local logic
import sys
# Add parent directory to path to import logic
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from stock_analyzer import get_stock_history_data, calculate_trend_metrics, is_trading_time
from database import get_market_cache

# Load environment variables
load_dotenv()
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
SUBSCRIBERS_FILE = "subscribers.txt"

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

def get_subscribers():
    if not os.path.exists(SUBSCRIBERS_FILE):
        return set()
    with open(SUBSCRIBERS_FILE, "r") as f:
        return set(line.strip() for line in f if line.strip())

def add_subscriber(user_id):
    subs = get_subscribers()
    if str(user_id) not in subs:
        with open(SUBSCRIBERS_FILE, "a") as f:
            f.write(f"{user_id}\n")
        return True
    return False

def remove_subscriber(user_id):
    subs = get_subscribers()
    if str(user_id) in subs:
        subs.remove(str(user_id))
        with open(SUBSCRIBERS_FILE, "w") as f:
            for s in subs:
                f.write(f"{s}\n")
        return True
    return False

def format_number(val):
    if val is None: return "N/A"
    return "{:,.0f}".format(val).replace(",", ".")

def format_index(val):
    if val is None: return "N/A"
    # Vietnamese style: 1.234,56
    s = "{:,.2f}".format(val)
    # Replace , with temp, . with , then temp with .
    return s.replace(",", "TEMP").replace(".", ",").replace("TEMP", ".")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🚀 *Welcome to BroStock Bot!* \n\n"
        "I provide real-time Vietnamese market signals and automated reports.\n\n"
        "*Commands:*\n"
        "🔹 `/price [symbol]` - Quick stock analysis\n"
        "🔹 `/top` - Market rankings (Gainers/Losers)\n"
        "🔹 `/signals` - Bullish/Bearish alerts\n"
        "🔹 `/subscribe` - Receive daily EOD reports\n"
        "🔹 `/unsubscribe` - Stop receiving reports\n"
        "🔹 `/help` - Show this message",
        parse_mode='Markdown'
    )

async def subscribe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if add_subscriber(user_id):
        await update.message.reply_text("✅ *Subscribed!* You will receive daily market reports at 4:00 PM ICT.", parse_mode='Markdown')
    else:
        await update.message.reply_text("ℹ️ You are already subscribed.")

async def unsubscribe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if remove_subscriber(user_id):
        await update.message.reply_text("👋 *Unsubscribed.* You will no longer receive daily reports.", parse_mode='Markdown')
    else:
        await update.message.reply_text("ℹ️ You are not subscribed.")

async def price_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Usage: `/price [symbol]` (e.g., `/price FPT`)", parse_mode='Markdown')
        return

    symbol = context.args[0].upper()
    await update.message.reply_text(f"🔍 Analyzing {symbol}...")

    try:
        # 1. Historical Data Analysis
        df = get_stock_history_data(symbol)
        if df.empty:
            await update.message.reply_text(f"❌ Data not found for {symbol}.")
            return

        metrics = calculate_trend_metrics(df)
        score = metrics.get('signal_score', 0)
        label = metrics.get('signal_label', 'Neutral')
        price = metrics.get('current_price_daily', 0)
        
        # 2. Intraday Flow Analysis
        from stock_analyzer import get_intraday_data, preprocess_data
        intra_df = get_intraday_data(symbol)
        buy_vol = 0
        sell_vol = 0
        net_flow = 0
        if not intra_df.empty:
            p_df = preprocess_data(intra_df)
            buy_vol = p_df[p_df['match_type'] == 'Buy']['volume'].sum()
            sell_vol = p_df[p_df['match_type'] == 'Sell']['volume'].sum()
            net_flow = (p_df[p_df['match_type'] == 'Buy']['value'].sum() - 
                        p_df[p_df['match_type'] == 'Sell']['value'].sum())

        # Emoji mapping
        emoji = "⚪"
        if score >= 7: emoji = "🚀"
        elif score >= 3: emoji = "✅"
        elif score <= -7: emoji = "💀"
        elif score <= -3: emoji = "⚠️"

        # Crossover alerts
        cross_text = ""
        if metrics.get('golden_cross'): cross_text = "🌟 *GOLDEN CROSS (EMA5 > SMA20)*\n"
        if metrics.get('death_cross'): cross_text = "💀 *DEATH CROSS (EMA5 < SMA20)*\n"

        text = (
            f"{emoji} *{symbol} - {label}*\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"💰 *Price:* {format_number(price)} VND\n"
            f"📊 *Score:* {score}/10\n"
            f"📈 *Trend:* {metrics.get('trend_strength', 0):+.2f}%\n"
            f"🔥 *RSI:* {metrics.get('rsi', 0):.2f}\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"📏 *MA Status:*\n"
            f"  • EMA 5: {format_number(metrics.get('ema_5'))}\n"
            f"  • SMA 20: {format_number(metrics.get('sma_20'))}\n"
            f"  • SMA 50: {format_number(metrics.get('sma_50'))}\n"
            f"{cross_text}"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"🌊 *Intraday Flow:*\n"
            f"  • Buy Vol: {format_number(buy_vol)}\n"
            f"  • Sell Vol: {format_number(sell_vol)}\n"
            f"  • Net Flow: {format_number(net_flow)} VND\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"🔮 *5-Day Prediction:*\n"
            f"  • Outlook: *{metrics.get('prediction_label')}*\n"
            f"  • Target: {metrics.get('prediction_5d_pct', 0):+.2f}%\n\n"
            f"_{'Buy' if score >= 5 else 'Sell' if score <= -3 else 'Hold'} recommendation based on BroStock v2.0 algorithm._"
        )
        await update.message.reply_text(text, parse_mode='Markdown')
    except Exception as e:
        import traceback
        logging.error(traceback.format_exc())
        await update.message.reply_text(f"❌ Error: {str(e)}")

async def top_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    top10, _ = get_market_cache("top10")
    if not top10:
        await update.message.reply_text("Market rankings not available. Try again later.")
        return

    gainers = top10.get('gainers', [])[:5]
    losers = top10.get('losers', [])[:5]

    text = "🔥 *Market Rankings*\n\n"
    text += "*Top Gainers:*\n"
    for s in gainers:
        text += f"🟢 {s['symbol']}: {format_number(s['price'])} ({s['pct_change']:+.2f}%)\n"
    
    text += "\n*Top Losers:*\n"
    for s in losers:
        text += f"🔴 {s['symbol']}: {format_number(s['price'])} ({s['pct_change']:+.2f}%)\n"

    await update.message.reply_text(text, parse_mode='Markdown')

async def signals_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    signals, _ = get_market_cache("signals")
    if not signals:
        await update.message.reply_text("Signals not available. Try again later.")
        return

    bullish = signals.get('bullish', [])[:10]
    bearish = signals.get('bearish', [])[:10]

    text = "🎯 *BroStock High-Conviction Signals*\n\n"
    text += "🚀 *BULLISH (Buy/Watch):*\n"
    for s in bullish:
        text += f"✅ {s['symbol']} - Score: {s['signal_score']} ({s['pct_change']:+.2f}%)\n"
    
    text += "\n💀 *BEARISH (Sell/Avoid):*\n"
    for s in bearish:
        text += f"⚠️ {s['symbol']} - Score: {s['signal_score']} ({s['pct_change']:+.2f}%)\n"

    await update.message.reply_text(text, parse_mode='Markdown')

async def daily_report(context: ContextTypes.DEFAULT_TYPE):
    indices, _ = get_market_cache("indices")
    signals, _ = get_market_cache("signals")
    
    if not indices: return

    text = "📢 *BroStock EOD Market Report*\n"
    text += f"📅 {datetime.now().strftime('%d/%m/%Y')}\n━━━━━━━━━━━━━━━━━━\n\n"
    
    for idx, data in indices.items():
        emoji = "🟢" if data['change'] >= 0 else "🔴"
        text += f"{emoji} *{idx}:* {format_index(data['value'])} ({data['pct_change']:+.2f}%)\n"
    
    text += "\n💎 *Top Bullish Pick of the Day:* \n"
    if signals and signals.get('bullish'):
        top = signals['bullish'][0]
        text += f"👉 *{top['symbol']}* (Score: {top['signal_score']})\n"

    subs = get_subscribers()
    for chat_id in subs:
        try:
            await context.bot.send_message(chat_id=chat_id, text=text, parse_mode='Markdown')
        except Exception as e:
            print(f"Failed to send report to {chat_id}: {e}")

if __name__ == '__main__':
    if not TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not found in environment.")
        sys.exit(1)

    # Increase timeout and add basic error handling for network issues
    application = (
        ApplicationBuilder()
        .token(TOKEN)
        .connect_timeout(30)
        .read_timeout(30)
        .write_timeout(30)
        .build()
    )
    
    # Handlers
    application.add_handler(CommandHandler('start', start))
    application.add_handler(CommandHandler('help', start))
    application.add_handler(CommandHandler('price', price_command))
    application.add_handler(CommandHandler('top', top_command))
    application.add_handler(CommandHandler('signals', signals_command))
    application.add_handler(CommandHandler('subscribe', subscribe))
    application.add_handler(CommandHandler('unsubscribe', unsubscribe))
    
    # JobQueue for daily reports (4 PM ICT = 9 AM UTC)
    # Note: ptb v20 uses UTC for times by default
    if application.job_queue:
        application.job_queue.run_daily(daily_report, time=dt_time(hour=9, minute=0)) 

    print("BroStock Bot is running...")
    application.run_polling()