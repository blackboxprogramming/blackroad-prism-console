FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app
EXPOSE 8500
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8500", "ui:app"]
