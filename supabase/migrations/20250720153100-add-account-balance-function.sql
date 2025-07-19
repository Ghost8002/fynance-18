
-- Função para atualizar saldo da conta
CREATE OR REPLACE FUNCTION public.update_account_balance(
  account_id UUID,
  amount DECIMAL,
  operation TEXT
) RETURNS VOID AS $$
BEGIN
  IF operation = 'add' THEN
    UPDATE public.accounts 
    SET balance = balance + amount, updated_at = NOW()
    WHERE id = account_id AND user_id = auth.uid();
  ELSIF operation = 'subtract' THEN
    UPDATE public.accounts 
    SET balance = balance - amount, updated_at = NOW()
    WHERE id = account_id AND user_id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
