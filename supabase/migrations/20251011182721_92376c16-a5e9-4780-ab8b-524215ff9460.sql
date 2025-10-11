-- Corrigir função generate_monthly_bill com ambiguidade na coluna paid_amount
CREATE OR REPLACE FUNCTION public.generate_monthly_bill(p_card_id uuid, p_month integer, p_year integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_total_amount DECIMAL := 0;
    v_closing_date DATE;
    v_due_date DATE;
    v_card_closing_day INTEGER;
    v_card_due_day INTEGER;
BEGIN
    -- Get card info
    SELECT closing_day, due_day 
    INTO v_card_closing_day, v_card_due_day
    FROM public.cards 
    WHERE id = p_card_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found';
    END IF;
    
    -- Calculate dates
    v_closing_date := make_date(p_year, p_month, v_card_closing_day);
    v_due_date := make_date(p_year, p_month, v_card_due_day);
    
    -- Calculate total from transactions in the period
    SELECT COALESCE(SUM(amount), 0) INTO v_total_amount
    FROM public.transactions
    WHERE card_id = p_card_id 
    AND user_id = auth.uid()
    AND type = 'expense'
    AND date <= v_closing_date
    AND date >= (v_closing_date - INTERVAL '1 month');
    
    -- Insert or update bill
    INSERT INTO public.card_bills (
        user_id, card_id, bill_month, bill_year,
        due_date, closing_date, total_amount, 
        paid_amount, remaining_amount, status
    ) VALUES (
        auth.uid(), p_card_id, p_month, p_year,
        v_due_date, v_closing_date, v_total_amount,
        0, v_total_amount, 
        CASE WHEN v_total_amount = 0 THEN 'paid' ELSE 'open' END
    )
    ON CONFLICT (user_id, card_id, bill_month, bill_year) 
    DO UPDATE SET 
        total_amount = EXCLUDED.total_amount,
        remaining_amount = EXCLUDED.total_amount - card_bills.paid_amount,
        updated_at = NOW();
    
    RETURN json_build_object('success', true, 'amount', v_total_amount);
END;
$function$;