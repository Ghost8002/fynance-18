-- Function to process installment payment
CREATE OR REPLACE FUNCTION process_installment_payment(
    p_installment_item_id UUID,
    p_account_id UUID,
    p_payment_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON AS $$
DECLARE
    v_installment_item RECORD;
    v_installment RECORD;
    v_user_id UUID;
    v_transaction_id UUID;
    v_account_user_id UUID;
    v_new_balance DECIMAL;
BEGIN
    -- Validate authentication
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Get installment item details
    SELECT 
        cii.*,
        ci.user_id as installment_user_id,
        ci.description as purchase_description,
        ci.card_id
    INTO v_installment_item
    FROM public.card_installment_items cii
    JOIN public.card_installments ci ON ci.id = cii.installment_id
    WHERE cii.id = p_installment_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Parcela não encontrada';
    END IF;

    -- Check if user owns the installment
    IF v_installment_item.installment_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    -- Check if installment is already paid
    IF v_installment_item.status = 'paid' THEN
        RAISE EXCEPTION 'Parcela já foi paga';
    END IF;

    -- Validate account if provided
    IF p_account_id IS NOT NULL THEN
        SELECT user_id INTO v_account_user_id
        FROM public.accounts 
        WHERE id = p_account_id;

        IF v_account_user_id != auth.uid() THEN
            RAISE EXCEPTION 'Conta não pertence ao usuário';
        END IF;
    END IF;

    -- Start transaction
    BEGIN
        -- Create the actual transaction
        INSERT INTO public.transactions (
            user_id,
            type,
            description,
            amount,
            category_id,
            card_id,
            account_id,
            date,
            notes,
            installments_count,
            installment_number,
            tags
        ) VALUES (
            auth.uid(),
            'expense',
            v_installment_item.purchase_description || ' (' || v_installment_item.installment_number || '/' || 
            (SELECT installments_count FROM public.card_installments WHERE id = v_installment_item.installment_id) || ')',
            v_installment_item.amount,
            (SELECT category_id FROM public.card_installments WHERE id = v_installment_item.installment_id),
            v_installment_item.card_id,
            p_account_id,
            p_payment_date,
            'Pagamento de parcela',
            1,
            1,
            (SELECT tags FROM public.card_installments WHERE id = v_installment_item.installment_id)
        ) RETURNING id INTO v_transaction_id;

        -- Update installment item status
        UPDATE public.card_installment_items 
        SET 
            status = 'paid',
            paid_date = p_payment_date,
            account_id = p_account_id,
            transaction_id = v_transaction_id,
            updated_at = NOW()
        WHERE id = p_installment_item_id;

        -- Update account balance if account provided
        IF p_account_id IS NOT NULL THEN
            UPDATE public.accounts 
            SET 
                balance = balance - v_installment_item.amount,
                updated_at = NOW()
            WHERE id = p_account_id;
        END IF;

        -- Check if all installments are paid to update main installment status
        IF NOT EXISTS (
            SELECT 1 FROM public.card_installment_items 
            WHERE installment_id = v_installment_item.installment_id 
            AND status = 'pending'
        ) THEN
            UPDATE public.card_installments 
            SET 
                status = 'completed',
                updated_at = NOW()
            WHERE id = v_installment_item.installment_id;
        END IF;

        RETURN json_build_object(
            'success', true,
            'transaction_id', v_transaction_id,
            'message', 'Parcela paga com sucesso'
        );

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Erro ao processar pagamento: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 