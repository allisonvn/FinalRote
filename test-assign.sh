#!/bin/bash

curl -X POST "http://localhost:3001/api/experiments/62547d2d-91b1-42a8-9aa7-c9b1bb7bc927/assign" \
  -H "Content-Type: application/json" \
  -d '{"visitor_id":"test-visitor-789"}' \
  -s | jq '.'
