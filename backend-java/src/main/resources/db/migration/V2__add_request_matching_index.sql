CREATE INDEX idx_blood_requests_matching
    ON blood_requests (blood_group, latitude, longitude)
    WHERE status = 'OPEN';
