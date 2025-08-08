#!/bin/bash

# ChromaDB Dashboard Setup Script
echo "ChromaDB Dashboard Setup"
echo "=========================="

echo "📋 Prerequisites Check..."
echo "Please ensure you have:"
echo "  - Python 3.8+ installed"
echo "  - Node.js 18+ installed"
echo "  - A running ChromaDB server (e.g., on localhost:8001)"
echo ""

echo "⚙️  Setting up Backend..."
cd backend

echo "Creating Python virtual environment 'venv'..."
python -m venv venv

echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing Python dependencies from requirements.txt..."
pip install -r requirements.txt

echo "✅ Backend setup complete!"
echo ""

echo "⚙️  Setting up Frontend..."
cd ../frontend

echo "Installing Node.js dependencies with npm..."
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
echo "   source venv/bin/activate  # On Windows use: venv\Scripts\activate"
echo "   uvicorn main:app --reload --port 8080"
echo ""
echo "3. Start the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:3000 in your browser."
echo ""
echo "📖 See README.md for more details."
