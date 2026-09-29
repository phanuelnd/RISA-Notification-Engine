#!/bin/bash

# Exit on error
set -e

echo "Waiting for PostgreSQL..."
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready!"

echo "Waiting for Redis..."
while ! timeout 1 bash -c "echo > /dev/tcp/$REDIS_HOST/$REDIS_PORT" 2>/dev/null; do
  sleep 1
done
echo "Redis is ready!"

echo "Running migrations..."
python manage.py migrate --noinput

echo "Loading initial data from fixtures..."
if [ -d "/app/fixtures" ]; then
  for fixture in /app/fixtures/*.json; do
    if [ -f "$fixture" ]; then
      echo "Loading fixture: $(basename $fixture)"
      python manage.py loaddata "$fixture" --verbosity 0 || echo "Warning: Could not load $(basename $fixture), it may already exist"
    fi
  done
  echo "Fixtures loading completed!"
else
  echo "No fixtures directory found, skipping..."
fi

echo "Starting server..."
exec "$@"
