CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    blood_group VARCHAR(20),
    phone VARCHAR(30) NOT NULL,
    hospital_name VARCHAR(160),
    address VARCHAR(500),
    available BOOLEAN NOT NULL DEFAULT TRUE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    donation_count INTEGER NOT NULL DEFAULT 0,
    successful_missions INTEGER NOT NULL DEFAULT 0,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    last_donation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT ck_users_role CHECK (role IN ('DONOR', 'HOSPITAL')),
    CONSTRAINT ck_users_blood_group CHECK (
        blood_group IS NULL OR blood_group IN (
            'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
            'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'
        )
    ),
    CONSTRAINT ck_users_profile_for_role CHECK (
        (role = 'DONOR' AND blood_group IS NOT NULL AND hospital_name IS NULL)
        OR (role = 'HOSPITAL' AND blood_group IS NULL AND hospital_name IS NOT NULL)
    ),
    CONSTRAINT ck_users_donation_count CHECK (donation_count >= 0),
    CONSTRAINT ck_users_successful_missions CHECK (successful_missions >= 0),
    CONSTRAINT ck_users_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_users_longitude CHECK (longitude BETWEEN -180 AND 180)
);

CREATE INDEX idx_users_role_blood_available ON users (role, blood_group, available);
CREATE INDEX idx_users_coordinates ON users (latitude, longitude);
CREATE INDEX idx_users_available_donors ON users (blood_group, latitude, longitude)
    WHERE role = 'DONOR' AND available = TRUE AND enabled = TRUE;

CREATE TABLE blood_requests (
    id UUID PRIMARY KEY,
    requesting_hospital_id UUID NOT NULL REFERENCES users (id),
    blood_group VARCHAR(20) NOT NULL,
    urgency VARCHAR(20) NOT NULL,
    location_description VARCHAR(500) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    required_by TIMESTAMP WITH TIME ZONE NOT NULL,
    units_required INTEGER NOT NULL DEFAULT 1,
    contact_number VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_blood_requests_blood_group CHECK (blood_group IN (
        'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
        'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'
    )),
    CONSTRAINT ck_blood_requests_urgency CHECK (urgency IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT ck_blood_requests_status CHECK (status IN ('OPEN', 'COMPLETED', 'DISMISSED')),
    CONSTRAINT ck_blood_requests_units CHECK (units_required >= 1),
    CONSTRAINT ck_blood_requests_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_blood_requests_longitude CHECK (longitude BETWEEN -180 AND 180)
);

CREATE INDEX idx_blood_requests_hospital_created
    ON blood_requests (requesting_hospital_id, created_at DESC);
CREATE INDEX idx_blood_requests_status_coordinates
    ON blood_requests (status, latitude, longitude);

CREATE TABLE chats (
    id UUID PRIMARY KEY,
    blood_request_id UUID REFERENCES blood_requests (id),
    donor_id UUID NOT NULL REFERENCES users (id),
    hospital_id UUID NOT NULL REFERENCES users (id),
    title VARCHAR(200),
    unread_for_donor BOOLEAN NOT NULL DEFAULT FALSE,
    unread_for_hospital BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_chats_request_donor_hospital UNIQUE (blood_request_id, donor_id, hospital_id),
    CONSTRAINT ck_chats_distinct_participants CHECK (donor_id <> hospital_id)
);

CREATE INDEX idx_chats_donor_updated ON chats (donor_id, updated_at DESC);
CREATE INDEX idx_chats_hospital_updated ON chats (hospital_id, updated_at DESC);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users (id),
    sender_role VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_chat_messages_sender_role CHECK (sender_role IN ('DONOR', 'HOSPITAL')),
    CONSTRAINT ck_chat_messages_not_blank CHECK (length(btrim(message_text)) > 0)
);

CREATE INDEX idx_chat_messages_chat_created ON chat_messages (chat_id, created_at ASC);
CREATE INDEX idx_chat_messages_chat_read ON chat_messages (chat_id, read_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_blood_requests_updated_at
    BEFORE UPDATE ON blood_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
