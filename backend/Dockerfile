FROM python:3.12-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim
COPY --from=builder /install /usr/local
COPY . /app
WORKDIR /app
EXPOSE 8000
ENV DATABASE_URL=sqlite:///data/dev.db
RUN mkdir -p /app/uploads /app/data
VOLUME ["/app/data", "/app/uploads"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
