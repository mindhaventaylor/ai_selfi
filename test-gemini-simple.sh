#!/bin/bash

# Simple curl test for Gemini 2.5 Flash Image API (Nano Banana)
# This tests with a simple text prompt first

API_KEY="AIzaSyDgr4bTtfgdr09sUXM9quvrCi0ov-XJYkc"
MODEL="gemini-2.5-flash-image"

echo "🧪 Testing Nano Banana API..."
echo ""

curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Create a photorealistic professional portrait image, high quality, natural lighting"
      }]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"],
      "imageConfig": {
        "aspectRatio": "9:16"
      }
    }
  }'

echo ""
echo ""

