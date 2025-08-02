-- Insert default categories
INSERT INTO categories (name, description, color) VALUES
('Technical Support', 'Hardware and software related issues', '#ef4444'),
('Account Issues', 'Login, password, and account management', '#f59e0b'),
('Billing', 'Payment and subscription related queries', '#10b981'),
('Feature Request', 'Suggestions for new features', '#8b5cf6'),
('General Inquiry', 'General questions and information', '#6b7280')
ON CONFLICT DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@quickdesk.com', '$2b$10$rQZ8kHWfQxwjQxwjQxwjQOK8kHWfQxwjQxwjQxwjQxwjQxwjQxwjQ', 'System Administrator', 'admin')
ON CONFLICT DO NOTHING;

-- Insert sample agent (password: agent123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('agent@quickdesk.com', '$2b$10$rQZ8kHWfQxwjQxwjQxwjQOK8kHWfQxwjQxwjQxwjQxwjQxwjQxwjQ', 'Support Agent', 'agent')
ON CONFLICT DO NOTHING;
