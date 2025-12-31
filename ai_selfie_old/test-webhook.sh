#!/bin/bash
echo "=== Testing Stripe Webhook Setup ==="
echo ""
echo "1. Checking if Stripe CLI is installed..."
if command -v stripe &> /dev/null; then
    echo "✅ Stripe CLI is installed"
    stripe --version
else
    echo "❌ Stripe CLI is not installed"
    echo "   Install with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo ""
echo "2. Checking if STRIPE_WEBHOOK_SECRET is set..."
if grep -q "STRIPE_WEBHOOK_SECRET" .env 2>/dev/null; then
    echo "✅ STRIPE_WEBHOOK_SECRET is in .env file"
    echo "   (value hidden for security)"
else
    echo "❌ STRIPE_WEBHOOK_SECRET is not in .env file"
    echo "   You need to:"
    echo "   1. Run: stripe listen --forward-to localhost:3000/api/stripe-webhook"
    echo "   2. Copy the webhook secret (starts with whsec_)"
    echo "   3. Add to .env: STRIPE_WEBHOOK_SECRET=whsec_xxxxx"
    exit 1
fi

echo ""
echo "3. To start webhook forwarding, run in a separate terminal:"
echo "   stripe listen --forward-to localhost:3000/api/stripe-webhook"
echo ""
echo "4. To test if webhook is working, run:"
echo "   stripe trigger checkout.session.completed"
echo ""
