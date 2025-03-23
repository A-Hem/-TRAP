-Trap
├── config/
│   ├── crypto.js       # Token incentives setup
│   └;-> pure.js       # Reputation-based config
├── tracks/             # Dual-mode implementation
│   ├── Crypto/
│   │   ├── Incentives.js
│   │   └;-> Governance.sol
│   └;-> Pure/
│       ├;-> Reputation.js
│       └;-> Governance.js
└── network/
    └── hybrid/         # Track-aware networking
        ├;-> Tracker.js
        └;-> Bridge.js
