```javascript
// runtime/jeet.js

.js
import { VM } from 'vm2';
import { MemoryManager } from './MemoryManager.js';
import { SurvivalGC } from './GarbageCollector.js';
import { ExecutionLogger } from './utils/logger.js';
import { CapabilitySecurity } from './Security.js';
import { createHash } from './utils/hashing.js';

export class jeet {
  constructor(capabilities = ['math', 'io']) {
    this.vm = new VM({
      timeout: 5000,
      sandbox: this._createSandbox(capabilities),
      compiler: 'jit',
      fixAsync: true
    });
    
    this.memory = new MemoryManager();
    this.gc = new SurvivalGC(this.memory);
    this.jobCounter = 0;
    this.capabilities = CapabilitySecurity.createContext(capabilities);
  }

  async execute(wasmModule, input) {
    const jobId = `job_${createHash(wasmModule).slice(0, 8)}`;
    let instance;
    
    try {
      ExecutionLogger.log(jobId, 'Execution started', 'debug');
      
      instance = await WebAssembly.instantiate(wasmModule, {
        env: this._getSafeImports(),
        jit: { // Custom runtime imports
          memory: this.memory.arena,
          abort: (msg) => this._handleAbort(msg)
        }
      });
      
      this.memory.track(instance);
      const result = await this._runWithGuard(instance, input);
      
      ExecutionLogger.log(jobId, 'Completed successfully');
      return result;
    } catch (error) {
      ExecutionLogger.log(jobId, `Failed: ${error.message}`, 'warning');
      throw this._sanitizeError(error);
    } finally {
      if(instance) this.gc.analyze(instance);
    }
  }

  _runWithGuard(instance, input) {
    return Promise.race([
      instance.exports.main(input),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Execution timeout')), 5000)
      )
    ]);
  }

  _createSandbox(capabilities) {
    return Object.freeze({
      // Safe math with precision limits
      Math: this._getSecuredMath(),
      
      // Timestamp without high precision
      Date: { now: () => Date.now() },
      
      // Block dangerous globals
      process: undefined,
      require: undefined,
      eval: undefined,
      
      // Allow controlled I/O if permitted
      ...(capabilities.includes('io') ? {
        print: (msg) => console.log(String(msg))
      } : {})
    });
  }

  _getSafeImports() {
    return {
      memory: this.memory.arena,
      table: new WebAssembly.Table({
        initial: 10,
        element: 'anyfunc'
      }),
      
      // Secured base functions
      abort: (msg) => {
        throw new Error(`Aborted: ${this._decodeMessage(msg)}`);
      }
    };
  }

  _handleAbort(msg) {
    const decoded = this._decodeMessage(msg);
    ExecutionLogger.log('ABORT', decoded, 'critical');
    throw new Error(`Controlled abort: ${decoded}`);
  }

  _decodeMessage(ptr) {
    const mem = new Uint8Array(this.memory.arena.buffer);
    let end = ptr;
    while(mem[end] !== 0) end++;
    return new TextDecoder().decode(mem.subarray(ptr, end));
  }

  _sanitizeError(error) {
    const safe = new Error('Execution failed');
    safe.stack = error.stack.split('\n')
      .filter(line => !line.includes('wasm://'))
      .join('\n');
    return safe;
  }

  _getSecuredMath() {
    return {
      random: () => {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] / 0xFFFFFFFF;
      },
      pow: (x, y) => (y > 100 ? NaN : Math.pow(x, y)),
      // Other math functions with guards
      ...Object.fromEntries(
        Object.entries(Math)
          .filter(([name]) => !['random'].includes(name))
      )
    };
  }
}
```
