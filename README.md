# Gemini Shopping Search - Full Stack Application

This project is a sophisticated, AI-powered shopping search application that demonstrates a complete end-to-end workflow, from natural language processing on the frontend to live web scraping on the backend.

## Architecture Overview

The application is composed of two main parts:

1.  **React Frontend**: A visually stunning and interactive user interface where the user can type a search query in plain English.
2.  **Python (Flask) Backend**: A simple web server that exposes an API endpoint to run the powerful Google Shopping web scraper.

### The Magical Workflow

1.  **User Input**: The user enters a query (e.g., "men's brown sandals from Bata") in the React app.
2.  **AI Query Analysis (Frontend)**: The frontend sends the query to the Gemini API, which intelligently parses it into a structured JSON object (e.g., `{ "base_query": "men's sandals", "filters": ["Brown", "Bata"] }`).
3.  **API Call (Frontend → Backend)**: The React app sends this structured JSON in a `POST` request to the Python Flask server's `/scrape` endpoint.
4.  **Live Scraping (Backend)**: The Flask server receives the request, initializes the `undetected-chromedriver`, and runs a live Google Shopping search using the query and filters.
5.  **Return Data (Backend → Frontend)**: The scraper collects the product data, and the Flask server sends it back to the React app as a JSON response.
6.  **AI Summary & Display (Frontend)**: The frontend receives the fresh product data, sends it *back* to the Gemini API for a quick summary, and then displays the products and all AI analysis beautifully.

## How to Run the Application

You will need to run two separate processes in two different terminals: the Python backend server and the development server for the React frontend.

### Prerequisites

-   Python 3.8+
-   Node.js and npm
-   Google Chrome installed (for the scraper's webdriver)
-   A Gemini API Key

### 1. Backend Setup (Python Flask Server)

The backend server is located in the `scraper/` directory.

1.  **Navigate to the scraper directory:**
    ```bash
    cd scraper
    ```

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install the required Python packages:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Flask server:**
    ```bash
    flask run
    ```

    The server will start, typically on `http://127.0.0.1:5000`. You will see output indicating that the server is running. Leave this terminal window open.

### 2. Frontend Setup (React App)

The frontend is a standard static web application. For local development, you'll need a simple HTTP server that can proxy requests to your backend to avoid CORS issues.

1.  **Set Your API Key:**
    You must have a `.env` file in the root directory of the project with your Gemini API key:
    ```
    API_KEY=your_gemini_api_key_here
    ```
    The application is configured to load this key.

2.  **Install Frontend Dependencies:**
    In a **new terminal window**, at the project's root directory, install the necessary development tools.
    ```bash
    npm install -g vite
    ```

3.  **Start the Frontend Development Server:**
    Use Vite to serve the `index.html` file. Vite is excellent for this as it provides a fast development server and can handle proxying.
    ```bash
    # From the project root
    vite
    ```
    
    Vite will start a development server (usually on `http://localhost:5173`) and automatically open it in your browser. Any requests from the app to `/api` will be proxied to your Python backend.

    > **Note:** For the proxy to work, you may need a `vite.config.js` file in the root with proxy settings if you encounter CORS errors. For this project, we call the backend directly, which should work as long as the Flask server enables CORS.

### 3. Use the App!

-   Open your browser to the address provided by the Vite server (e.g., `http://localhost:5173`).
-   Type a search query and watch the magic happen! Check the terminal running the Flask app to see the live output from the scraper.
