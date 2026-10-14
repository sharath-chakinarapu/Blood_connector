ALTER TABLE blood_requests
    ADD COLUMN is_sos BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_blood_requests_hospital_sos_created
    ON blood_requests (requesting_hospital_id, created_at DESC)
    WHERE is_sos = TRUE;

CREATE UNIQUE INDEX uk_chats_requestless_donor_hospital
    ON chats (donor_id, hospital_id)
    WHERE blood_request_id IS NULL;
