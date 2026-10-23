// Prices are tax-excluded, taken from https://biz.moneyforward.com/price/.

export const PRICING_URL = "https://biz.moneyforward.com/price/";

export type PlanId = "hitori" | "small" | "business";

export interface Plan {
  id: PlanId;
  name: string;
  shortName: string;
  annualBillingFee: string;
  monthlyBillingFee: string;
}

export type PlanValues = Readonly<Record<PlanId, string>>;

export interface PricingRow {
  label: string;
  values: PlanValues;
}

export interface Service {
  id: string;
  name: string;
  hosts: readonly string[];
  rows: readonly PricingRow[];
  notes?: readonly string[];
}

export const PLANS: readonly Plan[] = [
  {
    id: "hitori",
    name: "ひとり法人",
    shortName: "H",
    annualBillingFee: "2,480円/月",
    monthlyBillingFee: "3,980円/月",
  },
  {
    id: "small",
    name: "スモールビジネス",
    shortName: "S",
    annualBillingFee: "4,480円/月",
    monthlyBillingFee: "5,980円/月",
  },
  {
    id: "business",
    name: "ビジネス",
    shortName: "B",
    annualBillingFee: "6,480円/月",
    monthlyBillingFee: "7,980円/月",
  },
];

export const NOT_AVAILABLE = "利用不可";
const AVAILABLE = "利用可";
const UNLIMITED = "無制限";

function row(label: string, hitori: string, small: string, business: string): PricingRow {
  return { label, values: { hitori, small, business } };
}

function sameRow(label: string, value: string): PricingRow {
  return row(label, value, value, value);
}

function businessOnlyRow(label: string): PricingRow {
  return row(label, NOT_AVAILABLE, NOT_AVAILABLE, AVAILABLE);
}

/** Included accounts per plan, plus the per-account fee that only the business plan offers. */
function accountRows(hitori: number, small: number, business: number, extraFee: string): PricingRow[] {
  return [
    row("アカウント数", `${hitori}名`, `${small}名`, `${business}名`),
    row("アカウント追加", NOT_AVAILABLE, NOT_AVAILABLE, `${business + 1}名以上 ${extraFee}`),
  ];
}

// Only invoice.moneyforward.com is verified. The other hosts are guesses to be checked with the debug log.
export const SERVICES: readonly Service[] = [
  {
    id: "accounting",
    name: "クラウド会計",
    hosts: ["accounting.moneyforward.com"],
    rows: [
      ...accountRows(1, 3, 3, "300円/名"),
      row("AI-OCRから入力", "上限30件/月", "上限60件/月", "月101件以上 20円/件"),
      row("部門登録", "2部門まで", "2部門まで", UNLIMITED),
      row("部門階層", "1階層まで", "1階層まで", "2階層まで"),
      businessOnlyRow("振込FBデータ作成"),
      businessOnlyRow("帳簿残高と口座残高の突合"),
      businessOnlyRow("消費税申告書作成"),
      businessOnlyRow("電帳法 優良電子帳簿"),
    ],
    notes: ["ひとり法人プランの仕訳は1会計年度500件まで"],
  },
  {
    id: "invoice",
    name: "クラウド請求書",
    hosts: ["invoice.moneyforward.com"],
    rows: [
      ...accountRows(1, 3, 3, "300円/名"),
      row("APIによる見積書・請求書の作成", "上限100件", "上限100件", UNLIMITED),
      sameRow("郵送", "210円/通"),
      businessOnlyRow("一括郵送・一括メール送信"),
    ],
  },
  {
    id: "expense",
    name: "クラウド経費",
    hosts: ["expense.moneyforward.com"],
    rows: accountRows(1, 3, 5, "500円/名"),
    notes: ["オペレーター入力（オプション）20円/件"],
  },
  {
    id: "payable",
    name: "クラウド債務支払",
    hosts: ["payable.moneyforward.com"],
    rows: [
      sameRow("アカウント数", UNLIMITED),
      row("支払依頼", "上限3件/月", "上限3件/月", "10件/月まで 11件以上 300円/件"),
    ],
  },
  {
    id: "attendance",
    name: "クラウド勤怠",
    hosts: ["attendance.moneyforward.com"],
    rows: accountRows(1, 3, 5, "300円/名"),
  },
  {
    id: "payroll",
    name: "クラウド給与",
    hosts: ["payroll.moneyforward.com"],
    rows: accountRows(1, 3, 5, "300円/名"),
  },
  {
    id: "tax-adjustment",
    name: "クラウド年末調整",
    hosts: ["tax-adjustment.moneyforward.com"],
    rows: accountRows(1, 3, 5, "100円/名"),
  },
  {
    id: "social-insurance",
    name: "クラウド社会保険",
    hosts: ["social-insurance.moneyforward.com"],
    rows: accountRows(1, 3, 5, "100円/名"),
  },
  {
    id: "mynumber",
    name: "クラウドマイナンバー",
    hosts: ["mynumber.moneyforward.com"],
    rows: accountRows(1, 3, 5, "100円/名"),
  },
  {
    id: "employee",
    name: "クラウド人事管理",
    hosts: ["employee.moneyforward.com"],
    rows: accountRows(1, 3, 10, "600円/名"),
  },
  {
    id: "contract",
    name: "クラウド契約",
    hosts: ["contract.moneyforward.com"],
    rows: [...accountRows(1, 1, 3, "900円/名"), sameRow("契約送信料・保管料", "0円")],
  },
  {
    id: "box",
    name: "クラウドBox",
    hosts: ["box.moneyforward.com"],
    rows: [row("ファイル保存件数", "上限1,000件", "上限1,000件", UNLIMITED)],
  },
];

export function findServiceByHost(hostname: string): Service | undefined {
  return SERVICES.find((service) => service.hosts.includes(hostname));
}
