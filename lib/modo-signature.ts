import { JWS, JWK } from "node-jose";

let modoKeyStore: JWK.KeyStore;

async function initModoKeyStore() {
  if (modoKeyStore) return modoKeyStore;

  const jwksUrl =
    "https://merchants.playdigital.com.ar/v2/payment-requests/.well-known/jwks.json";

  const response = await fetch(jwksUrl);
  const parsed = await response.json();
  modoKeyStore = await JWK.asKeyStore(parsed);
  return modoKeyStore;
}

export async function verifySignature(body: any) {
  await initModoKeyStore();

  const { signature, ...payloadToCompare } = body;

  const verification = await JWS.createVerify(modoKeyStore).verify(signature);

  const decodedPayload = JSON.parse(verification.payload.toString());

  return JSON.stringify(decodedPayload) === JSON.stringify(payloadToCompare);
}
