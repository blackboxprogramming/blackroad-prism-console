# syntax=docker/dockerfile:1.7
FROM mambaorg/micromamba:1.5.10 AS base

LABEL org.opencontainers.image.source="https://github.com/nasa/NF_AmpIllumina"
LABEL org.opencontainers.image.description="Offline-ready environment for GeneLab Amplicon workflow"

RUN micromamba install -y -n base \ 
    nextflow=24.04 \ 
    && micromamba clean -a -y

USER 1000:1000
WORKDIR /data
ENTRYPOINT ["nextflow"]
