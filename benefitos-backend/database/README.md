# BenefitOS Neo4j Schema

BenefitOS uses Neo4j as the only persistence layer.

Apply hardening scripts from this directory:

```bash
cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -f database/constraints.cypher
cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -f database/indexes.cypher
```

State-specific schemes are modeled as:

```cypher
(scheme:Scheme)-[:AVAILABLE_IN]->(state:State)
```

Citizen residency is modeled as:

```cypher
(citizen:Citizen)-[:RESIDES_IN]->(state:State)
```

Eligibility remains backward compatible: schemes without `AVAILABLE_IN`
relationships are treated as nationally available.
