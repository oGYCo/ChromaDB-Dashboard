from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Literal
import chromadb
from chromadb.config import Settings
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global ChromaDB client
chroma_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global chroma_client
    logger.info("Starting up...")
    
    try:
        logger.info("Connecting to ChromaDB at localhost:8001...")
        logger.info(f"Local chromadb python package version: {getattr(chromadb,'__version__','unknown')}")

        # Branch by client version: >=0.5 uses v2 API directly
        errors: list[str] = []
        client_version = getattr(chromadb, '__version__', '0')
        logger.info(f"Detected chromadb client version: {client_version}")

        def is_modern():
            try:
                parts = client_version.split('.')
                major = int(parts[0]); minor = int(parts[1]) if len(parts)>1 else 0
                return (major, minor) >= (0,5)
            except Exception:
                return False

        def test_client(client: "chromadb.HttpClient"):
            """Run a series of lightweight probes to assert connectivity."""
            try:
                version = client.get_version()
                logger.info(f"Chroma server version: {version}")
            except Exception as ve:
                logger.warning(f"get_version failed: {ve}")
            try:
                cols = client.list_collections()
                logger.info(f"list_collections ok, count={len(cols)}")
            except Exception as le:
                logger.warning(f"list_collections failed: {le}")
            # Heartbeat (some versions still expose)
            try:
                client.heartbeat()
                logger.info("heartbeat ok")
            except Exception as he:
                logger.warning(f"heartbeat failed (may be expected on v2): {he}")

        if is_modern():
            logger.info("Using modern (>=0.5) single v2 connection strategy")
            try:
                logger.info("Attempting v2 connection with minimal settings...")
                chroma_client = chromadb.HttpClient(
                    host="localhost",
                    port=8001,
                    settings=Settings(api_version="v2", chroma_server_host="localhost", chroma_server_http_port=8001, anonymized_telemetry=False)
                )
                test_client(chroma_client)
                logger.info("Connected with modern v2 strategy")
            except Exception as me:
                logger.error(f"Modern v2 connection failed: {me}")
                errors.append(f"modern:{me}")
                
                # Try alternative v2 approaches
                try:
                    logger.info("Trying v2 with default tenant/database...")
                    chroma_client = chromadb.HttpClient(
                        host="localhost",
                        port=8001,
                        tenant="default_tenant",
                        database="default_database"
                    )
                    test_client(chroma_client)
                    logger.info("Connected with v2 + tenant/database")
                except Exception as me2:
                    logger.error(f"V2 + tenant/database failed: {me2}")
                    errors.append(f"v2_tenant:{me2}")
                    
                    # Try without explicit settings
                    try:
                        logger.info("Trying plain HttpClient for v2 server...")
                        chroma_client = chromadb.HttpClient(host="localhost", port=8001)
                        test_client(chroma_client)
                        logger.info("Connected with plain HttpClient")
                    except Exception as me3:
                        logger.error(f"Plain HttpClient failed: {me3}")
                        errors.append(f"plain:{me3}")
                        chroma_client = None
        else:
            # Legacy multi-strategy fallback
            logger.info("Using legacy (<0.5) multi-strategy connection attempts")
            # Strategy 1: Plain default (legacy style)
            try:
                logger.info("Strategy 1: plain HttpClient(host, port)")
                chroma_client = chromadb.HttpClient(host="localhost", port=8001)
                test_client(chroma_client)
                logger.info("Connected with Strategy 1")
            except Exception as e1:
                errors.append(f"S1:{e1}")
                logger.warning(f"Strategy 1 failed: {e1}")
                chroma_client = None
            # Strategy 2: Explicit v2 API setting (some transitional servers) 
            if chroma_client is None:
                try:
                    logger.info("Strategy 2: HttpClient + Settings(api_version='v2')")
                    chroma_client = chromadb.HttpClient(
                        host="localhost", 
                        port=8001,
                        settings=Settings(chroma_server_host="localhost", chroma_server_http_port=8001, allow_reset=True, anonymized_telemetry=False, api_version="v2")
                    )
                    test_client(chroma_client)
                    logger.info("Connected with Strategy 2")
                except Exception as e2:
                    errors.append(f"S2:{e2}")
                    logger.warning(f"Strategy 2 failed: {e2}")
                    chroma_client = None
            if chroma_client is None:
                raise RuntimeError("All legacy connection strategies failed: " + " | ".join(errors))

        if chroma_client is None:
            raise RuntimeError("No successful connection strategy.")

    except Exception as e:
        logger.error(f"Failed to connect to ChromaDB: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error("Please ensure ChromaDB is running on localhost:8001 and matches client version.")
        logger.error("If running newer Chroma (>=0.5 / v2 API), confirm server supports multi-tenancy or disable it.")
        chroma_client = None
    yield
    # Cleanup (if needed)

app = FastAPI(
    title="ChromaDB Management API",
    description="API for managing ChromaDB collections and documents",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class CollectionCreate(BaseModel):
    name: str

class CollectionQuery(BaseModel):
    query_text: str
    n_results: int = 5

class DocumentAdd(BaseModel):
    documents: List[str]
    metadatas: Optional[List[Dict[str, Any]]] = None
    ids: Optional[List[str]] = None

class DocumentDelete(BaseModel):
    ids: List[str]

class HealthResponse(BaseModel):
    status: str
    message: Optional[str] = None

class CollectionInfo(BaseModel):
    name: str
    count: int

class CollectionData(BaseModel):
    data: List[Dict[str, Any]]
    total: int
    page: int
    limit: int

class QueryResult(BaseModel):
    id: str
    document: str
    metadata: Optional[Dict[str, Any]] = None
    distance: Optional[float] = None

class FilterCondition(BaseModel):
    field: str
    operator: Literal["equals", "contains", "exists", "not_exists", "not_empty"]
    value: Optional[str] = None

class FilterRequest(BaseModel):
    filters: List[FilterCondition]
    page: int = Query(1, ge=1)
    limit: int = Query(10, ge=1, le=100)

def build_chroma_filter(filters: List[FilterCondition]) -> Dict[str, Any]:
    """
    Convert FilterCondition list to ChromaDB where clause format
    """
    if not filters:
        return {}
    
    conditions = []
    
    for filter_condition in filters:
        field = filter_condition.field
        operator = filter_condition.operator
        value = filter_condition.value
        
        if operator == "equals":
            if value is not None:
                conditions.append({field: {"$eq": value}})
        elif operator == "contains":
            if value is not None:
                conditions.append({field: {"$contains": value}})
        elif operator == "exists":
            conditions.append({field: {"$ne": None}})
        elif operator == "not_exists":
            conditions.append({field: {"$eq": None}})
        elif operator == "not_empty":
            # Field exists and is not empty string
            conditions.append({"$and": [
                {field: {"$ne": None}},
                {field: {"$ne": ""}}
            ]})
    
    if len(conditions) == 1:
        return conditions[0]
    elif len(conditions) > 1:
        return {"$and": conditions}
    else:
        return {}

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Check the connection to ChromaDB"""
    global chroma_client
    
    if chroma_client is None:
        logger.warning("Health check: ChromaDB client not initialized")
        return HealthResponse(status="error", message="ChromaDB client not initialized")
    
    try:
        # Test the connection
        logger.info("Health check: Testing ChromaDB connection...")
        chroma_client.heartbeat()
        logger.info("Health check: ChromaDB connection successful")
        return HealthResponse(status="ok", message="Connected to ChromaDB")
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(status="error", message=f"Connection failed: {str(e)}")

@app.get("/api/collections", response_model=List[CollectionInfo])
async def list_collections():
    """List all collections with their document counts"""
    global chroma_client
    
    if chroma_client is None:
        raise HTTPException(status_code=500, detail="ChromaDB client not initialized")
    
    try:
        collections = chroma_client.list_collections()
        result = []
        
        for collection in collections:
            try:
                # Get the collection to access its count
                col = chroma_client.get_collection(collection.name)
                count = col.count()
                result.append(CollectionInfo(name=collection.name, count=count))
            except Exception as e:
                logger.warning(f"Could not get count for collection {collection.name}: {e}")
                result.append(CollectionInfo(name=collection.name, count=0))
        
        return result
    except Exception as e:
        logger.error(f"Failed to list collections: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list collections: {str(e)}")

@app.post("/api/collections")
async def create_collection(data: CollectionCreate):
    """Create a new collection"""
    global chroma_client
    
    if chroma_client is None:
        raise HTTPException(status_code=500, detail="ChromaDB client not initialized")
    
    try:
        collection = chroma_client.create_collection(name=data.name)
        return {"message": f"Collection '{data.name}' created successfully"}
    except Exception as e:
        logger.error(f"Failed to create collection {data.name}: {e}")
        if "already exists" in str(e):
            raise HTTPException(status_code=409, detail=f"Collection '{data.name}' already exists")
        raise HTTPException(status_code=500, detail=f"Failed to create collection: {str(e)}")

@app.delete("/api/collections/{collection_name}")
async def delete_collection(collection_name: str):
    """Delete a collection"""
    global chroma_client
    
    if chroma_client is None:
        raise HTTPException(status_code=500, detail="ChromaDB client not initialized")
    
    try:
        chroma_client.delete_collection(name=collection_name)
        return {"message": f"Collection '{collection_name}' deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete collection {collection_name}: {e}")
        if "does not exist" in str(e):
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=500, detail=f"Failed to delete collection: {str(e)}")

@app.get("/api/collections/{collection_name}", response_model=CollectionData)
async def get_collection_documents(
    collection_name: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    """Get documents from a collection with pagination"""
    global chroma_client
    
    if chroma_client is None:
        raise HTTPException(status_code=500, detail="ChromaDB client not initialized")
    
    try:
        collection = chroma_client.get_collection(name=collection_name)
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get total count
        total_count = collection.count()
        
        # Get documents with pagination
        results = collection.get(
            limit=limit,
            offset=offset,
            include=["metadatas", "documents"]
        )
        
        # Format the response
        documents = []
        for i in range(len(results["ids"])):
            documents.append({
                "id": results["ids"][i],
                "document": results["documents"][i] if results["documents"] else "",
                "metadata": results["metadatas"][i] if results["metadatas"] else {}
            })
        
        return CollectionData(
            data=documents,
            total=total_count,
            page=page,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Failed to get documents from collection {collection_name}: {e}")
        if "does not exist" in str(e):
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=500, detail=f"Failed to get documents: {str(e)}")

@app.post("/api/collections/{collection_name}/filter", response_model=CollectionData)
async def filter_collection_documents(collection_name: str, filter_request: FilterRequest):
    """Filter documents from a collection based on metadata criteria"""
    global chroma_client
    
    if chroma_client is None:
        raise HTTPException(status_code=500, detail="ChromaDB client not initialized")
    
    try:
        collection = chroma_client.get_collection(name=collection_name)
        
        # Build the ChromaDB where clause
        where_clause = build_chroma_filter(filter_request.filters)
        
        # Calculate offset
        offset = (filter_request.page - 1) * filter_request.limit
        
        logger.info(f"Filtering collection {collection_name} with where clause: {where_clause}")
        
        # Get filtered documents
        if where_clause:
            results = collection.get(
                where=where_clause,
                limit=filter_request.limit,
                offset=offset,
                include=["metadatas", "documents"]
            )
            
            # Get total count for filtered results
            total_results = collection.get(
                where=where_clause,
                include=[]  # Only get count, no actual data
            )
            total_count = len(total_results["ids"])
        else:
            # No filters applied, get all documents
            results = collection.get(
                limit=filter_request.limit,
                offset=offset,
                include=["metadatas", "documents"]
            )
            total_count = collection.count()
        
        # Format the response
        documents = []
        for i in range(len(results["ids"])):
            documents.append({
                "id": results["ids"][i],
                "document": results["documents"][i] if results["documents"] else "",
                "metadata": results["metadatas"][i] if results["metadatas"] else {}
            })
        
        logger.info(f"Found {len(documents)} documents, total count: {total_count}")
        
        return CollectionData(
            data=documents,
            total=total_count,
            page=filter_request.page,
            limit=filter_request.limit
        )
    except Exception as e:
        logger.error(f"Failed to filter documents from collection {collection_name}: {e}")
        if "does not exist" in str(e):
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=500, detail=f"Failed to filter documents: {str(e)}")

@app.post("/api/collections/{collection_name}/query")
async def query_collection(collection_name: str, data: CollectionQuery):
    """Query a collection for similar documents"""
    global chroma_client
    
    if chroma_client is None:
        raise HTTPException(status_code=500, detail="ChromaDB client not initialized")
    
    try:
        collection = chroma_client.get_collection(name=collection_name)
        
        # Perform the query
        results = collection.query(
            query_texts=[data.query_text],
            n_results=data.n_results,
            include=["metadatas", "documents", "distances"]
        )
        
        # Format the response
        documents = []
        for i in range(len(results["ids"][0])):
            documents.append({
                "id": results["ids"][0][i],
                "document": results["documents"][0][i] if results["documents"] else "",
                "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                "distance": results["distances"][0][i] if results["distances"] else None
            })
        
        return documents
    except Exception as e:
        logger.error(f"Failed to query collection {collection_name}: {e}")
        if "does not exist" in str(e):
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=500, detail=f"Failed to query collection: {str(e)}")

@app.post("/api/collections/{collection_name}/add")
async def add_documents(collection_name: str, data: DocumentAdd):
    """Add documents to a collection"""
    global chroma_client
    
    if chroma_client is None:
        raise HTTPException(status_code=500, detail="ChromaDB client not initialized")
    
    try:
        collection = chroma_client.get_collection(name=collection_name)
        
        # Add documents
        add_params = {
            "documents": data.documents,
        }
        
        if data.metadatas:
            add_params["metadatas"] = data.metadatas
        
        if data.ids:
            add_params["ids"] = data.ids
        
        collection.add(**add_params)
        
        return {"message": f"Added {len(data.documents)} documents to collection '{collection_name}'"}
    except Exception as e:
        logger.error(f"Failed to add documents to collection {collection_name}: {e}")
        if "does not exist" in str(e):
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=500, detail=f"Failed to add documents: {str(e)}")

@app.post("/api/collections/{collection_name}/delete")
async def delete_documents(collection_name: str, data: DocumentDelete):
    """Delete documents from a collection"""
    global chroma_client
    
    if chroma_client is None:
        raise HTTPException(status_code=500, detail="ChromaDB client not initialized")
    
    try:
        collection = chroma_client.get_collection(name=collection_name)
        
        # Delete documents
        collection.delete(ids=data.ids)
        
        return {"message": f"Deleted {len(data.ids)} documents from collection '{collection_name}'"}
    except Exception as e:
        logger.error(f"Failed to delete documents from collection {collection_name}: {e}")
        if "does not exist" in str(e):
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=500, detail=f"Failed to delete documents: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
