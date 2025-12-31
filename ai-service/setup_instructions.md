# Setup Instructions for AI Matching Service

## Python 3.13 Compatibility Fix

If you're using Python 3.13 and encountering installation errors, follow these steps:

### Step 1: Update pip and setuptools first

```bash
python -m pip install --upgrade pip
python -m pip install --upgrade setuptools wheel
```

### Step 2: Install dependencies

```bash
pip install -r requirements.txt
```

### Alternative: Use Python 3.11 or 3.12 (Recommended)

If you continue to have issues with Python 3.13, consider using Python 3.11 or 3.12:

1. Install Python 3.11 or 3.12 from [python.org](https://www.python.org/downloads/)
2. Create a virtual environment:
   ```bash
   python3.11 -m venv venv
   # or
   python3.12 -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Step 3: Run the service

```bash
python app.py
```

The service will run on `http://localhost:5000` by default.

