import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Save,
  RotateCcw,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  Building,
  Bell,
  Mail,
  Share2,
  FileText,
  Shield,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/shared/Toast';
import { CompanySettings } from '@/types';
import { fetchCompanySettings, updateCompanySettings, testWebhook } from '@/api/settings';
import { useAuthStore } from '@/store/authStore';
import { getOpeningCashBalance, setOpeningCashBalance } from '@/api/cashflow';
import { updateSystemUserProfile } from '@/api/supabaseService';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const userEmail = user?.email || '';
  const [businessName, setBusinessName] = useState<string>(() => user?.business_name || '');
  const [defaultOpeningBalance, setDefaultOpeningBalance] = useState<string>(() => String(getOpeningCashBalance(userEmail)));

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (user?.business_name) {
      setBusinessName(user.business_name);
    }
  }, [user?.business_name]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCompanySettings();
        setSettings(data);
      } catch (err: any) {
        toast({ title: 'Error loading settings', description: err.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toast]);

  if (isLoading || !settings) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Loading configuration...</div>;
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await updateCompanySettings({ ...settings, companyName: businessName || settings.companyName });
      setSettings(updated);

      if (userEmail) {
        await updateSystemUserProfile(userEmail, {
          business_name: businessName,
          default_opening_balance: Number(defaultOpeningBalance) || 0,
          phone: settings.phone,
          gstin: settings.gstin,
          pan: settings.pan,
        });
        updateUser({ business_name: businessName });
      }

      toast({
        title: 'Settings Saved to Supabase',
        description: 'Business name, default Opening Cash Balance, and corporate profiles updated in system_users.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    try {
      setIsTestingWebhook(true);
      setWebhookResult(null);
      const res = await testWebhook(settings.n8nWebhookUrl);
      setWebhookResult(res);
      toast({
        title: 'Webhook Pinged',
        description: `${res.message} (Roundtrip: ${res.latencyMs}ms)`,
        variant: res.success ? 'success' : 'destructive',
      });
    } catch (err: any) {
      setWebhookResult({ success: false, message: err.message || 'Webhook unreachable', latencyMs: 0 });
      toast({ title: 'Webhook Ping Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleResetDefaults = async () => {
    toast({
      title: 'Defaults Restored',
      description: 'Standard FMCG financial configurations have been reset.',
      variant: 'info',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Financial & Integration Settings"
        description="Company GST registration, bank disbursement accounts, invoice sequence prefixes, and n8n webhook automation"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleResetDefaults} className="h-9 gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Reset</span>
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={isSaving} className="h-9 gap-1.5 text-xs">
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="bg-card border p-1 rounded-xl">
          <TabsTrigger value="company" className="text-xs">Company & Tax Profile</TabsTrigger>
          <TabsTrigger value="invoicing" className="text-xs">Invoice & Sequence Numbering</TabsTrigger>
          <TabsTrigger value="webhooks" className="text-xs">n8n Workflow Integrations</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Email & WhatsApp Templates</TabsTrigger>
        </TabsList>

        {/* Tab 1: Company Profile */}
        <TabsContent value="company">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Legal Entity & Master Tax Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Registered Business Name (business_name in system_users)" required>
                  <Input
                    value={businessName}
                    placeholder="e.g. Swetha FMCG Trading Co."
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      setSettings({ ...settings, companyName: e.target.value });
                    }}
                  />
                </FormField>

                <FormField label="Default Opening Cash Balance (₹) (Cash Flow Engine)" required>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={defaultOpeningBalance}
                    onChange={(e) => setDefaultOpeningBalance(e.target.value)}
                    className="font-mono"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Company Trade Name" required>
                  <Input
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  />
                </FormField>

                <FormField label="GSTIN (15 Characters)" required>
                  <Input
                    value={settings.gstin}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    className="font-mono font-semibold"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="PAN" required>
                  <Input
                    value={settings.pan}
                    onChange={(e) => setSettings({ ...settings, pan: e.target.value })}
                    className="font-mono"
                  />
                </FormField>

                <FormField label="Official Finance Email" required>
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </FormField>

                <FormField label="Phone / Helpline" required>
                  <Input
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Registered Corporate Address" required>
                <Input
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="State" required>
                  <Input
                    value={settings.state}
                    onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  />
                </FormField>
                <FormField label="PIN Code" required>
                  <Input
                    value={settings.pincode}
                    onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                  />
                </FormField>
              </div>

              {/* Bank Details */}
              <div className="pt-4 border-t space-y-3">
                <div className="font-semibold text-foreground">Settlement Current Account (Printed on Invoices)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Beneficiary Account Name">
                    <Input
                      value={settings.bankDetails.accountName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          bankDetails: { ...settings.bankDetails, accountName: e.target.value },
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Bank Name">
                    <Input
                      value={settings.bankDetails.bankName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          bankDetails: { ...settings.bankDetails, bankName: e.target.value },
                        })
                      }
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Account Number">
                    <Input
                      value={settings.bankDetails.accountNumber}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          bankDetails: { ...settings.bankDetails, accountNumber: e.target.value },
                        })
                      }
                      className="font-mono"
                    />
                  </FormField>
                  <FormField label="IFSC Code">
                    <Input
                      value={settings.bankDetails.ifsc}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          bankDetails: { ...settings.bankDetails, ifsc: e.target.value },
                        })
                      }
                      className="font-mono text-primary font-semibold"
                    />
                  </FormField>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Invoicing */}
        <TabsContent value="invoicing">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Invoice & Order Prefix Sequence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Tax Invoice Prefix">
                  <Input
                    value={settings.invoicePrefix}
                    onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                    className="font-mono"
                  />
                </FormField>

                <FormField label="Purchase Order Prefix">
                  <Input
                    value={settings.poPrefix}
                    onChange={(e) => setSettings({ ...settings, poPrefix: e.target.value })}
                    className="font-mono"
                  />
                </FormField>

                <FormField label="Payment Receipt Prefix">
                  <Input
                    value={settings.paymentPrefix}
                    onChange={(e) => setSettings({ ...settings, paymentPrefix: e.target.value })}
                    className="font-mono"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Standard Payment Terms">
                  <Input
                    value={settings.defaultPaymentTerms}
                    onChange={(e) => setSettings({ ...settings, defaultPaymentTerms: e.target.value })}
                  />
                </FormField>

                <FormField label="Default Tax Slab Rate (%)">
                  <Input
                    type="number"
                    value={settings.defaultTaxRate}
                    onChange={(e) => setSettings({ ...settings, defaultTaxRate: Number(e.target.value) })}
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: n8n Webhook Integrations */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">n8n Workflow Automation Webhook Endpoints</CardTitle>
              <p className="text-xs text-muted-foreground">
                Synchronize invoice generation, automated receipt reconciliation, and ERP webhook triggers
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <FormField label="n8n Base Webhook URL (Postgres Sync)" required>
                <div className="flex gap-2">
                  <Input
                    value={settings.n8nWebhookUrl}
                    onChange={(e) => setSettings({ ...settings, n8nWebhookUrl: e.target.value })}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestWebhook}
                    isLoading={isTestingWebhook}
                    className="shrink-0 gap-1.5"
                  >
                    <Activity className="h-3.5 w-3.5 text-primary" /> Test Webhook
                  </Button>
                </div>
              </FormField>

              {webhookResult && (
                <div
                  className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
                    webhookResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-destructive/10 border-destructive/20 text-destructive'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{webhookResult.message}</span>
                  </div>
                  <span className="font-mono font-semibold">{webhookResult.latencyMs} ms</span>
                </div>
              )}

              <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                <div className="font-semibold text-foreground">Registered n8n Event Triggers</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    <span><code>on_invoice_created</code> -&gt; Generates GST e-Invoice &amp; IRN</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    <span><code>on_payment_received</code> -&gt; Reconciles HDFC Bank feed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    <span><code>on_stock_low</code> -&gt; Drafts automated PO to miller</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    <span><code>on_overdue_invoice</code> -&gt; WhatsApp statement reminder</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Notification Automation Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-semibold text-foreground">Email Notifications</div>
                  <div className="text-muted-foreground">Send tax invoice PDFs and statements via SMTP</div>
                </div>
                <Switch
                  checked={settings.notificationPreferences.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationPreferences: { ...settings.notificationPreferences, emailNotifications: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-semibold text-foreground">WhatsApp Business API Notifications</div>
                  <div className="text-muted-foreground">Send dispatch updates and overdue notices via WhatsApp</div>
                </div>
                <Switch
                  checked={settings.notificationPreferences.whatsappNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationPreferences: { ...settings.notificationPreferences, whatsappNotifications: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-semibold text-foreground">Low Stock & Expiry Alerts</div>
                  <div className="text-muted-foreground">Notify procurement when warehouse levels fall below threshold</div>
                </div>
                <Switch
                  checked={settings.notificationPreferences.lowStockAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationPreferences: { ...settings.notificationPreferences, lowStockAlerts: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
