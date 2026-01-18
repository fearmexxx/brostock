import streamlit as st
import os
from supabase import create_client, Client

# Load secrets from Streamlit secrets (for Cloud) or Env vars
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

try:
    if not SUPABASE_URL:
        SUPABASE_URL = st.secrets.get("SUPABASE_URL")
    if not SUPABASE_KEY:
        SUPABASE_KEY = st.secrets.get("SUPABASE_KEY")
except Exception:
    # Secrets not configured
    pass

def init_supabase():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def login():
    """
    Handles user login.
    Returns: User object if authenticated, None otherwise.
    """
    
    # 1. Check if already authenticated in session
    if 'user' in st.session_state:
        return st.session_state['user']

    # 2. Check for Local Dev Mode (No Supabase Config)
    supabase = init_supabase()
    if not supabase:
        st.sidebar.warning("⚠️ Local Mode: Auth Disabled")
        # Return a mock user for local development
        mock_user = {"email": "dev@local.host", "id": "local_dev"}
        st.session_state['user'] = mock_user
        return mock_user

    # 3. Render Login Form
    st.markdown("""
        <style>
            .login-container {
                max-width: 400px;
                margin: auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 10px;
                background-color: #f9f9f9;
            }
        </style>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.title("🔐 Login")
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        
        if st.button("Sign In", use_container_width=True):
            try:
                res = supabase.auth.sign_in_with_password({
                    "email": email,
                    "password": password
                })
                st.session_state['user'] = res.user
                st.success("Login successful!")
                st.rerun()
            except Exception as e:
                st.error(f"Login failed: {e}")
                
    return None

def logout():
    if 'user' in st.session_state:
        del st.session_state['user']
    
    supabase = init_supabase()
    if supabase:
        supabase.auth.sign_out()
    
    st.rerun()
