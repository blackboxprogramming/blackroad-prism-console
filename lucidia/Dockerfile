FROM python:3.11-slim
ENV PIP_NO_INDEX=1 PIP_FIND_LINKS=/wheels
COPY wheels /wheels
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-index --find-links=/wheels -r /tmp/requirements.txt
COPY app.py /app.py
ENV PORT=8080
CMD ["python", "/app.py"]
