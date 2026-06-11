#!/bin/bash
# Warm up script - pre-compiles all API routes to reduce memory pressure
echo "Warming up API routes..."
sleep 5

# Essential routes
curl -s http://localhost:3000/ -o /dev/null 2>/dev/null
curl -s -X POST 'http://localhost:3000/api/auth/login' -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}' -o /dev/null 2>/dev/null
curl -s 'http://localhost:3000/api/menus' -o /dev/null 2>/dev/null
curl -s 'http://localhost:3000/api/dashboard' -o /dev/null 2>/dev/null
curl -s 'http://localhost:3000/api/notifications' -o /dev/null 2>/dev/null

# All module API routes
for route in \
  "infection-cases" "warnings" "warning-rules" \
  "environmental-monitors" "sterilization-monitors" \
  "occupational-exposures" "antibiotic-usages" "hand-hygienes" \
  "infection-reports" "infectious-disease-cases" \
  "contact-tracings" "symptom-surveillance" "disease-alerts" \
  "infectious-disease-stats" "users" "roles" "permissions"; do
  curl -s "http://localhost:3000/api/${route}?page=1&pageSize=5" -o /dev/null 2>/dev/null
done

echo "Warmup complete!"
