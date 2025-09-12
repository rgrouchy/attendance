const express = require("express");
const crypto = require("crypto");
const mysql = require("mysql2/promise");
const k8s = require('@kubernetes/client-node');
const Buffer = require('buffer').Buffer;

const NAMESPACE = "external-secrets";
const kc = new k8s.KubeConfig();
kc.loadFromCluster();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const app = express();
app.use(express.json());

const ALGORITHM = "aes-256-gcm";

// Connect to MySQL
const db = mysql.createPool({
  host: "mysql",
  user: "root",
  password: 'rootpass',
  database: "securedb"
});

async function getSecret(secretName, keyName) {
  const { body } = await k8sApi.readNamespacedSecret(secretName, NAMESPACE);
  const data = body?.data || {};

  // If a specific key was requested, return just that value
  if (keyName) {
    const encoded = data[keyName];
    if (encoded == null) {
      const keys = Object.keys(data);
      throw new Error(
        `Key "${keyName}" not found in secret "${secretName}". ` +
        `Available keys: [${keys.join(", ")}]`
      );
    }
    return Buffer.from(encoded, "base64").toString("utf-8");
  }

  // Otherwise return all keys decoded
  const decodedAll = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, Buffer.from(v, "base64").toString("utf-8")])
  );
  return decodedAll;
}

/**
 * List secrets with optional prefix
 */
async function listSecrets(prefix = "") {
  const res = await k8sApi.listNamespacedSecret(NAMESPACE);
  return res.body.items
    .map(s => s.metadata.name)
    .filter(name => name.startsWith(prefix))
    .sort();
}

// /encrypt: await secret, use binary key, catch errors
app.post("/encrypt", async (req, res, next) => {
  try {
    if (!req.body || typeof req.body.data !== "string") {
      return res.status(400).json({ error: "body.data (string) is required" });
    }
    const plaintext = req.body.data;
    const username = req.body.username

    const secretName = 'encryptionencryption-key'

    // IMPORTANT: await + binary key from Secret data["key"]
    const keyB64 = await getSecret(secretName, "current-value");
    const key = Buffer.from(keyB64, 'base64');
    const keyVersion = await getSecret(secretName, "current-version");
    console.log(key)
    console.log(`Using key version: ${keyVersion}`);
    if (!key) {
      throw new Error(`Secret "${secretName}" or key "current-value" not found`);
    }
    assertAes256Key(key);

    const formatVersion = "1";
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    // base64-encode binary pieces
    const ivB64 = iv.toString('base64');
    const tagB64 = tag.toString('base64');
    const ctB64 = ciphertext.toString('base64');

    const combined = [formatVersion, keyVersion, ivB64, tagB64, ctB64].join(':');
    console.log('encrypt: iv length=%d iv(base64)=%s iv(hex)=%s', iv.length, iv.toString('base64'), iv.toString('hex'));
    console.log('encrypt: tag length=%d tag(base64)=%s tag(hex)=%s', tag.length, tag.toString('base64'), tag.toString('hex'));
    console.log('encrypt: ciphertext length=%d ciphertext(base64)=%s', ciphertext.length, ciphertext.toString('base64'));

    console.log(`Encrypted data  ${combined}`);
    // (If you suspect DB is the hang, comment this out to test)
    await db.query("INSERT INTO OWNERS (username, sensitive_data) VALUES (?, ?)", [username, combined]);

    return res.json({ username, keyVersion, ciphertext: combined });
  } catch (err) {
    next(err);
  }
});

function assertAes256Key(keyBuf) {
  if (!Buffer.isBuffer(keyBuf) || keyBuf.length !== 32) {
    throw new Error(`Invalid AES-256 key: expected 32 bytes, got ${keyBuf?.length ?? "null"}`);
  }
}

// --- add this helper (or adapt to your secret layout) ---
async function getDek(kid) {
  // the Secret should contain either value-<version> entries, or a current-version/current-value pair
  const secretName = 'encryptionencryption-key'; // <- confirm this name
  // Try specific version first: value-<kid>
  const valB64 = await getSecret(secretName, kid);
  console.log(`Found DEK for version "${kid}":"${valB64}"`);
  const key = Buffer.from(valB64, 'base64');
  assertAes256Key(key);
  return key;
}

// Helper function to get current key version
async function getCurrentKeyVersion() {
  const secretName = 'encryptionencryption-key';
  const currentVersion = await getSecret(secretName, "current-version");
  return currentVersion;
}

// Helper function to check if a key version is different from current
async function isKeyVersionDifferent(keyVersion) {
  const currentVersion = await getCurrentKeyVersion();
  return keyVersion !== currentVersion;
}

// Helper function to re-encrypt data with current key
async function reencryptWithCurrentKey(oldCombined) {
  try {
    // First decrypt with old key
    const plaintext = await decrypt(oldCombined);
    
    // Get current key and version for re-encryption
    const secretName = 'encryptionencryption-key';
    const keyB64 = await getSecret(secretName, "current-value");
    const key = Buffer.from(keyB64, 'base64');
    const keyVersion = await getSecret(secretName, "current-version");
    
    assertAes256Key(key);
    
    // Re-encrypt with current key
    const formatVersion = "1";
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    // base64-encode binary pieces
    const ivB64 = iv.toString('base64');
    const tagB64 = tag.toString('base64');
    const ctB64 = ciphertext.toString('base64');
    
    const newCombined = [formatVersion, keyVersion, ivB64, tagB64, ctB64].join(':');
    console.log(`Re-encrypted data with key version: ${keyVersion}`);
    
    return { newCombined, plaintext, keyVersion };
  } catch (err) {
    console.error('Error re-encrypting data:', err);
    throw err;
  }
}

// --- safer decrypt ---
async function decrypt(combined) {
  if (!combined) throw new Error('Empty ciphertext');
  const parts = combined.split(':');
  if (parts.length !== 5) throw new Error('Invalid ciphertext format');
  const [formatVersion, kid, ivB64, tagB64, ctB64] = parts;
  if (formatVersion !== '1') throw new Error(`Unsupported format version ${formatVersion}`);

  const dek = await getDek(kid);

  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, dek, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  return plaintext;
}

// REST API to update all encryptions with older key versions
app.post("/update-encryptions", async (req, res, next) => {
  try {
    const currentVersion = await getCurrentKeyVersion();
    console.log(`Current key version: ${currentVersion}`);

    // Get all encrypted records
    const [rows] = await db.query("SELECT username, sensitive_data FROM OWNERS");
    
    if (!rows || rows.length === 0) {
      return res.json({ 
        message: "No encrypted data found to update", 
        currentVersion,
        updated: 0 
      });
    }

    let updatedCount = 0;
    const updatePromises = [];

    for (const row of rows) {
      const { username, sensitive_data } = row;
      
      if (!sensitive_data) continue;

      try {
        // Parse the encrypted data to check version
        const parts = sensitive_data.split(':');
        if (parts.length !== 5) {
          console.warn(`Invalid format for user ${username}, skipping`);
          continue;
        }

        const [formatVersion, keyVersion, ivB64, tagB64, ctB64] = parts;
        
        // Check if key version is different from current
        const isDifferent = await isKeyVersionDifferent(keyVersion);
        if (isDifferent) {
          console.log(`Updating encryption for user ${username} from version ${keyVersion} to ${currentVersion}`);
          
          // Re-encrypt with current key
          const updatePromise = reencryptWithCurrentKey(sensitive_data).then(async ({ newCombined }) => {
            await db.query(
              "UPDATE OWNERS SET sensitive_data = ? WHERE username = ?", 
              [newCombined, username]
            );
            return username;
          });
          
          updatePromises.push(updatePromise);
        } else {
          console.log(`User ${username} already using current key version ${keyVersion}`);
        }
      } catch (err) {
        console.error(`Error processing user ${username}:`, err);
        // Continue with other records even if one fails
      }
    }

    // Wait for all updates to complete
    const updatedUsers = await Promise.all(updatePromises);
    updatedCount = updatedUsers.length;

    console.log(`Successfully updated ${updatedCount} records to key version ${currentVersion}`);
    
    return res.json({
      message: `Updated ${updatedCount} records to current key version`,
      currentVersion,
      updated: updatedCount,
      updatedUsers
    });

  } catch (err) {
    console.error('Error updating encryptions:', err);
    next(err);
  }
});

// --- FIXED: include next, and don't call toString on a string/null ---
app.get("/user/:name", async (req, res, next) => {
  try {
    const username = req.params.name;
    const [rows] = await db.query(
      "SELECT sensitive_data FROM OWNERS WHERE username = ? LIMIT 1",
      [username]
    );
    const combined = rows?.[0]?.sensitive_data;
    if (!combined) return res.status(404).json({ error: "User not found" });

    // Check if encryption uses different key version and auto-update if needed
    const parts = combined.split(':');
    if (parts.length === 5) {
      const [formatVersion, keyVersion, ivB64, tagB64, ctB64] = parts;
      
      const isDifferent = await isKeyVersionDifferent(keyVersion);
      if (isDifferent) {
        console.log(`Auto-updating encryption for user ${username} from version ${keyVersion} to current`);
        
        // Re-encrypt with current key and update database
        const { newCombined, plaintext, keyVersion: newVersion } = await reencryptWithCurrentKey(combined);
        
        await db.query(
          "UPDATE OWNERS SET sensitive_data = ? WHERE username = ?", 
          [newCombined, username]
        );
        
        console.log(`Successfully auto-updated user ${username} to key version ${newVersion}`);
        return res.json({ 
          username, 
          password: plaintext,
          keyVersionUpdated: true,
          oldVersion: keyVersion,
          newVersion
        });
      }
    }

    // If no update needed, decrypt normally
    const plaintext = await decrypt(combined); // decrypt() returns a string
    return res.json({ username, password: plaintext, keyVersionUpdated: false });
  } catch (err) {
    return next(err); // now actually works
  }
});


// List all secrets in namespace
app.get("/secrets", async (req, res) => {
  try {
    const prefix = req.query.prefix || "";
    const secrets = await listSecrets(prefix);
    res.json({ secrets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get secret value by name (and optional key)
app.get("/secrets/:name", async (req, res) => {
  try {
    const secretName = req.params.name;
    const keyName = req.query.key || null;
    const value = await getSecret(secretName, keyName);
    res.json({ secret: secretName, key: keyName, value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// central error handler so you never “hang” on exceptions
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(3000, () => console.log("Encryption service running on port 3000"));