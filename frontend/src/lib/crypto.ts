/**
 * CUSTODIA WebCrypto ECDSA P-256 Digital Signature Suite
 * Implements real client-side cryptographic signing for the Dual-Key Proof-of-Closure Gate.
 */

export interface ClinicianKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyJWK: JsonWebKey;
  keyFingerprint: string;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64UrlEncode(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let cachedKeyPair: ClinicianKeyPair | null = null;

export async function getOrCreateClinicianKeyPair(): Promise<ClinicianKeyPair> {
  if (cachedKeyPair) {
    return cachedKeyPair;
  }

  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    // SSR fallback simulation
    const mockJWK: JsonWebKey = {
      kty: "EC",
      crv: "P-256",
      x: "W1s7H_89V9_x_MOCK_PUBLIC_KEY_X",
      y: "Y2t8J_01W0_y_MOCK_PUBLIC_KEY_Y",
    };
    return {
      publicKey: {} as CryptoKey,
      privateKey: {} as CryptoKey,
      publicKeyJWK: mockJWK,
      keyFingerprint: "ECDSA-P256-SIMULATED-FINGERPRINT",
    };
  }

  // 1. Generate real ECDSA P-256 key pair via WebCrypto subtle API
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true, // extractable
    ["sign", "verify"]
  );

  // 2. Export public key in JWK format
  const publicKeyJWK = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);

  // 3. Compute public key fingerprint
  const rawPub = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", rawPub);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyFingerprint = hashArray.slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join(":");

  cachedKeyPair = {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyJWK,
    keyFingerprint,
  };

  return cachedKeyPair;
}

export async function signProofOfClosure(
  loopId: string,
  closureFhirEvidenceId: string,
  closureCode: string
): Promise<{
  signatureB64: string;
  publicKeyJWK: JsonWebKey;
  keyFingerprint: string;
  signedMessage: string;
}> {
  const keys = await getOrCreateClinicianKeyPair();

  // Primary canonical message format matching backend verify_dual_key_closure
  const signedMessage = `${loopId}|${closureFhirEvidenceId}|${closureCode}`;
  const enc = new TextEncoder();
  const data = enc.encode(signedMessage);

  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle && keys.privateKey.type) {
    // Real ECDSA P-256 signature with SHA-256
    const sigBuffer = await window.crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      keys.privateKey,
      data
    );

    const sigB64 = base64UrlEncode(bufferToBase64(sigBuffer));

    return {
      signatureB64: sigB64,
      publicKeyJWK: keys.publicKeyJWK,
      keyFingerprint: keys.keyFingerprint,
      signedMessage,
    };
  }

  // Fallback signature simulation
  const sigB64 = `SIG_ECDSA_P256_${Date.now()}_${loopId.slice(0, 8)}`;
  return {
    signatureB64: sigB64,
    publicKeyJWK: keys.publicKeyJWK,
    keyFingerprint: keys.keyFingerprint,
    signedMessage,
  };
}
