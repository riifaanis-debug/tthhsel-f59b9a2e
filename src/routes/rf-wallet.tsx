import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function RfWalletPage() {
  const fetchRf = useServerFn(getRfCustomers);
  const [rows, setRows] = useState<RfRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    fetchRf({ data: { employeeId: session.employeeId, role: session.role } })
      .then((data) => setRows((data as any as RfRow[]) || []))
      .catch((e) => console.error("rf load", e))
      .finally(() => setLoading(false));
  }, [fetchRf]);

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const fmt = (v: any) => {
    const s = formatMoney(v);
    return s || (v == null || v === "" ? "" : String(v));
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b">
        <div className="max-w-[1400px] mx-auto px-4 h-12 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#133E35]">
            <Building2 className="size-4 text-primary" />
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

      <main className="max-w-[1400px] mx-auto px-4 py-4 space-y-4">
        <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between">
          <div className="text-sm font-bold text-[#133E35]">
            عدد الحسابات: {rows.length.toLocaleString("en-US")}
          </div>
          <div className="text-sm font-extrabold text-emerald-700 tabular-nums">
            {formatMoney(total)} <span className="text-xs font-medium">SAR</span>
          </div>
        </div>

        <div className="border rounded-lg overflow-auto bg-white">
          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">جاري التحميل...</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              لا توجد بيانات في محفظة العقار
            </div>
          ) : (
            <Table className="text-[11px]">
              <TableHeader className="bg-secondary">
                <TableRow>
                  {[
                    "رقم الحساب",
                    "مبلغ المديونية",
                    "Note",
                    "الاكشن",
                    "اسم المحصل",
                    "اسم المشرف",
                    "المنتج",
                    "اسم العميل",
                    "رقم الهوية",
                    "نوع المنتج",
                    "وكالة تنفيذ إخلاء العقار",
                    "أكشن الإخلاء",
                    "مدينة العقار",
                    "شقة - فيلا - أرض",
                    "أكشن تنفيذ",
                    "رقم القضية",
                    "السداد",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="text-right font-bold text-[#133E35] whitespace-nowrap"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell className="text-right tabular-nums">{r.account_number || ""}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.amount)}</TableCell>
                    <TableCell className="text-right">{r.note || ""}</TableCell>
                    <TableCell className="text-right">{r.action || ""}</TableCell>
                    <TableCell className="text-right">{r.agent_name || ""}</TableCell>
                    <TableCell className="text-right">{r.supervisor_name || ""}</TableCell>
                    <TableCell className="text-right">{r.product || ""}</TableCell>
                    <TableCell className="text-right font-medium">{r.customer_name || ""}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.national_id || ""}</TableCell>
                    <TableCell className="text-right">{r.product_type || ""}</TableCell>
                    <TableCell className="text-right">{r.eviction_agency || ""}</TableCell>
                    <TableCell className="text-right">{r.eviction_action || ""}</TableCell>
                    <TableCell className="text-right">{r.property_city || ""}</TableCell>
                    <TableCell className="text-right">{r.property_kind || ""}</TableCell>
                    <TableCell className="text-right">{r.execution_action || ""}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.case_number || ""}</TableCell>
                    <TableCell className="text-right tabular-nums font-bold text-emerald-700">
                      {fmt(r.payment)}
                    </TableCell>
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
