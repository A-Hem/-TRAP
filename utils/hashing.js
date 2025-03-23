`runtime/utils/hashing.js` - Contextual Hashing**
```javascript
import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';

export function createHash(input, context = 'default') {
  const prefix = new TextEncoder().encode(context);
  const inputBytes = input instanceof Uint8Array ? input : 
    new TextEncoder().encode(input.toString());
  
  return bytesToHex(
    blake3(Buffer.concat([prefix, inputBytes]), { dkLen: 32 }
  );
}

export function quickVerify(hash, input, context) {
  return hash === createHash(input, context);
}
```
