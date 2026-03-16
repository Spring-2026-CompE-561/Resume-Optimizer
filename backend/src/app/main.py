from fastapi import FastAPI
from app import models

app = FastAPI(
    title="Resume Optimizer API",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {"status": "ok"}
