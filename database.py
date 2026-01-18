from sqlalchemy import create_engine, Column, String, Float, Date, Integer, DateTime, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func
import pandas as pd
from datetime import datetime
import os

# Define the database file
# Check for environment variable (Streamlit Secrets / Deployment)
DB_CONNECTION_STRING = os.environ.get('DB_CONNECTION_STRING')

if DB_CONNECTION_STRING:
    # Use the cloud database (Supabase/Postgres)
    # Ensure it starts with postgresql:// instead of postgres:// (SQLAlchemy requirement)
    if DB_CONNECTION_STRING.startswith("postgres://"):
        DB_CONNECTION_STRING = DB_CONNECTION_STRING.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DB_CONNECTION_STRING, echo=False)
    print("Using Cloud Database.")
else:
    # Fallback to local SQLite
    DB_FILE = 'sqlite:///market_data.db'
    engine = create_engine(DB_FILE, echo=False)
    print("Using Local SQLite Database.")

# Declare Base
Base = declarative_base()

# --- Models ---

class Symbol(Base):
    __tablename__ = 'symbols'
    
    symbol = Column(String, primary_key=True)
    exchange = Column(String) # HOSE, HNX, UPCOM
    type = Column(String) # STOCK, INDEX, etc.
    company_name = Column(String)
    last_updated = Column(DateTime, default=None)
    
    # Relationship to bars
    bars = relationship("DailyBar", back_populates="stock", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Symbol(symbol='{self.symbol}', exchange='{self.exchange}')>"

class DailyBar(Base):
    __tablename__ = 'daily_bars'
    
    symbol = Column(String, ForeignKey('symbols.symbol'), nullable=False)
    date = Column(Date, nullable=False)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Integer)
    
    # Define relationship back to Symbol
    stock = relationship("Symbol", back_populates="bars")

    # Composite Primary Key: symbol + date
    __table_args__ = (
        PrimaryKeyConstraint('symbol', 'date', name='pk_daily_bars'),
    )

    def __repr__(self):
        return f"<DailyBar(symbol='{self.symbol}', date='{self.date}', close={self.close})>"

class Trade(Base):
    __tablename__ = 'trades'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False) # Supabase User ID or Email
    symbol = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False) # Negative for Sell, Positive for Buy
    price = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)
    type = Column(String, nullable=False) # 'BUY' or 'SELL'

    def __repr__(self):
        return f"<Trade(user='{self.user_id}', symbol='{self.symbol}', qty={self.quantity} @ {self.price})>"

class MarketCache(Base):
    __tablename__ = 'market_cache'
    
    key = Column(String, primary_key=True) # e.g., 'indices', 'top10'
    value = Column(String) # JSON string
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

# --- Session Management ---
Session = sessionmaker(bind=engine)

def get_session():
    return Session()

# --- Helper Functions ---

def init_db():
    """Creates the database tables."""
    Base.metadata.create_all(engine)
    print("Database tables created.")

def save_market_cache(key, data):
    """Saves serialized JSON data to market_cache table."""
    import json
    session = get_session()
    try:
        json_data = json.dumps(data)
        cache_obj = MarketCache(key=key, value=json_data)
        session.merge(cache_obj)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"Error saving market cache: {e}")
    finally:
        session.close()

def get_market_cache(key):
    """Retrieves and deserializes JSON data from market_cache table."""
    import json
    session = get_session()
    try:
        cache_obj = session.get(MarketCache, key)
        if cache_obj:
            return json.loads(cache_obj.value), cache_obj.updated_at
        return None, None
    finally:
        session.close()

def save_symbols(symbols_data):
    """
    Saves a list of symbols to the DB.
    symbols_data: List of dicts or DataFrame with keys/cols: symbol, exchange, type, company_name (optional)
    """
    session = get_session()
    try:
        if isinstance(symbols_data, pd.DataFrame):
            records = symbols_data.to_dict('records')
        else:
            records = symbols_data

        for record in records:
            # We use merge to upsert (insert or update)
            # Ensure required fields exist
            sym_obj = Symbol(
                symbol=record.get('symbol'),
                exchange=record.get('exchange', ''),
                type=record.get('type', 'STOCK'),
                company_name=record.get('company_name', '')
            )
            session.merge(sym_obj)
        
        session.commit()
        print(f"Upserted {len(records)} symbols.")
    except Exception as e:
        session.rollback()
        print(f"Error saving symbols: {e}")
    finally:
        session.close()

def save_daily_bars(symbol, df):
    """
    Saves daily bars for a specific symbol.
    df: DataFrame with datetime index or 'time' column, and columns: open, high, low, close, volume.
    """
    if df.empty:
        return

    session = get_session()
    try:
        # Standardize DataFrame
        df = df.copy()
        
        # If 'time' or 'date' column exists, make it index, or ensure index is date
        if 'time' in df.columns:
            df['date'] = pd.to_datetime(df['time']).dt.date
        elif 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date']).dt.date
        else:
            # Assume index is datetime
            df['date'] = df.index.date

        # Convert to list of DailyBar objects
        bars = []
        for _, row in df.iterrows():
            # Multiply prices by 1000 (vnstock returns in 1000s)
            bar = DailyBar(
                symbol=symbol,
                date=row['date'],
                open=row.get('open', 0) * 1000,
                high=row.get('high', 0) * 1000,
                low=row.get('low', 0) * 1000,
                close=row.get('close', 0) * 1000,
                volume=row.get('volume', 0)
            )
            session.merge(bar) # merge handles upsert based on Primary Key (symbol, date)
        
        # Update timestamp on Symbol
        sym_record = session.get(Symbol, symbol)
        if sym_record:
            sym_record.last_updated = datetime.now()
        
        session.commit()
        # print(f"Saved {len(bars)} bars for {symbol}.") # Verbose
    except Exception as e:
        session.rollback()
        print(f"Error saving bars for {symbol}: {e}")
    finally:
        session.close()

def get_history(symbol, start_date=None, end_date=None):
    """
    Retrieves history as a DataFrame.
    """
    session = get_session()
    try:
        query = session.query(DailyBar).filter(DailyBar.symbol == symbol)
        
        if start_date:
            query = query.filter(DailyBar.date >= start_date)
        if end_date:
            query = query.filter(DailyBar.date <= end_date)
            
        query = query.order_by(DailyBar.date.asc())
        
        data = query.all()
        
        if not data:
            return pd.DataFrame()
            
        # Convert to DataFrame
        df = pd.DataFrame([{
            'time': bar.date, # mapping back to 'time' for consistency with vnstock
            'open': bar.open,
            'high': bar.high,
            'low': bar.low,
            'close': bar.close,
            'volume': bar.volume
        } for bar in data])
        
        df['time'] = pd.to_datetime(df['time'])
        df.set_index('time', inplace=True)
        return df
        
    finally:
        session.close()

def get_all_symbols_list():
    """Returns a list of all symbol strings."""
    session = get_session()
    try:
        results = session.query(Symbol.symbol).all()
        return [r[0] for r in results]
    finally:
        session.close()

# --- Portfolio & Trading Functions ---

def place_trade(user_id, symbol, quantity, price, trade_type):
    """
    Records a trade.
    quantity: Absolute number (always positive).
    trade_type: 'BUY' or 'SELL'.
    """
    if quantity <= 0:
        return False, "Quantity must be greater than 0."
    if price <= 0:
        return False, "Price must be greater than 0."
        
    session = get_session()
    try:
        if trade_type.upper() == 'SELL':
            # Check if user has enough quantity to sell
            portfolio_df = get_portfolio(user_id)
            if not portfolio_df.empty:
                sym_data = portfolio_df[portfolio_df['Symbol'] == symbol.upper()]
                if sym_data.empty or sym_data['Quantity'].iloc[0] < quantity:
                    owned = sym_data['Quantity'].iloc[0] if not sym_data.empty else 0
                    return False, f"Insufficient quantity. Owned: {owned}, trying to sell: {quantity}"
            else:
                return False, f"Insufficient quantity. You don't own {symbol.upper()}."

        new_trade = Trade(
            user_id=str(user_id),
            symbol=symbol.upper(),
            quantity=quantity,
            price=price,
            type=trade_type.upper(),
            timestamp=datetime.now()
        )
        session.add(new_trade)
        session.commit()
        return True, "Trade executed successfully."
    except Exception as e:
        session.rollback()
        return False, str(e)
    finally:
        session.close()

def get_portfolio(user_id):
    """
    Calculates current portfolio holdings based on trade history.
    Returns a DataFrame with columns: Symbol, Quantity, Avg_Price, etc.
    """
    session = get_session()
    try:
        trades = session.query(Trade).filter(Trade.user_id == str(user_id)).all()
        
        if not trades:
            return pd.DataFrame()
            
        # Process trades to calculate holdings
        portfolio = {}
        
        for t in trades:
            sym = t.symbol
            if sym not in portfolio:
                portfolio[sym] = {'quantity': 0, 'total_cost': 0, 'avg_price': 0}
            
            p = portfolio[sym]
            
            if t.type == 'BUY':
                # Update Weighted Average Price
                current_val = p['quantity'] * p['avg_price']
                trade_val = t.quantity * t.price
                
                p['quantity'] += t.quantity
                p['total_cost'] += trade_val
                
                if p['quantity'] > 0:
                    p['avg_price'] = p['total_cost'] / p['quantity']
                    
            elif t.type == 'SELL':
                # FIFO or Average Cost? Usually realizing P/L. 
                # For simple portfolio view: reduce quantity. 
                # Avg Price usually doesn't change on Sell in simple accounting unless we track lots.
                # Let's keep Avg Price constant on Sell (simplest).
                p['quantity'] -= t.quantity
                p['total_cost'] = p['quantity'] * p['avg_price'] # Update total cost basis
        
        # Filter out zero positions
        final_portfolio = []
        for sym, data in portfolio.items():
            if data['quantity'] > 0:
                final_portfolio.append({
                    'Symbol': sym,
                    'Quantity': data['quantity'],
                    'Avg Price': data['avg_price'],
                    'Total Cost': data['total_cost']
                })
                
        return pd.DataFrame(final_portfolio)
        
    finally:
        session.close()

if __name__ == "__main__":
    init_db()
