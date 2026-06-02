import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend/ first, then fall back to project root
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    # Try the project root
    root_env = Path(__file__).parent.parent / ".env"
    if root_env.exists():
        load_dotenv(dotenv_path=root_env)
    else:
        load_dotenv()  # fall back to default search

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL")
UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", 3600))
PORT = int(os.getenv("PORT", 8000))

# NVIDIA provider config
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "minimaxai/minimax-m2.7")

# Fireworks AI provider config (OpenAI-compatible)
FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY")
FIREWORKS_BASE_URL = os.getenv("FIREWORKS_BASE_URL", "https://api.fireworks.ai/inference/v1")
FIREWORKS_MODEL = os.getenv("FIREWORKS_MODEL", "accounts/fireworks/models/minimax-m2p7")
FIREWORKS_TEMPERATURE = float(os.getenv("FIREWORKS_TEMPERATURE", "0.6"))
FIREWORKS_MAX_TOKENS = int(os.getenv("FIREWORKS_MAX_TOKENS", "24576"))

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")  # "gemini", "nvidia", or "fireworks"

# Paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPTS_DIR = os.path.join(BACKEND_DIR, "..", "prompts")
