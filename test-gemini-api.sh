#!/bin/bash

# Test script for Gemini 2.5 Flash Image API (Nano Banana)
# Usage: ./test-gemini-api.sh

API_KEY="AIzaSyDgr4bTtfgdr09sUXM9quvrCi0ov-XJYkc"
MODEL="gemini-2.5-flash-image"
BASE_URL="https://generativelanguage.googleapis.com/v1beta"

echo "🧪 Testing Gemini 2.5 Flash Image API (Nano Banana)"
echo "=================================================="
echo ""

# Test 1: Simple text-only request (to verify API key works)
echo "📝 Test 1: Simple text request (verify API key)"
curl -X POST \
  "${BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello, can you generate an image?"
      }]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT"]
    }
  }' | jq '.' 2>/dev/null || cat

echo ""
echo "=================================================="
echo ""

# Test 2: Image generation with a simple prompt (no reference images)
echo "🎨 Test 2: Image generation request (simple prompt)"
curl -X POST \
  "${BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Create a photorealistic professional portrait of a person, high quality, natural lighting"
      }]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"],
      "imageConfig": {
        "aspectRatio": "9:16"
      }
    }
  }' | jq '.' 2>/dev/null || cat

echo ""
echo "=================================================="
echo ""

# Test 3: List available models (to verify API key and see what's available)
echo "📋 Test 3: List available models"
curl -X GET \
  "${BASE_URL}/models?key=${API_KEY}" \
  -H "Content-Type: application/json" | jq '.models[] | select(.name | contains("image") or contains("flash")) | {name: .name, displayName: .displayName, supportedMethods: .supportedGenerationMethods}' 2>/dev/null || cat

echo ""
echo "=================================================="
echo "✅ Testing complete!"
