# ChromaDB Dashboard

A beautiful and intuitive visual management panel for ChromaDB databases built with modern web technologies.

![ChromaDB Dashboard](https://img.shields.io/badge/ChromaDB-Dashboard-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green) ![Next.js](https://img.shields.io/badge/Next.js-Frontend-black)

## Features

✨ **Modern UI**: Built with Next.js 14, Tailwind CSS, and Shadcn/ui components  
🔍 **Vector Search**: Perform semantic searches across your document collections  
📊 **Collection Management**: Create, view, and delete ChromaDB collections  
📝 **Document Management**: Add, view, and delete documents with metadata  
🌓 **Dark/Light Mode**: Toggle between themes for comfortable viewing  
📱 **Responsive Design**: Works seamlessly on desktop and mobile devices  
⚡ **Real-time Updates**: Live connection status and automatic data refresh  
🔄 **Pagination**: Handle large collections with efficient pagination  

## Architecture

The application follows a modern full-stack architecture:

- **Backend**: Python FastAPI server that interfaces with ChromaDB
- **Frontend**: Next.js 14 with App Router and TypeScript
- **Database**: ChromaDB vector database running locally
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS for responsive design

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+**: For running the FastAPI backend
- **Node.js 18+**: For running the Next.js frontend
- **ChromaDB Server**: Must be running on `localhost:8001`

### Starting ChromaDB Server

First, you need to have ChromaDB running. Install and start it:

\`\`\`bash
# Install ChromaDB
pip install chromadb

# Start ChromaDB server (in a separate terminal)
chroma run --host localhost --port 8001
\`\`\`

## Installation & Setup

### 1. Clone or Navigate to Project

\`\`\`bash
cd chroma-dashboard
\`\`\`

### 2. Backend Setup

\`\`\`bash
# Navigate to backend directory
cd backend

# Create a fresh virtual environment (recommended to avoid conflicts)
python -m venv fresh_venv

# Activate virtual environment
# On Windows Git Bash:
source fresh_venv/Scripts/activate
# On Windows Command Prompt:
fresh_venv\\Scripts\\activate
# On macOS/Linux:
source fresh_venv/bin/activate

# Upgrade pip to latest version
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
\`\`\`

**Note**: If you encounter dependency conflicts with existing packages (like Gradio), using a fresh virtual environment as shown above will resolve these issues.

### 3. Frontend Setup

\`\`\`bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
\`\`\`

## Running the Application

### 1. Start the Backend Server

In the `backend` directory:

\`\`\`bash
# Make sure to use the fresh virtual environment
source fresh_venv/Scripts/activate  # Windows Git Bash
# fresh_venv\\Scripts\\activate     # Windows Command Prompt
# source fresh_venv/bin/activate    # macOS/Linux

# Start FastAPI server
uvicorn main:app --reload --port 8080
\`\`\`

The backend API will be available at: `http://localhost:8080`

### 2. Start the Frontend Server

In the `frontend` directory (in a new terminal):

\`\`\`bash
# Start Next.js development server
npm run dev
\`\`\`

The frontend application will be available at: `http://localhost:3000`

## Usage Guide

### 1. Dashboard Overview

When you first open the application, you'll see:
- **Connection Status**: Shows if ChromaDB is connected
- **Collections List**: All your ChromaDB collections in the sidebar
- **Welcome Page**: Getting started guide and tips

### 2. Creating Collections

1. Click the **"New"** button in the sidebar
2. Enter a collection name
3. Click **"Create"** to add the collection

### 3. Managing Documents

1. Click on any collection in the sidebar to open it
2. **Add Documents**: Use the "Add Document" button to insert new documents
3. **View Documents**: Browse through documents with pagination
4. **Delete Documents**: Use the trash icon on each row

### 4. Vector Search

1. Open any collection
2. Enter search text in the query bar
3. Adjust the number of results (1-100)
4. Click **"Search"** to find similar documents
5. Results show similarity distances

### 5. Collection Management

- **Delete Collections**: Use the "Delete Collection" button (with confirmation)
- **View Counts**: See document counts in the sidebar
- **Real-time Updates**: Data refreshes automatically

## API Endpoints

The FastAPI backend provides the following endpoints:

### Health & Status
- `GET /api/health` - Check ChromaDB connection status

### Collections
- `GET /api/collections` - List all collections with counts
- `POST /api/collections` - Create a new collection
- `DELETE /api/collections/{name}` - Delete a collection

### Documents
- `GET /api/collections/{name}` - Get collection documents (paginated)
- `POST /api/collections/{name}/add` - Add documents to collection
- `POST /api/collections/{name}/delete` - Delete documents from collection
- `POST /api/collections/{name}/query` - Query collection for similar documents

## Development

### Project Structure

\`\`\`
chroma-dashboard/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main FastAPI application
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── app/                # Next.js App Router
│   │   ├── (main)/         # Main layout group
│   │   │   ├── @sidebar/   # Sidebar parallel route
│   │   │   ├── collections/# Collection pages
│   │   │   └── layout.tsx  # Main layout
│   │   ├── api/            # API proxy routes
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── ui/             # Shadcn/ui components
│   │   ├── query-bar.tsx   # Search component
│   │   └── collection-data-table.tsx
│   ├── lib/                # Utilities
│   └── package.json        # Node.js dependencies
└── README.md               # This file
\`\`\`

### Adding New Features

1. **Backend**: Add new endpoints in `backend/main.py`
2. **Frontend**: Create components in `components/` directory
3. **UI**: Use Shadcn/ui components for consistency
4. **Styling**: Use Tailwind CSS classes

### Environment Variables

You can customize the backend URL by setting:

\`\`\`bash
# In frontend/.env.local
BACKEND_URL=http://localhost:8080
\`\`\`

## Troubleshooting

### Common Issues

1. **"Connection failed"**: Ensure ChromaDB is running on `localhost:8001`
2. **"Module not found"**: Run `npm install` or `pip install -r requirements.txt`
3. **Port conflicts**: Change ports in the startup commands if needed
4. **CORS errors**: The API proxy should handle this automatically
5. **Port 8000 access denied (Windows)**: Use port 8080 instead:
   \`\`\`bash
   uvicorn main:app --reload --port 8080
   \`\`\`
   The frontend is already configured to work with port 8080.
6. **Dependency conflicts**: If you see conflicts with packages like Gradio, create a fresh virtual environment:
   \`\`\`bash
   cd backend
   python -m venv fresh_venv
   source fresh_venv/Scripts/activate  # Windows Git Bash
   pip install --upgrade pip
   pip install -r requirements.txt
   \`\`\`

### Logs

- **Backend logs**: Check the terminal running `uvicorn`
- **Frontend logs**: Check the browser console and terminal running `npm run dev`

## Production Deployment

For production deployment:

1. **Backend**: Use a proper WSGI server like Gunicorn
2. **Frontend**: Build with `npm run build` and deploy to Vercel/Netlify
3. **Database**: Ensure ChromaDB is accessible from your backend server
4. **Environment**: Set proper environment variables for production URLs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the ChromaDB documentation
3. Create an issue in the repository

---

Built with ❤️ using FastAPI, Next.js, and ChromaDB
