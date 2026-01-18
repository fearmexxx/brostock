import pandas as pd
from vnstock import Listing, Quote
from database import init_db, save_symbols, save_daily_bars, get_session, Symbol, Trade
from datetime import datetime, timedelta
import time
from tqdm import tqdm
import sys

# Configuration
DAYS_BACK = 90
BATCH_SIZE = 50 # Sleep after this many requests to avoid rate limits

def reset_trades():
    """Clears all trades to fix P&L errors."""
    session = get_session()
    try:
        num = session.query(Trade).delete()
        session.commit()
        print(f"Cleared {num} trades from database.")
    except Exception as e:
        session.rollback()
        print(f"Error clearing trades: {e}")
    finally:
        session.close()

def seed_symbols():
    print("Fetching symbol list...")
    try:
        # Listing() might return different columns depending on version
        # We need to standardize
        lst = Listing()
        df = lst.all_symbols()
        
        # vnstock 0.2.x return columns like 'ticker', 'comGroupCode' etc.
        # Let's check common names
        rename_map = {}
        if 'ticker' in df.columns:
            rename_map['ticker'] = 'symbol'
        elif 'symbol' in df.columns:
            pass # already correct
            
        if 'comGroupCode' in df.columns:
            rename_map['comGroupCode'] = 'exchange'
        elif 'exchange' in df.columns:
            pass

        if 'organName' in df.columns:
            rename_map['organName'] = 'company_name'
        
        if rename_map:
            df.rename(columns=rename_map, inplace=True)
            
        # Filter for stocks only if possible, or just take all
        # Typically comGroupCode in HOSE, HNX, UPCOM
        if 'exchange' in df.columns:
            df = df[df['exchange'].isin(['HOSE', 'HNX', 'UPCOM'])]
        
        # Select only necessary columns
        cols = ['symbol', 'exchange', 'company_name']
        cols = [c for c in cols if c in df.columns]
        
        # Add default type
        df['type'] = 'STOCK'
        
        print(f"Found {len(df)} symbols.")
        save_symbols(df[cols])
        return df
    except Exception as e:
        print(f"Error fetching symbols: {e}")
        return pd.DataFrame()

def seed_history(limit=None):
    session = get_session()
    symbols = session.query(Symbol).all()
    session.close()

    print(f"Starting history seed for {len(symbols)} symbols...")
    if limit:
        print(f"Limit set to {limit} symbols.")
        symbols = symbols[:limit]

    start_date = (datetime.now() - timedelta(days=DAYS_BACK)).strftime('%Y-%m-%d')
    end_date = datetime.now().strftime('%Y-%m-%d')

    count = 0
    errors = 0
    
    pbar = tqdm(symbols)
    for sym in pbar:
        try:
            pbar.set_description(f"Processing {sym.symbol}")
            
            # Skip if updated today
            if sym.last_updated and sym.last_updated.date() == datetime.now().date():
                continue

            # Fetch history
            # Using 'vci' source as established in previous fix
            quote = Quote(symbol=sym.symbol, source='vci')
            df = quote.history(start=start_date, end=end_date, interval='1D')
            
            if df is not None and not df.empty:
                save_daily_bars(sym.symbol, df)
                count += 1
            else:
                # print(f"No data for {sym.symbol}")
                pass

            # Rate limiting / Politeness
            # time.sleep(0.1) 
            
        except Exception as e:
            errors += 1
            # print(f"Error {sym.symbol}: {e}")
            
    print(f"\nSeed complete. Processed: {count}, Errors: {errors}")

if __name__ == "__main__":
    init_db()
    
    # 0. Reset Trades (Fix P&L Error)
    # reset_trades()
    
    # 1. Seed Symbols
    seed_symbols()
    
    # 2. Seed History
    # Check command line args for limit
    limit = None
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except:
            pass
            
    seed_history(limit)
