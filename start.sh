#!/bin/bash

# Stable Diffusion Model
SD_MODEL=stabilityai/sdxl-turbo

# English Mistral 7b Q4_K_M by default
MODEL=mistral-7b-instruct-v0.1.Q4_K_M.gguf
MODEL_HF=TheBloke/Mistral-7B-Instruct-v0.1-GGUF:q4_k_m

# French Mistral 7b Q4_K_M for example
# MODEL=vigostral-7b-chat.Q4_K_M.gguf
# MODEL_HF=TheBloke/Vigostral-7B-Chat-GGUF:q4_k_m

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

# Install MODEL_HF
bash <(curl -sSL https://g.bodaay.io/hfd) -m $MODEL_HF -s $MODEL_PATH

# Check if Miniconda is installed
if ! command -v conda &> /dev/null
then
    # Download the latest Miniconda3 installer for Mac or Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh
    else
        wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
    fi

    # Run the installer script
    bash Miniconda3-latest-*-x86_64.sh -b -p $HOME/miniconda3

    # Remove the installer script
    rm Miniconda3-latest-*-x86_64.sh

    # Add conda initialize to your bash shell
    echo ". $HOME/miniconda3/etc/profile.d/conda.sh" >> ~/.bashrc
    source ~/.bashrc
fi

# Create a new environment with Python 3.11
conda create -n ImpAI python=3.11 -y

# Activate the environment
source activate ImpAI

# Start backend (for image generation)
cd backend && python3.11 -m pip install -r requirements.txt && python3.11 main.py $SD_MODEL &

# Wait for the Flask server to be up before proceeding
while ! curl -s http://127.0.0.1:7543 > /dev/null; do
    sleep 1
done

# Start frontend
cd frontend && npm i && npm start &

# Start llama.cpp server
cd llama.cpp && make && ./server -m ../$RESULT_PATH -c 32000 --port 7542 &

wait
