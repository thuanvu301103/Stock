FROM naskio/n8n-python:latest-debian

USER root
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -U -r /tmp/requirements.txt