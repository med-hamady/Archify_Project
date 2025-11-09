#!/bin/bash
echo "🔄 Forcing Vercel redeploy..."
git commit --allow-empty -m "chore: Force Vercel redeploy for import-subject tab visibility"
git push origin main
echo "✅ Empty commit pushed. Vercel will redeploy automatically."
echo "⏱️  Wait 2-3 minutes and check https://vercel.com/dashboard"
