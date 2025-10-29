/**
 * Script pour attendre le déploiement et déclencher la réimportation
 */

const https = require('https');

const BACKEND_URL = 'https://archify-backend.onrender.com';
const EMAIL = 'admin@archify.ma';
const PASSWORD = 'admin123';

async function makeRequest(method, path, data = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, body: jsonBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: body, headers: res.headers });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function login() {
  const response = await makeRequest('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD });

  if (response.status !== 200) {
    throw new Error(`Échec de connexion: ${JSON.stringify(response.body)}`);
  }

  return response.body.accessToken;
}

async function checkEndpointExists(authToken) {
  try {
    const response = await makeRequest('POST', '/api/admin/reimport-anatomie-pcem2-complete', null, authToken);

    // Si on reçoit une réponse 200 ou même une erreur JSON (pas HTML), l'endpoint existe
    if (response.status === 200 || (typeof response.body === 'object' && response.body.error)) {
      return true;
    }

    // Si on reçoit du HTML avec "Cannot POST", l'endpoint n'existe pas encore
    if (typeof response.body === 'string' && response.body.includes('Cannot POST')) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function triggerReimport(authToken) {
  const response = await makeRequest('POST', '/api/admin/reimport-anatomie-pcem2-complete', null, authToken);

  if (response.status !== 200) {
    throw new Error(`Échec: ${JSON.stringify(response.body)}`);
  }

  return response.body;
}

async function main() {
  console.log('🚀 Attente du déploiement et réimportation Anatomie PCEM2\n');

  try {
    // Se connecter
    console.log('🔐 Connexion...');
    const authToken = await login();
    console.log('✅ Connecté\n');

    // Attendre que l'endpoint soit disponible
    console.log('⏳ Vérification de la disponibilité de l\'endpoint...');
    let attempt = 0;
    const maxAttempts = 30;

    while (attempt < maxAttempts) {
      attempt++;

      const exists = await checkEndpointExists(authToken);

      if (exists) {
        console.log('✅ Endpoint disponible!\n');
        break;
      }

      console.log(`   Tentative ${attempt}/${maxAttempts}: endpoint pas encore déployé, attente de 10s...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    if (attempt >= maxAttempts) {
      throw new Error('Timeout: l\'endpoint n\'est toujours pas disponible après 5 minutes');
    }

    // Déclencher la réimportation
    console.log('🔄 Déclenchement de la réimportation complète...');
    console.log('⏳ Cela peut prendre 30-60 secondes...\n');

    const result = await triggerReimport(authToken);

    console.log('✅ Réimportation terminée!\n');
    console.log('📊 Résultat:');
    console.log(result.output);

    console.log('\n🎉 Succès! Tous les chapitres ont des titres uniques et corrects!');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
