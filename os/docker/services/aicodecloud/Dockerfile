FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 5000

CMD ["/app/start.sh"]
WORKDIR /app
COPY srv/aicodecloud /app
RUN pip install --no-cache-dir flask psutil
EXPOSE 5000
HEALTHCHECK CMD curl -fsS http://localhost:5000/api/health || exit 1
CMD ["bash","-lc","python app.py"]
