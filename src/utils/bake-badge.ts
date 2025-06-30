import * as fs from 'fs';
import * as path from 'path';

const extractChunks = require('png-chunks-extract');
const encodeChunks = require('png-chunks-encode');
const createTextChunk = require('png-chunk-text').encode;

const nombreImagen = 'file-1751316903310-113602512.png';


const rutaImagenOriginal = path.join(__dirname, '../../uploads', nombreImagen);
const rutaImagenFinal = path.join(__dirname, '../../uploads', `badge-final-${nombreImagen}`);

const assertion = {
  "@context": "https://w3id.org/openbadges/v2",
  "type": "Assertion",
  "id": "https://api.certif.digital/assertions/12345",
  "recipient": {
    "type": "email",
    "hashed": false,
    "identity": "jose@example.com"
  },
  "badge": "https://api.certif.digital/badges/7ed77163.json",
  "issuedOn": new Date().toISOString(),
  "verification": {
    "type": "HostedBadge"
  },
  "issuer": "https://api.certif.digital/organizaciones/1"
};

const inputBuffer = fs.readFileSync(rutaImagenOriginal);
const chunks = extractChunks(inputBuffer);

const textChunk = createTextChunk('openbadge', JSON.stringify(assertion));
chunks.splice(chunks.length - 1, 0, textChunk);

const outputBuffer = Buffer.from(encodeChunks(chunks));
fs.writeFileSync(rutaImagenFinal, outputBuffer);

console.log('✅ Imagen generada con metadata en:', rutaImagenFinal);
