FROM python:3.11-slim
WORKDIR /app
COPY srv/aicodecloud /app
RUN pip install --no-cache-dir flask psutil
EXPOSE 5000
HEALTHCHECK CMD curl -fsS http://localhost:5000/api/health || exit 1
CMD ["bash","-lc","python app.py"]
