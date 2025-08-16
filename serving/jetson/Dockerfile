FROM nvcr.io/nvidia/l4t-ml:r35.3.1-py3   # Jetson-compatible ML base (CUDA/TensorRT)
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y git python3-pip python3-dev build-essential && rm -rf /var/lib/apt/lists/*
RUN pip3 install --upgrade pip

# Core deps
RUN pip3 install fastapi uvicorn[standard] pydantic==2.* transformers==4.43.3 accelerate==0.33.0 \
    numpy onnx onnxruntime-gpu==1.17.1  # ORT GPU on Jetson builds against CUDA/TensorRT
# Simple sampler for logits
RUN pip3 install torch --extra-index-url https://download.pytorch.org/whl/cu118

WORKDIR /app
COPY server.py /app/server.py
COPY ../../models/merged /app/models/merged

EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
