#!/bin/bash

# ChromaDB Dashboard Setup Script
echo echo "2. Start the backend (in another terminal):"
echo "   cd backend"
echo "   # Activate virtual environment first"
echo "   uvicorn main:app --reload --port 8080"ChromaDB Dashboard Setup"
echo "=========================="

echo "📋 Prerequisites Check..."
echo "Please ensure you have:"
echo "  - Python 3.8+ installed"
echo "  - Node.js 18+ installed"
echo "  - ChromaDB server running on localhost:8001"
echo ""

echo "⚙️  Setting up Backend..."
cd backend

echo "Creating fresh Python virtual environment..."
python -m venv fresh_venv

echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" ]]; then
    source fresh_venv/Scripts/activate
else
    source fresh_venv/bin/activate
fi

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Backend setup complete!"
echo ""

echo "⚙️  Setting up Frontend..."
cd ../frontend

echo "Installing Node.js dependencies..."
npm install

echo "✅ Frontend setup complete!"
echo ""

echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start ChromaDB server (if not already running):"
echo "   chroma run --host localhost --port 8001"
echo ""
echo "2. Start the backend (in one terminal):"
echo "   cd backend"
echo "   # Activate virtual environment first"
echo "   uvicorn main:app --reload --port 8000"
echo ""
echo "3. Start the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "📖 See README.md for detailed usage instructions"
