import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, Wallet } from "lucide-react";
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
import { useServerFn } from "@tanstack/react-start";
import { getRfCustomers } from "@/lib/rf-wallet.functions";
import { getSession } from "@/components/LoginGate";
import { formatMoney } from "@/lib/wallet-types";

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
  product_type: string | null;
  eviction_agency: string | null;
  eviction_action: string | null;
  property_city: string | null;
  property_kind: string | null;
  execution_action: string | null;
  case_number: string | null;
  payment: number | null;
};

const COLUMNS: { key: keyof RfRow; label: string; money?: boolean; number?: boolean }[] = [
  { key: "account_number", label: "رقم الحساب", number: true },
  { key: "amount", label: "مبلغ المديونية", money: true },
  { key: "note", label: "Note" },
  { key: "action", label: "الاكشن" },
  { key: "agent_name", label: "اسم المحصل" },
  { key: "supervisor_name", label: "اسم المشرف" },
  { key: "product", label: "المنتج" },
  { key: "customer_name", label: "اسم العميل" },
  { key: "national_id", label: "رقم الهوية", number: true },
  { key: "product_type", label: "نوع المنتج" },
  { key: "eviction_agency", label: "وكالة تنفيذ إخلاء العقار" },
  { key: "eviction_action", label: "أكشن الإخلاء" },
  { key: "property_city", label: "مدينة العقار" },
  { key: "property_kind", label: "شقة - فيلا - أرض" },
  { key: "execution_action", label: "أكشن تنفيذ" },
  { key: "case_number", label: "رقم القضية", number: true },
  { key: "payment", label: "السداد", money: true },
];

function columnWidthClass(key: keyof RfRow): string {
  switch (key) {
    case "account_number":
      return "w-[145px] min-w-[145px] max-w-[145px]";
    case "amount":
      return "w-[120px] min-w-[120px] max-w-[120px]";
    case "note":
      return "w-[82px] min-w-[82px] max-w-[82px]";
    case "action":
      return "w-[180px] min-w-[180px] max-w-[180px]";
    case "agent_name":
      return "w-[320px] min-w-[320px] max-w-[320px]";
    case "supervisor_name":
      return "w-[320px] min-w-[320px] max-w-[320px]";
    case "product":
      return "w-[120px] min-w-[120px] max-w-[120px]";
    case "customer_name":
      return "w-[280px] min-w-[280px] max-w-[280px]";
    case "national_id":
      return "w-[135px] min-w-[135px] max-w-[135px]";
    case "product_type":
      return "w-[120px] min-w-[120px] max-w-[120px]";
    case "eviction_agency":
      return "w-[180px] min-w-[180px] max-w-[180px]";
    case "eviction_action":
      return "w-[180px] min-w-[180px] max-w-[180px]";
    case "property_city":
      return "w-[120px] min-w-[120px] max-w-[120px]";
    case "property_kind":
      return "w-[120px] min-w-[120px] max-w-[120px]";
    case "execution_action":
      return "w-[180px] min-w-[180px] max-w-[180px]";
    case "case_number":
      return "w-[135px] min-w-[135px] max-w-[135px]";
    case "payment":
      return "w-[120px] min-w-[120px] max-w-[120px]";
    default:
      return "w-[120px] min-w-[120px] max-w-[120px]";
  }
}

function cellTextWrapClass(key: keyof RfRow): string {
  switch (key) {
    case "customer_name":
    case "agent_name":
    case "supervisor_name":
    case "eviction_agency":
    case "eviction_action":
    case "property_city":
    case "execution_action":
      return "whitespace-normal break-words leading-relaxed";
    default:
      return "whitespace-nowrap";
  }
}

function RfWalletPage() {
  const fetchRf = useServerFn(getRfCustomers);
  const [rows, setRows] = useState<RfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setError("الرجاء تسجيل الدخول أولاً");
      setLoading(false);
      return;
    }
    fetchRf({ data: { employeeId: session.employeeId, role: session.role } })
      .then((data) => setRows((data as any as RfRow[]) || []))
      .catch((e) => {
        console.error("rf load", e);
        setError(e?.message || "فشل تحميل البيانات");
      })
      .finally(() => setLoading(false));
  }, [fetchRf]);

  const total = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [rows]
  );

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return rows;
    return rows.filter((r) =>
      COLUMNS.some((c) => {
        const v = String(r[c.key] ?? "");
        return v.includes(s);
      })
    );
  }, [rows, q]);

  const fmt = (v: any) => {
    const s = formatMoney(v);
    return s || (v == null || v === "" ? "" : String(v));
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
            <div dir="rtl" className="p-10 text-center text-sm text-muted-foreground">
              جاري تحميل المحفظة...
            </div>
          ) : error ? (
            <div dir="rtl" className="p-10 text-center text-sm text-red-600">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div dir="rtl" className="p-10 text-center text-sm text-muted-foreground">
              لا توجد بيانات
            </div>
          ) : (
            <Table className="text-[10.5px] border-collapse table-auto w-max min-w-full">
              <TableHeader className="sticky top-0 bg-secondary z-10">
                <TableRow>
                  <TableHead className="w-[38px] text-center font-bold text-[#133E35] whitespace-nowrap border border-[#d4ddd9] bg-secondary">
                    #
                  </TableHead>

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
                  <TableRow
                    key={r.id}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-[#f7f8f5]"} hover:bg-accent/30`}
                  >
                    <TableCell className="tabular-nums text-muted-foreground border border-[#e5ebe8] text-center p-0.5 h-7">
                      {i + 1}
                    </TableCell>

                    {COLUMNS.map((c) => {
                      const value = r[c.key];
                      const isMoney = c.money;
                      const isNumber = c.number;
                      const align = isMoney || isNumber ? "text-right" : "text-center";
                      const display = isMoney ? fmt(value) : value == null || value === "" ? "" : String(value);

                      return (
                        <TableCell
                          key={String(c.key)}
                          dir="rtl"
                          className={`${cellTextWrapClass(c.key)} text-[#133E35] border border-[#e5ebe8] ${align} ${columnWidthClass(c.key)} ${c.key === "payment" ? "font-bold text-emerald-700" : ""}`}
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
    </div>
  );
}
