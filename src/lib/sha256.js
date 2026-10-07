/**
 * Compact synchronous SHA-256 (adapted from geraintluff/sha256, public domain).
 * Used so the demo never stores plain-text passwords — this is still client-side
 * demo auth, not real security.
 */
export function sha256(input) {
  const ascii = unescape(encodeURIComponent(input)); // UTF-8 bytes as a binary string
  const rotr = (v, n) => (v >>> n) | (v << (32 - n));
  const maxWord = 2 ** 32;
  const words = [];
  const bitLength = ascii.length * 8;
  let hash = [];
  const k = [];
  const composite = {};

  for (let candidate = 2, found = 0; found < 64; candidate++) {
    if (!composite[candidate]) {
      for (let i = 0; i < 313; i += candidate) composite[i] = candidate;
      hash[found] = (candidate ** 0.5 * maxWord) | 0;
      k[found++] = (candidate ** (1 / 3) * maxWord) | 0;
    }
  }

  let msg = ascii + '\x80';
  while ((msg.length % 64) - 56) msg += '\x00';
  for (let i = 0; i < msg.length; i++) words[i >> 2] |= msg.charCodeAt(i) << (((3 - i) % 4) * 8);
  words[words.length] = (bitLength / maxWord) | 0;
  words[words.length] = bitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const old = hash;
    hash = hash.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const t1 =
        hash[7] +
        (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] + (rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10))) | 0);
      const t2 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(t1 + t2) | 0].concat(hash);
      hash[4] = (hash[4] + t1) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
  }

  let out = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      out += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return out;
}
