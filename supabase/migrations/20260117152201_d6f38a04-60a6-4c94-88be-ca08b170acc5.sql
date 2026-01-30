-- Inserir role de admin para o usuário principal
INSERT INTO user_roles (user_id, role)
VALUES ('ab22be97-6e3e-43d4-a252-6a35bc84e3ef', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;