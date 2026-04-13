
# Realtime Stock Analysis Tool for Vietnam Market 🇻🇳

A **Streamlit**-based application for analyzing capital flow and technical indicators of stocks in the **Vietnamese stock market**, powered by real-time data from [vnstock](https://pypi.org/project/vnstock/).

![screen](/imgs/screen1.png)

---
## Table of Contents

- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Installation](#️-installation)
- [Contact](#-contact)
- [License](#-license)
- [Future Enhancements](#-future-enhancements)
---
## Key Features

- Input stock ticker and select a custom time range  
- Visualize inflow/outflow and net capital flow  
- Heatmap of capital movement over time  
- Average bid/ask ratio analytics  
- Detailed statistical summaries  
- User-friendly interface built with Streamlit, using `matplotlib` and `seaborn` for plotting  

---

## Technology Stack

| Technology        | Description                              |
|------------------|-------------------------------------------:
| `Streamlit`       | Build a clean, interactive web interface |
| `vnstock`         | Real-time stock data API                 |
| `Pandas`, `NumPy` | Data processing and calculations         |
| `Matplotlib`, `Seaborn` | Data visualization and charting     |

---

## Installation
1. **Clone the repository:**
   ```bash
   
   ```
2. **Install required packages:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Run the App:**
   ```bash
   streamlit run streamlit_app.py
   ```

## Contact


---

## License



---

## Future Enhancements

- Add advanced technical analysis (e.g. MACD, RSI…)  
- Store historical analysis sessions  
- Automatically recommend top-performing stocks based on capital flow trends  