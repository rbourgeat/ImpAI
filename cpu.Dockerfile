ARG UBUNTU_VERSION=22.04
ARG MODEL_NAME
ARG MODEL_PATH

FROM ubuntu:$UBUNTU_VERSION as build

RUN apt-get update && \
    apt-get install -y build-essential git

WORKDIR /app

COPY llama.cpp .

RUN make

COPY models ./models

FROM ubuntu:$UBUNTU_VERSION as runtime

COPY --from=build /app/server /server

ARG MODEL_NAME
ARG MODEL_PATH
COPY --from=build /app/${MODEL_PATH}/${MODEL_NAME} /model.gguf

ENV LC_ALL=C.utf8

ENTRYPOINT [ "/server", "-m", "/model.gguf", "-c", "32000", "--host", "0.0.0.0", "--port", "7542" ]
