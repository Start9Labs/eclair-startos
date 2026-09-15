FROM eclipse-temurin:21-jre-noble

ARG ECLAIR_VERSION=0.14.3
ARG ECLAIR_COMMIT=1de8b2d
ARG ECLAIR_SHA256=06bd8f1a203b6fd7ba0659a3c20e69e69712591ef24b109caad90c0da4ad4535

RUN apt-get update && \
    apt-get install -y --no-install-recommends bash ca-certificates curl jq unzip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# The release zip is a JVM distribution carrying linux-x86_64 and linux-aarch64
# natives for secp256k1, netty-epoll and jffi, so one artifact serves both arches.
RUN curl -fsSL -o eclair-node.zip \
      "https://github.com/ACINQ/eclair/releases/download/v${ECLAIR_VERSION}/eclair-node-${ECLAIR_VERSION}-${ECLAIR_COMMIT}-bin.zip" && \
    echo "${ECLAIR_SHA256}  eclair-node.zip" | sha256sum -c - && \
    unzip -q eclair-node.zip && \
    rm eclair-node.zip && \
    mv "eclair-node-${ECLAIR_VERSION}-${ECLAIR_COMMIT}" eclair-node && \
    chmod +x eclair-node/bin/eclair-node.sh

RUN curl -fsSL -o /usr/local/bin/eclair-cli \
      "https://raw.githubusercontent.com/ACINQ/eclair/v${ECLAIR_VERSION}/eclair-core/eclair-cli" && \
    chmod +x /usr/local/bin/eclair-cli
