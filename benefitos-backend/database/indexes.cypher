CREATE INDEX citizen_id_index IF NOT EXISTS
FOR (c:Citizen)
ON (c.id);

CREATE INDEX scheme_id_index IF NOT EXISTS
FOR (s:Scheme)
ON (s.id);

CREATE INDEX document_name_index IF NOT EXISTS
FOR (d:Document)
ON (d.name);

CREATE INDEX lifestage_name_index IF NOT EXISTS
FOR (l:LifeStage)
ON (l.name);

CREATE INDEX family_id_index IF NOT EXISTS
FOR (f:Family)
ON (f.id);

CREATE INDEX state_id_index IF NOT EXISTS
FOR (s:State)
ON (s.id);

CREATE INDEX state_name_index IF NOT EXISTS
FOR (s:State)
ON (s.name);
