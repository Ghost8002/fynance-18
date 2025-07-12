
-- This file contains sample data for testing
-- Run this after the main schema.sql

-- Note: Replace 'your-user-id-here' with actual user IDs when testing

-- Sample accounts
INSERT INTO public.accounts (user_id, name, type, bank, balance, account_number) VALUES
('your-user-id-here', 'Conta Corrente Principal', 'checking', 'Nubank', 2500.00, '1234'),
('your-user-id-here', 'Poupança', 'savings', 'Itaú', 8500.00, '5678'),
('your-user-id-here', 'Carteira', 'wallet', null, 150.00, null);

-- Sample cards
INSERT INTO public.cards (user_id, name, type, last_four_digits, expiry_date, credit_limit, used_amount, color, closing_day, due_day) VALUES
('your-user-id-here', 'Nubank', 'Visa', '4587', '12/26', 5000.00, 1850.00, 'bg-purple-600', 15, 22),
('your-user-id-here', 'Itaú', 'Mastercard', '7521', '08/27', 8000.00, 3200.00, 'bg-orange-600', 10, 17);

-- Sample goals
INSERT INTO public.goals (user_id, title, description, target_amount, current_amount, deadline, category, status) VALUES
('your-user-id-here', 'Reserva de Emergência', 'Guardar 6 meses de gastos', 30000.00, 15000.00, '2025-12-31', 'Emergência', 'active'),
('your-user-id-here', 'Viagem para Europa', 'Férias em família', 12000.00, 3500.00, '2026-06-15', 'Lazer', 'active');

-- Sample budgets (will need to be linked to categories after user creation)
-- Sample transactions (will need to be linked to accounts/cards and categories after user creation)
