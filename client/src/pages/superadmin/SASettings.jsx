import React, { useCallback, useEffect, useState } from "react";
import { superAdminService } from "../../services/api";
import { SkeletonForm } from "../../components/Skeleton";
import { PageHeader, ErrorState, useToast, apiError } from "../../components/superadmin/ui";

import { confirmDialog } from "../../utils/toast";
const PLAN_NAMES = ["Monthly", "Quarterly", "Half-Yearly", "Annual"];

const SASettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: "", message: "", type: "info" });
  const [sending, setSending] = useState(false);
  const [toast, notify] = useToast();
  const [qr, setQr] = useState({ current: "", preview: "", pending: "", loading: true, saving: false });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await superAdminService.getSettings();
      setSettings({ ...res.data.data, reminderDays: (res.data.data.reminderDays || []).join(", ") });
    } catch (err) {
      setError(apiError(err, "Failed to load settings"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadQr = useCallback(async () => {
    try {
      const res = await superAdminService.getPaymentQr();
      setQr((prev) => ({ ...prev, current: res.data.data.image, loading: false }));
    } catch {
      setQr((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadQr();
  }, [loadQr]);

  const pickQr = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) return notify("Only PNG or JPG images are allowed", "error");
    if (file.size > 2 * 1024 * 1024) return notify("The QR image must be 2 MB or smaller", "error");
    const reader = new FileReader();
    reader.onload = () => setQr((prev) => ({ ...prev, preview: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveQr = async () => {
    setQr((prev) => ({ ...prev, saving: true }));
    try {
      await superAdminService.uploadPaymentQr(qr.preview);
      notify("Payment QR saved");
      setQr((prev) => ({ ...prev, preview: "", saving: false }));
      loadQr();
    } catch (err) {
      setQr((prev) => ({ ...prev, saving: false }));
      notify(apiError(err, "Failed to save the QR code"), "error");
    }
  };

  const removeQr = async () => {
    if (!(await confirmDialog("Remove the payment QR? Schools will not see a QR until a new one is uploaded.", { confirmLabel: "Remove QR" }))) return;
    try {
      await superAdminService.removePaymentQr();
      notify("Payment QR removed");
      setQr((prev) => ({ ...prev, current: "" }));
    } catch (err) {
      notify(apiError(err, "Failed to remove the QR code"), "error");
    }
  };

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));
  const setDiscount = (plan, value) => setSettings((prev) => ({ ...prev, discounts: { ...prev.discounts, [plan]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await superAdminService.updateSettings({
        ratePerStudent: settings.ratePerStudent,
        gstPercent: settings.gstPercent,
        includeInactiveStudents: settings.includeInactiveStudents,
        discounts: settings.discounts,
        gracePeriodDays: settings.gracePeriodDays,
        expiryWarningDays: settings.expiryWarningDays,
        merchantName: settings.merchantName,
        upiId: settings.upiId,
        supportPhone: settings.supportPhone,
        supportEmail: settings.supportEmail,
        paymentInstructions: settings.paymentInstructions,
        accountDetails: settings.accountDetails,
        proofRequired: settings.proofRequired,
        reminderDays: String(settings.reminderDays ?? "")
          .split(",")
          .map((d) => Number(d.trim()))
          .filter((d) => d > 0),
      });
      setSettings({ ...res.data.data, reminderDays: (res.data.data.reminderDays || []).join(", ") });
      notify("Settings saved. New invoices use these values; existing invoices are unchanged.");
    } catch (err) {
      notify(apiError(err, "Failed to save settings"), "error");
    } finally {
      setSaving(false);
    }
  };

  const broadcast = async () => {
    if (!announcement.message.trim()) return notify("Write a message first", "error");
    if (!await confirmDialog("Send this announcement to ALL schools?")) return;
    setSending(true);
    try {
      const res = await superAdminService.broadcastAnnouncement(announcement);
      notify(res.data.message);
      setAnnouncement({ title: "", message: "", type: "info" });
    } catch (err) {
      notify(apiError(err, "Failed to send announcement"), "error");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Platform Settings" />
        <SkeletonForm fields={6} theme="dark" />
      </>
    );
  }
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      {toast}
      <PageHeader title="Settings & Announcements" subtitle="Billing rules used for every school, payment details and platform-wide notices" />

      <div className="sa2-grid two">
        <div className="sa2-card">
          <h3>Billing rules</h3>
          <div className="sa2-form-grid">
            <div className="sa2-field">
              <label htmlFor="st-rate">Rate per student per month (₹)</label>
              <input id="st-rate" type="number" min="0" step="0.01" className="sa2-input" value={settings.ratePerStudent} onChange={(e) => set("ratePerStudent", e.target.value)} />
            </div>
            <div className="sa2-field">
              <label htmlFor="st-gst">GST (%)</label>
              <input id="st-gst" type="number" min="0" max="100" className="sa2-input" value={settings.gstPercent} onChange={(e) => set("gstPercent", e.target.value)} />
            </div>
            <div className="sa2-field">
              <label htmlFor="st-grace">Grace period (days)</label>
              <input id="st-grace" type="number" min="0" max="90" className="sa2-input" value={settings.gracePeriodDays} onChange={(e) => set("gracePeriodDays", e.target.value)} />
            </div>
            <div className="sa2-field">
              <label htmlFor="st-warn">Renewal warning (days before expiry)</label>
              <input id="st-warn" type="number" min="1" max="180" className="sa2-input" value={settings.expiryWarningDays} onChange={(e) => set("expiryWarningDays", e.target.value)} />
            </div>
          </div>
          <div className="sa2-field">
            <label htmlFor="st-reminders">Reminder days before expiry (comma separated)</label>
            <input id="st-reminders" className="sa2-input" value={settings.reminderDays ?? ""} onChange={(e) => set("reminderDays", e.target.value)} placeholder="30, 7, 1" />
            <span className="sa2-muted">Reminders only appear on your dashboard. No school is ever suspended automatically.</span>
          </div>
          <div className="sa2-field">
            <label>
              <input type="checkbox" checked={!!settings.includeInactiveStudents} onChange={(e) => set("includeInactiveStudents", e.target.checked)} /> Bill inactive students too
            </label>
          </div>
          <h3>Plan discounts (%)</h3>
          <div className="sa2-form-grid">
            {PLAN_NAMES.map((plan) => (
              <div className="sa2-field" key={plan}>
                <label htmlFor={`st-d-${plan}`}>{plan}</label>
                <input id={`st-d-${plan}`} type="number" min="0" max="100" className="sa2-input" value={settings.discounts?.[plan] ?? 0} onChange={(e) => setDiscount(plan, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="sa2-card">
          <h3>Payment & support details shown to schools</h3>
          <div className="sa2-form-grid">
            <div className="sa2-field">
              <label htmlFor="st-merchant">Receiver name</label>
              <input id="st-merchant" className="sa2-input" value={settings.merchantName || ""} onChange={(e) => set("merchantName", e.target.value)} />
            </div>
            <div className="sa2-field">
              <label htmlFor="st-upi">UPI ID</label>
              <input id="st-upi" className="sa2-input" value={settings.upiId || ""} onChange={(e) => set("upiId", e.target.value)} />
            </div>
            <div className="sa2-field">
              <label htmlFor="st-phone">Support phone</label>
              <input id="st-phone" className="sa2-input" value={settings.supportPhone || ""} onChange={(e) => set("supportPhone", e.target.value)} />
            </div>
            <div className="sa2-field">
              <label htmlFor="st-email">Support email</label>
              <input id="st-email" className="sa2-input" value={settings.supportEmail || ""} onChange={(e) => set("supportEmail", e.target.value)} />
            </div>
          </div>
          <div className="sa2-actions" style={{ justifyContent: "flex-start" }}>
            <button className="sa2-btn primary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>

        <div className="sa2-card">
          <h3>Payment QR & instructions</h3>
          <p className="sa2-muted">Schools pay externally using this QR, then submit the transaction details. Nothing is marked paid until you verify it.</p>
          <div className="sa2-kv">
            <div>
              <span>Current QR</span>
              {qr.loading ? <strong>Loading...</strong> : qr.current ? <img className="sa2-proof" style={{ maxHeight: 180 }} src={qr.current} alt="Current payment QR" /> : <strong>Not configured</strong>}
            </div>
            {qr.preview && (
              <div>
                <span>New QR (preview)</span>
                <img className="sa2-proof" style={{ maxHeight: 180 }} src={qr.preview} alt="New payment QR preview" />
              </div>
            )}
          </div>
          <div className="sa2-actions" style={{ justifyContent: "flex-start", marginBottom: 14 }}>
            <label className="sa2-btn">
              Choose image
              <input type="file" accept="image/png,image/jpeg" onChange={pickQr} style={{ display: "none" }} />
            </label>
            {qr.preview && (
              <>
                <button className="sa2-btn primary" onClick={saveQr} disabled={qr.saving}>
                  {qr.saving ? "Saving..." : "Save QR"}
                </button>
                <button className="sa2-btn" onClick={() => setQr((prev) => ({ ...prev, preview: "" }))} disabled={qr.saving}>
                  Discard
                </button>
              </>
            )}
            {qr.current && !qr.preview && (
              <button className="sa2-btn danger" onClick={removeQr}>
                Remove QR
              </button>
            )}
          </div>
          <div className="sa2-field">
            <label htmlFor="st-instr">Payment instructions shown to schools</label>
            <textarea id="st-instr" className="sa2-textarea" value={settings.paymentInstructions || ""} onChange={(e) => set("paymentInstructions", e.target.value)} />
          </div>
          <div className="sa2-field">
            <label htmlFor="st-acct">Verified account / payee details</label>
            <textarea id="st-acct" className="sa2-textarea" value={settings.accountDetails || ""} onChange={(e) => set("accountDetails", e.target.value)} />
          </div>
          <div className="sa2-field">
            <label>
              <input type="checkbox" checked={settings.proofRequired !== false} onChange={(e) => set("proofRequired", e.target.checked)} /> Require a payment screenshot with every submission
            </label>
          </div>
          <div className="sa2-actions" style={{ justifyContent: "flex-start" }}>
            <button className="sa2-btn primary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>
        <div className="sa2-card">
          <h3>Announce to all schools</h3>
          <p className="sa2-muted">Shown through the existing school notice board. For one school, use the Notice button on the Schools page.</p>
          <div className="sa2-field">
            <label htmlFor="an-title">Title</label>
            <input id="an-title" className="sa2-input" value={announcement.title} onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })} />
          </div>
          <div className="sa2-field">
            <label htmlFor="an-type">Type</label>
            <select id="an-type" className="sa2-select" value={announcement.type} onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })}>
              <option value="info">Information</option>
              <option value="success">Good news</option>
              <option value="warning">Warning</option>
              <option value="danger">Urgent</option>
            </select>
          </div>
          <div className="sa2-field">
            <label htmlFor="an-message">Message</label>
            <textarea id="an-message" className="sa2-textarea" value={announcement.message} onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })} />
          </div>
          <div className="sa2-actions" style={{ justifyContent: "flex-start" }}>
            <button className="sa2-btn primary" onClick={broadcast} disabled={sending}>
              {sending ? "Sending..." : "Send to all schools"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SASettings;
