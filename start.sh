#!/bin/bash

MODEL=mistral-7b-instruct-v0.1.Q4_K_M.gguf
MODEL_HF=TheBloke/Mistral-7B-Instruct-v0.1-GGUF:q4_k_m
MODEL_PATH=models/

MODEL_HF_UNDERSCORE=$(echo "$(echo "$MODEL_HF" | sed 's/\//_/g')" | cut -d':' -f1)
RESULT_PATH="${MODEL_PATH}${MODEL_HF_UNDERSCORE}/${MODEL}"

cleanup() {
  echo "Stopping the app..."
  kill -- -$$
  pkill -f "node"
  exit 0
}

trap cleanup INT

git submodule update --init --recursive --remote

bash <(curl -sSL https://g.bodaay.io/hfd) -m $MODEL_HF -s $MODEL_PATH

cd backend && python3.10 -m pip install -r requirements.txt && python3.10 main.py &

cd frontend && npm i && npm start &

cd llama.cpp && make && ./server -m ../$RESULT_PATH -c 32000 --port 7542 &

wait
