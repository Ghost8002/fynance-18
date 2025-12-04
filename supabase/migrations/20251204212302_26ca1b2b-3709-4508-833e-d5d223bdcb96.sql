-- Fix search_path for trigger functions that are missing it

CREATE OR REPLACE FUNCTION public.update_custom_banks_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_deleted_tag()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Remove a tag de todas as transações antes de deletá-la
  PERFORM remove_tag_from_transactions(OLD.id);
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_pluggy_connections_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_create_debts_from_installment()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_debts_from_installments(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_debt_when_installment_paid()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid' THEN
    UPDATE public.debts
    SET status = 'paid',
        paid_date = COALESCE(NEW.paid_date, CURRENT_DATE),
        updated_at = NOW()
    WHERE installment_id = NEW.installment_id
      AND installment_number = NEW.installment_number;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_debt_when_bill_paid()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid' THEN
    UPDATE public.debts
    SET status = 'paid',
        paid_date = COALESCE(paid_date, CURRENT_DATE),
        updated_at = NOW()
    WHERE user_id = NEW.user_id
      AND is_card_bill = TRUE
      AND card_id = NEW.card_id
      AND bill_month = NEW.bill_month
      AND bill_year = NEW.bill_year;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_payment_on_debt_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid' THEN
    PERFORM public.sync_debt_payment(NEW.id, NEW.amount, COALESCE(NEW.paid_date, CURRENT_DATE));
  END IF;
  RETURN NEW;
END;
$function$;