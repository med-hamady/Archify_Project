/**
 * Script pour déclencher la réimportation complète d'Anatomie PCEM2 en production
 *
 * Usage: node trigger-reimport-production.js <admin-email> <admin-password>
 */

const https = require('https');

const BACKEND_URL = 'https://archify-backend.onrender.com';

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

async function login(email, password) {
  console.log('🔐 Connexion en tant qu\'admin...');
  const response = await makeRequest('POST', '/api/auth/login', { email, password });

  if (response.status !== 200) {
    throw new Error(`Échec de connexion: ${JSON.stringify(response.body)}`);
  }

  console.log('✅ Connecté avec succès');
  return response.body.accessToken;
}

async function triggerReimport(authToken) {
  console.log('\n🚀 Déclenchement de la réimportation complète d\'Anatomie PCEM2...');
  console.log('⏳ Cela peut prendre 30-60 secondes...\n');

  const response = await makeRequest('POST', '/api/admin/reimport-anatomie-pcem2-complete', null, authToken);

  if (response.status !== 200) {
    throw new Error(`Échec de la réimportation: ${JSON.stringify(response.body)}`);
  }

  console.log('✅ Réimportation terminée avec succès!\n');
  console.log('📊 Résultat:');
  console.log(response.body.output);

  return response.body;
}

async function checkDeployment() {
  console.log('🔍 Vérification du déploiement...');

  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const response = await makeRequest('GET', '/api/admin/db-status');

      if (response.status === 401 || response.status === 403) {
        // Le serveur répond, le déploiement est terminé
        console.log('✅ Le serveur est prêt!\n');
        return true;
      }
    } catch (error) {
      // Le serveur ne répond pas encore
      console.log(`   Tentative ${attempt}/20: en attente...`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Attendre 10 secondes
    }
  }

  throw new Error('Le déploiement n\'est pas terminé après 3 minutes');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node trigger-reimport-production.js <admin-email> <admin-password>');
    process.exit(1);
  }

  const [email, password] = args;

  try {
    // Attendre que le déploiement soit terminé
    await checkDeployment();

    // Se connecter
    const authToken = await login(email, password);

    // Déclencher la réimportation
    await triggerReimport(authToken);

    console.log('\n🎉 Tous les chapitres ont été réimportés avec des titres uniques et corrects!');
    console.log('📋 Vérifiez votre application pour confirmer que:');
    console.log('   ✓ 22 chapitres Anatomie PCEM2');
    console.log('   ✓ 370 questions au total');
    console.log('   ✓ Tous les titres sont uniques (pas de doublons)');
    console.log('   ✓ Chapitre 3 et Chapitre 9 sont présents\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
