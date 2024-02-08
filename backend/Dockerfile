FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN python3.11 -m pip install -r requirements.txt

ARG SD_MODEL
RUN python3.11 -c "from diffusers import AutoPipelineForText2Image; AutoPipelineForText2Image.from_pretrained('${SD_MODEL}')"

COPY . .
