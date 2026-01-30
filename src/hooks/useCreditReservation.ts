import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReservationResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

/**
 * Hook para gerenciar reservas de créditos com pré-débito
 * 
 * Fluxo:
 * 1. reserveCredit() - Debita ANTES de gerar a imagem
 * 2. confirmReservation() - Confirma após sucesso
 * 3. refundReservation() - Estorna em caso de falha
 */
export function useCreditReservation() {
  
  /**
   * Reserva créditos ANTES de iniciar a geração
   * Debita do saldo imediatamente e cria registro de reserva
   */
  const reserveCredit = useCallback(async (
    amount: number = 1,
    operationType: string = 'image_generation',
    sceneType?: string,
    metadata?: Record<string, any>
  ): Promise<ReservationResult> => {
    try {
      console.log(`💳 [Reserva] Reservando ${amount} crédito(s) para ${operationType}...`);
      
      const { data, error } = await supabase.rpc('reserve_generation_credit', {
        p_amount: amount,
        p_operation_type: operationType,
        p_scene_type: sceneType || null,
        p_metadata: metadata || {}
      });

      if (error) {
        console.error('❌ [Reserva] Erro ao reservar:', error.message);
        return { 
          success: false, 
          error: error.message || 'Erro ao reservar crédito' 
        };
      }

      if (!data) {
        console.warn('⚠️ [Reserva] Saldo insuficiente');
        return { 
          success: false, 
          error: 'Créditos insuficientes' 
        };
      }

      console.log(`✅ [Reserva] Crédito reservado com ID: ${data}`);
      return { 
        success: true, 
        reservationId: data as string 
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [Reserva] Exceção:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Confirma a reserva após geração bem-sucedida
   * Marca a reserva como consumida e registra no credit_usage
   */
  const confirmReservation = useCallback(async (
    reservationId: string
  ): Promise<boolean> => {
    try {
      console.log(`✅ [Confirmação] Confirmando reserva ${reservationId}...`);
      
      const { data, error } = await supabase.rpc('confirm_credit_reservation', {
        p_reservation_id: reservationId
      });

      if (error) {
        console.error('❌ [Confirmação] Erro:', error.message);
        return false;
      }

      if (data === true) {
        console.log(`✅ [Confirmação] Reserva ${reservationId} confirmada!`);
        return true;
      }

      console.warn(`⚠️ [Confirmação] Reserva ${reservationId} não encontrada ou já processada`);
      return false;
    } catch (err) {
      console.error('❌ [Confirmação] Exceção:', err);
      return false;
    }
  }, []);

  /**
   * Estorna a reserva em caso de falha na geração
   * Devolve os créditos ao saldo do usuário
   */
  const refundReservation = useCallback(async (
    reservationId: string
  ): Promise<boolean> => {
    try {
      console.log(`↩️ [Estorno] Estornando reserva ${reservationId}...`);
      
      const { data, error } = await supabase.rpc('refund_credit_reservation', {
        p_reservation_id: reservationId
      });

      if (error) {
        console.error('❌ [Estorno] Erro:', error.message);
        return false;
      }

      if (data === true) {
        console.log(`✅ [Estorno] Reserva ${reservationId} estornada!`);
        return true;
      }

      console.warn(`⚠️ [Estorno] Reserva ${reservationId} não encontrada ou já processada`);
      return false;
    } catch (err) {
      console.error('❌ [Estorno] Exceção:', err);
      return false;
    }
  }, []);

  /**
   * Verifica o status de uma reserva
   */
  const getReservationStatus = useCallback(async (
    reservationId: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('credit_reservations')
        .select('status')
        .eq('id', reservationId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.status;
    } catch {
      return null;
    }
  }, []);

  /**
   * Busca reservas pendentes do usuário (para debug/dashboard)
   */
  const getPendingReservations = useCallback(async (): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('credit_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'reserved');

      if (error) {
        console.error('Erro ao buscar reservas pendentes:', error);
        return 0;
      }

      return count || 0;
    } catch {
      return 0;
    }
  }, []);

  return {
    reserveCredit,
    confirmReservation,
    refundReservation,
    getReservationStatus,
    getPendingReservations
  };
}
