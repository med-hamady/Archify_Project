#!/bin/bash

# Script pour appeler l'endpoint d'import QCM Anatomie PCEM2
#
# Usage:
# 1. Attendre que le déploiement sur Render soit terminé (environ 2-3 minutes)
# 2. Remplacer YOUR_ADMIN_TOKEN par votre token JWT d'admin
# 3. Exécuter ce script: bash call-import-qcm-endpoint.sh

BACKEND_URL="https://archify-backend.onrender.com"
ADMIN_TOKEN="YOUR_ADMIN_TOKEN"  # Remplacer par votre token JWT

echo "📞 Calling /api/admin/import-qcm-anatomie endpoint..."
echo ""

curl -X POST "${BACKEND_URL}/api/admin/import-qcm-anatomie" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -v

echo ""
echo ""
echo "✅ Request completed. Check the response above for results."
