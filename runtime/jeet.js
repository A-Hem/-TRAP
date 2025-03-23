// runtime/jeet.js
import { JITMemory } from './memory.js';
import { createHash } from './hashing.js';

export class JeetRuntime {
  constructor(capabilities = ['math']) {
    this.memory = new JITMemory(1024); // 1GB limit
    this.capabilities = new Set(capabilities);
  }

  async execute(wasmBuffer, input) {
    const instance = await WebAssembly.instantiate(wasmBuffer, {
      env: this._getSafeEnv(),
      jit: { memory: this.memory.buffer }
    });

    return this._runGuarded(instance, input);
  }

  _runGuarded(instance, input) {
    return Promise.race([
      instance.exports.main(input),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
      )
    ]);
  }

  _getSafeEnv() {
    return Object.freeze({
      // Limited math imports
      Math: this._safeMath(),
      // Block dangerous APIs
      eval: undefined,
      require: undefined
    });
  }

  _safeMath() {
    const safe = Object.create(null);
    ['abs', 'floor', 'ceil', 'max', 'min'].forEach(name => {
      safe[name] = Math[name];
    });
    return Object.freeze(safe);
  }
}
