#!/bin/bash

# Test script para validar que los errores de Symfony se muestran correctamente en React

echo "🧪 Testing Invoice Validation Error Display"
echo "==========================================="
echo ""

# Get auth token
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3NjY5MzA1NTUsImV4cCI6MTc2ODIyNjU1NSwicm9sZXMiOlsiUk9MRV9BRE1JTiIsIlJPTEVfVVNFUiJdLCJ1c2VybmFtZSI6InRpbmFAdGluYWZpc2lvLmNvbSJ9.Tt4YKyL6QQfIzGQxWbikWTnHCHe7_vOqStnHAkhpPa-uyHFpHx6d3B4byTmna-JZuexenMddwn8aCkwSXWXr01aw0TH7--TbsdCATd_ohoQ0t2v3goT7B6AYdayz36htdfsdKwQVJNyz3RFgvk68pGQk_rexGvwoYxZPk4KM-RfMWZWO--OiNKq4ucchvlmad1VNS32sJWUC_DuPHW0WV8WQVsoZS_HHzAeKB657FigLveMhty9o9ZMmrLB58kg-i1VKJah4cLXAt0Q8caa5zFqVW_W5Qv2EUMUM-YICTTyZ9krkJ_CvLJi1ZHyIb8ynLTBAYRAiHxHsR_eOIUXZRQ"

echo "Test 1: Creating invoice with price = 0 (should fail with validation error)"
echo "-----------------------------------------------------------------------"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "http://127.0.0.1:8081/api/invoices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/ld+json" \
  -H "Accept: application/ld+json" \
  -d '{
    "date": "2025-12-31T00:00:00",
    "fullName": "Test Customer",
    "taxId": "12345678A",
    "address": "Test Address",
    "phone": "123456789",
    "email": "test@test.com",
    "amount": 0,
    "lines": [
      {
        "concept": "Test Service",
        "description": "Test Description",
        "quantity": 1,
        "price": 0,
        "amount": 0
      }
    ]
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo ""
echo "HTTP Status: $HTTP_STATUS"
echo ""
echo "Response Body:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "422" ]; then
    echo "✅ Test PASSED: Server returned 422 Unprocessable Entity"
    echo ""
    echo "Checking for violations structure..."

    if echo "$BODY" | grep -q "violations"; then
        echo "✅ Response contains 'violations' array"

        if echo "$BODY" | grep -q "lines\[0\]\.price"; then
            echo "✅ Response contains error for 'lines[0].price'"
            echo ""
            echo "🎉 SUCCESS: Validation error structure is correct!"
            echo "The React form should now display this error next to the price field."
        else
            echo "❌ Response does NOT contain 'lines[0].price' propertyPath"
        fi
    else
        echo "❌ Response does NOT contain 'violations' array"
    fi
else
    echo "❌ Test FAILED: Expected status 422, got $HTTP_STATUS"
fi

echo ""
echo "==========================================="
echo "Test completed!"
echo ""
echo "To test the UI:"
echo "1. Navigate to http://127.0.0.1:8081/invoices/new"
echo "2. Fill in the form with valid data"
echo "3. Set price to 0 for a line item"
echo "4. Click 'Confirmar Emisión'"
echo "5. You should see a red error message next to the price field"
echo "6. When you change the price, the error should disappear"
