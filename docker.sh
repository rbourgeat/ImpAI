#!/bin/bash

docker-compose down

# Stable Diffusion Model
export SD_MODEL=stabilityai/sdxl-turbo

# English Mistral 7b Q4_K_M by default
MODEL=mistral-7b-instruct-v0.1.Q4_K_M.gguf
MODEL_HF=TheBloke/Mistral-7B-Instruct-v0.1-GGUF:q4_k_m

# French Mistral 7b Q4_K_M for example
# MODEL=vigostral-7b-chat.Q4_K_M.gguf
# MODEL_HF=TheBloke/Vigostral-7B-Chat-GGUF:q4_k_m

export MODEL_PATH=models/

MODEL_HF_UNDERSCORE=$(echo "$(echo "$MODEL_HF" | sed 's/\//_/g')" | cut -d':' -f1)
export RESULT_PATH="${MODEL_HF_UNDERSCORE}/${MODEL}"

docker-compose down

# Install MODEL_HF
bash <(curl -sSL https://g.bodaay.io/hfd) -m $MODEL_HF -s $MODEL_PATH

docker-compose up -d
