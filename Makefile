### Variables ###
MODEL = mistral-7b-instruct-v0.1.Q4_K_M.gguf
MODEL_HF = TheBloke/Mistral-7B-Instruct-v0.1-GGUF:q4_k_m
MODEL_PATH = models/
CONTAINER_NAME = llama-server-container
IMAGE_NAME = llama-server

### Dont touch ###
SHELL := /bin/bash
MODEL_FULL_PATH = $(MODEL_PATH)$(firstword $(subst :, ,$(subst /,_,$(MODEL_HF))))

all: check-model build-cpu run

build-cpu:
	docker build --build-arg MODEL_NAME=$(MODEL) --build-arg MODEL_PATH=$(MODEL_FULL_PATH) -t $(IMAGE_NAME) -f cpu.Dockerfile .

run:
	docker run --name $(CONTAINER_NAME) -d -p 7542:7542 --restart=always $(IMAGE_NAME)
	cd frontend && npm start

stop:
	docker stop $(CONTAINER_NAME)
	docker rm $(CONTAINER_NAME)

clean: stop
	docker rmi $(IMAGE_NAME)

download-model:
	@bash <(curl -sSL https://g.bodaay.io/hfd) -m $(MODEL_HF) -s $(MODEL_PATH)

check-model:
	@if [ ! -f "$(MODEL_FULL_PATH)/$(MODEL)" ]; then \
		echo "$(MODEL) not found in $(MODEL_FULL_PATH)/$(MODEL). Downloading..."; \
		make download-model; \
	fi

re: clean all

.PHONY: all build-cpu run build stop clean download-model check-model re help
