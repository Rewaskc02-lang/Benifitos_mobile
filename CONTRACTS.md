# API Contracts

## Welfare Score — GET /api/welfare-score/:citizenId
{ "score": 34, "currentBenefits": 22000, "potentialBenefits": 65000 }

## Missed Benefits — GET /api/missed-benefits/:citizenId
{ "missedSchemes": [{ "id": "sch-1092", "name": "Post-Matric Scholarship Scheme X", "benefitAmount": 20000, "reason": "Income falls below 2.5 LPA threshold but registration relationship missing." }] }

## Roadmap — GET /api/roadmap/:citizenId
{ "currentStage": "Student", "nextStage": "Graduate", "opportunities": ["State Startup Seed Capital Grant", "MSME Equipment Credit Support Scheme"] }

## Assistant — POST /api/assistant
{ "answer": "Based on your household profiling, your family qualifies for 3 additional state-backed agrarian schemes." }
