# Intuition Core System

/src
├── core
│   ├── intuition-core.ts        # Main logic (provided earlier)
│   ├── creativity-analyzer.ts   # Concrete scoring implementations
│   └── knowledge-graph.ts       # GraphDB interactions
├── analyzers
│   ├── syntax-originality.ts    # AST-based code analysis
│   ├── conceptual-uniqueness.ts # Embedding-based analysis
│   └── combinatorial-novelty.ts # Lineage pattern analysis
├── strategies
│   ├── forking-strategies.ts    # Fork implementations
│   └── validation.ts            # Fork validation logic
├── utils
│   ├── ast-utils.ts             # Code AST manipulation
│   ├── embeddings.ts            # Semantic embedding generation
│   └── similarity.ts            # Vector math utilities
/test
├── sample-inputs                # Test artifacts
└── creativity.spec.ts           # Test cases
/cli
├── interact.ts                  # Command line interface
└── visualize.ts                 # Knowledge graph visualization
/docs
└── architecture.md              # System design document