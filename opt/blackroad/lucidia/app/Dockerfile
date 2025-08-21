# /opt/blackroad/lucidia/app/Dockerfile
FROM python:3.11-slim@sha256:3a1a45438183b081e0b6626900b8f58bd2d96e475c2c7781d78b810e16a3b622 AS build
ENV PIP_INDEX_URL=http://mirrors-devpi:3141/root/pypi/
WORKDIR /src
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN pytest -q

FROM python:3.11-slim@sha256:3a1a45438183b081e0b6626900b8f58bd2d96e475c2c7781d78b810e16a3b622
ENV PIP_INDEX_URL=http://mirrors-devpi:3141/root/pypi/
WORKDIR /app
COPY --from=build /src /app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
