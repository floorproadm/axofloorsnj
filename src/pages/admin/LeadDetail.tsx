import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LeadControlModal } from '@/components/admin/LeadControlModal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, LinkIcon, MessageSquare, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import { ReferralCollabPanel } from '@/components/referral/ReferralCollabPanel';

export default function LeadDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading, refetch } = useQuery({
    queryKey: ['lead-detail', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .is('deleted_at', null)
        .eq('id', leadId)
        .single();
      if (error) throw error;
      return {
        ...data,
        services: Array.isArray(data.services) ? data.services as string[] : [],
        follow_up_actions: Array.isArray(data.follow_up_actions) ? data.follow_up_actions as any[] : [],
      };
    },
    enabled: !!leadId,
  });

  // Get portal token from linked customer (if converted)
  const { data: customer } = useQuery({
    queryKey: ['lead-customer-portal', lead?.customer_id],
    queryFn: async () => {
      if (!lead?.customer_id) return null;
      const { data } = await supabase
        .from('customers')
        .select('portal_token, phone, full_name')
        .eq('id', lead.customer_id)
        .maybeSingle();
      return data;
    },
    enabled: !!lead?.customer_id,
  });

  // Partner info — only when lead came from a partner
  const { data: partner } = useQuery({
    queryKey: ['lead-referring-partner', (lead as any)?.referred_by_partner_id],
    queryFn: async () => {
      const partnerId = (lead as any)?.referred_by_partner_id;
      if (!partnerId) return null;
      const { data } = await supabase
        .from('partners')
        .select('id, company_name, contact_name')
        .eq('id', partnerId)
        .maybeSingle();
      return data;
    },
    enabled: !!(lead as any)?.referred_by_partner_id,
  });

  // Current admin display name
  const { data: me } = useQuery({
    queryKey: ['referral-current-admin-name'],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return 'AXO Team';
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', u.user.id)
        .maybeSingle();
      return p?.full_name || u.user.email?.split('@')[0] || 'AXO Team';
    },
  });

  const portalUrl = customer?.portal_token
    ? `${window.location.origin}/portal/${customer.portal_token}`
    : null;

  const handleCopyPortal = async () => {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(portalUrl);
    toast.success('Portal link copied');
  };

  const handleSmsPortal = () => {
    if (!portalUrl) return;
    const phone = (customer?.phone || lead?.phone || '').replace(/\D/g, '');
    const body = encodeURIComponent(
      `Hi ${customer?.full_name?.split(' ')[0] || ''}, here's your AXO Portal — proposals, invoices and project updates: ${portalUrl}`
    );
    window.location.href = `sms:${phone}?&body=${body}`;
  };

  return (
    <AdminLayout title="Lead Detail">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/admin/leads'))}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Leads & Vendas
          </Button>

          {portalUrl && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleCopyPortal} className="gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                Copy Portal Link
              </Button>
              <Button size="sm" onClick={handleSmsPortal} className="gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Send via SMS
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !lead ? (
          <div className="text-center py-20 text-muted-foreground">
            Lead não encontrado
          </div>
        ) : (
          <>
            {(lead as any).referred_by_partner_id && (
              <div className="mb-4 rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Handshake className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">
                    Partner Referral
                    {partner && (
                      <span className="text-muted-foreground font-normal">
                        {' '}— {partner.contact_name || partner.company_name}
                      </span>
                    )}
                  </h2>
                </div>
                <ReferralCollabPanel
                  leadId={lead.id}
                  mode="admin"
                  authorName={me || 'AXO Team'}
                  organizationId={(lead as any).organization_id ?? null}
                />
              </div>
            )}
            <LeadControlModal
              lead={lead}
              isOpen={true}
              onClose={() => (window.history.length > 1 ? navigate(-1) : navigate('/admin/leads'))}
              onRefresh={refetch}
              embedded
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
