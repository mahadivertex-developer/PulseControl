ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar NOT NULL DEFAULT 'admin';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS module_access text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_category varchar NOT NULL DEFAULT 'general';
ALTER TABLE users ADD COLUMN IF NOT EXISTS general_category varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type varchar NOT NULL DEFAULT 'executive';

ALTER TABLE users ALTER COLUMN role_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL;

UPDATE users
SET username = COALESCE(username, email),
	full_name = COALESCE(full_name, email),
	user_category = COALESCE(user_category, 'general'),
	user_type = COALESCE(user_type, CASE WHEN role = 'manager' THEN 'management' ELSE 'executive' END);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS validity_date date;
