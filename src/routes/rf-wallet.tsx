import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, Wallet, Phone, X, User, CreditCard, Tag, IdCard, Building2, MapPin, Home, Gavel, ClipboardList, FileText, BadgeCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { getRfCustomers, updateRfCustomer } from "@/lib/rf-wallet.functions";
import { getSession } from "@/components/LoginGate";
import { formatMoney, formatMoneyInput, parseMoneyInput, normalizePhone } from "@/lib/wallet-types";
import najizVerifyBtn from "@/assets/najiz-verify-btn.png.asset.json";

export const Route = createFileRoute("/rf-wallet")({
  head: () => ({
    meta: [
      { title: "محفظة عملاء العقار (RF)" },
      { name: "description", content: "قائمة عملاء العقار المخصصة للمحصل." },
    ],
  }),
  component: RfWalletPage,
});

type RfRow = {
  id: string;
  account_number: string | null;
  amount: number | null;
  note: string | null;
  action: string | null;
  agent_employee_id: string | null;
  agent_name: string | null;
  supervisor_employee_id: string | null;
  supervisor_name: string | null;
  product: string | null;
  customer_name: string | null;
  national_id: string | null;
  phone: string | null;
  product_type: string | null;
  eviction_agency: string | null;
  eviction_action: string | null;
  property_city: string | null;
  property_kind: string | null;
  execution_action: string | null;
  case_number: string | null;
  payment: number | null;
  request_number: string | null;
  request_type: string | null;
};

const ACTION_OPTIONS: { value: string; color: string }[] = [
  { value: "بيانات خاطئة", color: "#6B7280" },
  { value: "بدون إجابة", color: "#94A3B8" },
  { value: "Call Back", color: "#3B82F6" },
  { value: "الرقم خطأ", color: "#F97316" },
  { value: "تم السداد", color: "#22C55E" },
  { value: "خروج نهائي", color: "#0EA5A4" },
  { value: "متوفي", color: "#EF4444" },
  { value: "مشكلة غير محلولة", color: "#DC2626" },
  { value: "وعد سداد", color: "#8B5CF6" },
];

function actionStyle(v?: string | null): React.CSSProperties | undefined {
  if (!v) return undefined;
  const c = ACTION_OPTIONS.find((a) => a.value === v)?.color;
  return c ? { color: c, borderColor: c, backgroundColor: `${c}14` } : undefined;
}

// Column order: left → right (first column shows leftmost when wrapped in dir="ltr")
const COLUMNS: { key: keyof RfRow; label: string; money?: boolean; number?: boolean; kind?: "action" | "phone" }[] = [
  { key: "account_number", label: "رقم الحساب", number: true },
  { key: "amount", label: "مبلغ المديونية", money: true },
  { key: "note", label: "Note" },
  { key: "action", label: "الاكشن", kind: "action" },
  { key: "product", label: "المنتج" },
  { key: "product_type", label: "نوع المنتج" },
  { key: "national_id", label: "رقم الهوية", number: true },
  { key: "customer_name", label: "اسم العميل" },
  { key: "phone", label: "رقم الجوال", kind: "phone" },
  { key: "agent_name", label: "اسم المحصل" },
  { key: "supervisor_name", label: "اسم المشرف" },
  { key: "eviction_agency", label: "وكالة تنفيذ إخلاء العقار" },
  { key: "eviction_action", label: "أكشن الإخلاء" },
  { key: "property_city", label: "مدينة العقار" },
  { key: "property_kind", label: "شقة - فيلا - أرض" },
  { key: "execution_action", label: "أكشن تنفيذ" },
  { key: "case_number", label: "رقم القضية", number: true },
  { key: "request_number", label: "رقم الطلب" },
  { key: "request_type", label: "نوع الطلب" },
  { key: "payment", label: "السداد", money: true },
];

function columnWidthClass(key: keyof RfRow): string {
  switch (key) {
    case "account_number": return "w-[145px] min-w-[145px] max-w-[145px]";
    case "amount": return "w-[120px] min-w-[120px] max-w-[120px]";
    case "note": return "w-[82px] min-w-[82px] max-w-[82px]";
    case "action": return "w-[150px] min-w-[150px] max-w-[150px]";
    case "product":
    case "product_type": return "w-[100px] min-w-[100px] max-w-[100px]";
    case "national_id": return "w-[135px] min-w-[135px] max-w-[135px]";
    case "customer_name": return "w-[240px] min-w-[240px] max-w-[240px]";
    case "phone": return "w-[135px] min-w-[135px] max-w-[135px]";
    case "agent_name":
    case "supervisor_name": return "w-[260px] min-w-[260px] max-w-[260px]";
    case "eviction_agency":
    case "eviction_action":
    case "execution_action": return "w-[160px] min-w-[160px] max-w-[160px]";
    case "property_city":
    case "property_kind": return "w-[110px] min-w-[110px] max-w-[110px]";
    case "case_number": return "w-[135px] min-w-[135px] max-w-[135px]";
    case "request_number": return "w-[120px] min-w-[120px] max-w-[120px]";
    case "request_type": return "w-[140px] min-w-[140px] max-w-[140px]";
    case "payment": return "w-[120px] min-w-[120px] max-w-[120px]";
    default: return "w-[120px] min-w-[120px] max-w-[120px]";
  }
}

function cellWrap(key: keyof RfRow): string {
  switch (key) {
    case "customer_name":
    case "agent_name":
    case "supervisor_name":
    case "eviction_agency":
    case "eviction_action":
    case "execution_action":
      return "whitespace-normal break-words leading-relaxed";
    default:
      return "whitespace-nowrap";
  }
}

function formatPhone(v: string | null): string {
  if (!v) return "";
  const n = normalizePhone(v);
  if (!n) return "";
  return "+" + n;
}

function RfWalletPage() {
  const fetchRf = useServerFn(getRfCustomers);
  const [rows, setRows] = useState<RfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [openRow, setOpenRow] = useState<RfRow | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setError("الرجاء تسجيل الدخول أولاً");
      setLoading(false);
      return;
    }
    fetchRf({ data: { employeeId: session.employeeId, role: session.role } })
      .then((data) => setRows((data as any as RfRow[]) || []))
      .catch((e) => setError(e?.message || "فشل تحميل البيانات"))
      .finally(() => setLoading(false));
  }, [fetchRf]);

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return rows;
    return rows.filter((r) =>
      COLUMNS.some((c) => String(r[c.key] ?? "").includes(s))
    );
  }, [rows, q]);

  const applyPatch = (id: string, patch: Partial<RfRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setOpenRow((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-primary">
        <div className="max-w-[1600px] mx-auto px-4 h-12 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#133E35]">
            <Wallet className="size-4 text-primary" />
            <span className="font-bold text-sm">محفظة عملاء العقار (RF)</span>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 gap-1">
            <Link to="/">
              <ArrowRight className="size-4" />
              رجوع
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-2 py-3 space-y-2">
        <div className="flex items-center justify-end gap-3 flex-wrap">
          <div className="text-xs font-bold text-[#133E35]">
            عدد السجلات: {filtered.length.toLocaleString("en-US")}
            {filtered.length !== rows.length && ` / ${rows.length.toLocaleString("en-US")}`}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث في كل الأعمدة..."
            className="pr-9 h-9"
          />
        </div>

        <div dir="ltr" className="border rounded-lg overflow-auto max-h-[calc(100vh-170px)] bg-white">
          {loading ? (
            <div dir="rtl" className="p-10 text-center text-sm text-muted-foreground">جاري تحميل المحفظة...</div>
          ) : error ? (
            <div dir="rtl" className="p-10 text-center text-sm text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div dir="rtl" className="p-10 text-center text-sm text-muted-foreground">لا توجد بيانات</div>
          ) : (
            <Table className="text-[10.5px] border-collapse table-auto w-max min-w-full">
              <TableHeader className="sticky top-0 bg-secondary z-10">
                <TableRow>
                  <TableHead className="w-[38px] text-center font-bold text-[#133E35] whitespace-nowrap border border-[#d4ddd9] bg-secondary">#</TableHead>
                  {COLUMNS.map((c) => (
                    <TableHead
                      key={String(c.key)}
                      className={`text-center font-bold text-[#133E35] whitespace-nowrap border border-[#d4ddd9] bg-secondary ${columnWidthClass(c.key)}`}
                    >
                      {c.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((r, i) => (
                  <TableRow key={r.id} className={`${i % 2 === 0 ? "bg-white" : "bg-[#f7f8f5]"} hover:bg-accent/30`}>
                    <TableCell className="tabular-nums text-muted-foreground border border-[#e5ebe8] text-center p-0.5 h-7">
                      {i + 1}
                    </TableCell>
                    {COLUMNS.map((c) => {
                      const value = r[c.key];
                      let display = "";
                      if (c.money) display = formatMoney(value as any);
                      else if (c.kind === "phone") display = formatPhone(value as any);
                      else display = value == null || value === "" ? "" : String(value);

                      const align = "text-center";
                      const baseCls = `${cellWrap(c.key)} text-[#133E35] border border-[#e5ebe8] ${align} ${columnWidthClass(c.key)}`;

                      if (c.key === "account_number") {
                        return (
                          <TableCell key={String(c.key)} dir="rtl" className={baseCls}>
                            <button
                              type="button"
                              className="text-primary hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
                              onClick={() => setOpenRow(r)}
                            >
                              {display}
                            </button>
                          </TableCell>
                        );
                      }

                      if (c.kind === "action" && display) {
                        return (
                          <TableCell key={String(c.key)} dir="rtl" className={baseCls}>
                            <span className="font-extrabold" style={actionStyle(display)}>{display}</span>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell
                          key={String(c.key)}
                          dir={c.kind === "phone" ? "ltr" : "rtl"}
                          className={`${baseCls} ${c.key === "payment" ? "font-bold text-emerald-700" : ""}`}
                        >
                          {display}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      <RfDetailDialog row={openRow} onClose={() => setOpenRow(null)} onPatched={applyPatch} />
    </div>
  );
}

function RfDetailDialog({
  row,
  onClose,
  onPatched,
}: {
  row: RfRow | null;
  onClose: () => void;
  onPatched: (id: string, patch: Partial<RfRow>) => void;
}) {
  const updateFn = useServerFn(updateRfCustomer);
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState<RfRow | null>(null);

  useEffect(() => {
    setLocal(row);
  }, [row]);

  if (!local) return null;

  const set = <K extends keyof RfRow>(k: K, v: RfRow[K]) => setLocal({ ...local, [k]: v } as RfRow);

  const save = async (patch: Partial<RfRow>) => {
    if (!local) return;
    setSaving(true);
    try {
      await updateFn({ data: { id: local.id, patch: patch as any } });
      onPatched(local.id, patch);
    } finally {
      setSaving(false);
    }
  };

  const phoneDigits = normalizePhone(local.phone) || "";
  const waHref = phoneDigits ? `https://wa.me/${phoneDigits}` : "";
  const telHref = phoneDigits ? `tel:+${phoneDigits}` : "";

  const hasRequest = !!(local.request_number || local.request_type);

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right text-[#133E35]">
            بيانات عميل العقار — {local.customer_name || local.account_number || ""}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-[12px] text-[#133E35]">
          <Info label="رقم الحساب" value={local.account_number} />
          <Info label="رقم الهوية" value={local.national_id} />
          <Info label="اسم العميل" value={local.customer_name} />
          <Info label="المنتج" value={local.product} />
          <Info label="نوع المنتج" value={local.product_type} />
          <Info label="مبلغ المديونية" value={formatMoney(local.amount)} />
          <Info label="اسم المحصل" value={local.agent_name} />
          <Info label="اسم المشرف" value={local.supervisor_name} />
          <Info label="مدينة العقار" value={local.property_city} />
          <Info label="نوع العقار" value={local.property_kind} />
          <Info label="وكالة تنفيذ إخلاء العقار" value={local.eviction_agency} />
          <Info label="أكشن الإخلاء" value={local.eviction_action} />
          <Info label="أكشن تنفيذ" value={local.execution_action} />
        </div>

        {/* رقم الجوال + Call/WhatsApp */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Field label="رقم الجوال" span={3}>
            <Input
              dir="ltr"
              value={local.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              onBlur={() => save({ phone: local.phone })}
              placeholder="05xxxxxxxx"
              className="h-9 text-[13px] text-left"
            />
          </Field>

          <Button
            variant="outline"
            className="h-11 gap-1 text-emerald-700 border-emerald-500"
            disabled={!waHref}
            onClick={() => waHref && window.open(waHref, "_blank")}
          >
            WhatsApp
          </Button>
          <Button
            variant="outline"
            className="h-11 gap-1 text-blue-700 border-blue-500"
            disabled={!telHref}
            onClick={() => telHref && (window.location.href = telHref)}
          >
            <Phone className="size-4" />
            اتصال
          </Button>
          <div className="h-11">
            <Select
              value={local.action ?? undefined}
              onValueChange={(v) => {
                set("action", v);
                void save({ action: v });
              }}
            >
              <SelectTrigger className="h-11 text-[12px] font-extrabold" style={actionStyle(local.action)}>
                <SelectValue placeholder="الاكشن" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {ACTION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} style={{ color: o.color }} className="font-extrabold text-[12px]">
                    {o.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* رقم القضية + التحقق من طلب تنفيذ (ناجز) */}
        <div className="mt-4 grid grid-cols-2 gap-2 items-end">
          <Field label="رقم القضية">
            <Input
              value={local.case_number ?? ""}
              onChange={(e) => set("case_number", e.target.value)}
              onBlur={() => save({ case_number: local.case_number })}
              className="h-9 text-[13px] text-right tabular-nums"
              inputMode="numeric"
            />
          </Field>
          <button
            type="button"
            onClick={() => window.open("https://najiz.sa/applications/iexecution/Inquiry", "_blank")}
            className="rounded-xl overflow-hidden p-0 border-0 bg-transparent hover:opacity-90 h-16"
          >
            <img src={najizVerifyBtn.url} alt="التحقق من طلب تنفيذ - ناجز" className="w-full h-full object-contain" />
          </button>
        </div>

        {/* يوجد طلبات: رقم الطلب + نوع الطلب */}
        <div className="mt-4 rounded-lg border border-[#d4ddd9] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#133E35]">يوجد طلبات</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                hasRequest ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {hasRequest ? "نعم" : "لا"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="رقم الطلب">
              <Input
                value={local.request_number ?? ""}
                onChange={(e) => set("request_number", e.target.value)}
                onBlur={() => save({ request_number: local.request_number })}
                className="h-9 text-[13px] text-right tabular-nums"
                inputMode="numeric"
              />
            </Field>
            <Field label="نوع الطلب">
              <Input
                value={local.request_type ?? ""}
                onChange={(e) => set("request_type", e.target.value)}
                onBlur={() => save({ request_type: local.request_type })}
                className="h-9 text-[13px] text-right"
                placeholder="نوع الطلب"
              />
            </Field>
          </div>
        </div>

        {/* السداد */}
        <div className="mt-4">
          <Field label="السداد">
            <Input
              dir="ltr"
              value={formatMoneyInput(String(local.payment ?? ""))}
              onChange={(e) => {
                const raw = parseMoneyInput(e.target.value);
                set("payment", raw === "" ? null : (Number(raw) as any));
              }}
              onBlur={() =>
                save({ payment: local.payment == null ? null : Number(local.payment) })
              }
              className="h-9 text-[13px] text-right tabular-nums font-bold text-emerald-700"
              inputMode="decimal"
            />
          </Field>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="size-4 ml-1" />
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[#e5ebe8] px-2 py-1.5 bg-[#f7f8f5]">
      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
      <div className="text-[12px] font-medium break-words">{value || "—"}</div>
    </div>
  );
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span ? `col-span-${span}` : undefined}>
      <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}
