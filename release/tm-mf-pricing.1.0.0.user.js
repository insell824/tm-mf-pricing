// ==UserScript==
// @name         MF Pricing
// @namespace    tm-mf-pricing
// @version      1.0.0
// @description  Show Money Forward Cloud pricing plans on each service page
// @match        https://*.moneyforward.com/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

"use strict";
(() => {
  // src/logger.ts
  var PREFIX = "[tm-mf-pricing]";
  function debugLog(message) {
    if (false) {
      console.log(`${PREFIX} ${message}`);
    }
  }
  function logError(message, error) {
    console.error(`${PREFIX} ${message}`, error);
  }

  // src/pricing.ts
  var PRICING_URL = "https://biz.moneyforward.com/price/";
  var PLANS = [
    {
      id: "hitori",
      name: "ひとり法人",
      shortName: "H",
      annualBillingFee: "2,480円/月",
      monthlyBillingFee: "3,980円/月"
    },
    {
      id: "small",
      name: "スモールビジネス",
      shortName: "S",
      annualBillingFee: "4,480円/月",
      monthlyBillingFee: "5,980円/月"
    },
    {
      id: "business",
      name: "ビジネス",
      shortName: "B",
      annualBillingFee: "6,480円/月",
      monthlyBillingFee: "7,980円/月"
    }
  ];
  var NOT_AVAILABLE = "利用不可";
  var AVAILABLE = "利用可";
  var UNLIMITED = "無制限";
  function row(label, hitori, small, business) {
    return { label, values: { hitori, small, business } };
  }
  function sameRow(label, value) {
    return row(label, value, value, value);
  }
  function businessOnlyRow(label) {
    return row(label, NOT_AVAILABLE, NOT_AVAILABLE, AVAILABLE);
  }
  function accountRows(hitori, small, business, extraFee) {
    return [
      row("アカウント数", `${hitori}名`, `${small}名`, `${business}名`),
      row("アカウント追加", NOT_AVAILABLE, NOT_AVAILABLE, `${business + 1}名以上 ${extraFee}`)
    ];
  }
  var SERVICES = [
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
        businessOnlyRow("電帳法 優良電子帳簿")
      ],
      notes: ["ひとり法人プランの仕訳は1会計年度500件まで"]
    },
    {
      id: "invoice",
      name: "クラウド請求書",
      hosts: ["invoice.moneyforward.com"],
      rows: [
        ...accountRows(1, 3, 3, "300円/名"),
        row("APIによる見積書・請求書の作成", "上限100件", "上限100件", UNLIMITED),
        sameRow("郵送", "210円/通"),
        businessOnlyRow("一括郵送・一括メール送信")
      ]
    },
    {
      id: "expense",
      name: "クラウド経費",
      hosts: ["expense.moneyforward.com"],
      rows: accountRows(1, 3, 5, "500円/名"),
      notes: ["オペレーター入力（オプション）20円/件"]
    },
    {
      id: "payable",
      name: "クラウド債務支払",
      hosts: ["payable.moneyforward.com"],
      rows: [
        sameRow("アカウント数", UNLIMITED),
        row("支払依頼", "上限3件/月", "上限3件/月", "10件/月まで 11件以上 300円/件")
      ]
    },
    {
      id: "attendance",
      name: "クラウド勤怠",
      hosts: ["attendance.moneyforward.com"],
      rows: accountRows(1, 3, 5, "300円/名")
    },
    {
      id: "payroll",
      name: "クラウド給与",
      hosts: ["payroll.moneyforward.com"],
      rows: accountRows(1, 3, 5, "300円/名")
    },
    {
      id: "tax-adjustment",
      name: "クラウド年末調整",
      hosts: ["tax-adjustment.moneyforward.com"],
      rows: accountRows(1, 3, 5, "100円/名")
    },
    {
      id: "social-insurance",
      name: "クラウド社会保険",
      hosts: ["social-insurance.moneyforward.com"],
      rows: accountRows(1, 3, 5, "100円/名")
    },
    {
      id: "mynumber",
      name: "クラウドマイナンバー",
      hosts: ["mynumber.moneyforward.com"],
      rows: accountRows(1, 3, 5, "100円/名")
    },
    {
      id: "employee",
      name: "クラウド人事管理",
      hosts: ["employee.moneyforward.com"],
      rows: accountRows(1, 3, 10, "600円/名")
    },
    {
      id: "contract",
      name: "クラウド契約",
      hosts: ["contract.moneyforward.com"],
      rows: [...accountRows(1, 1, 3, "900円/名"), sameRow("契約送信料・保管料", "0円")]
    },
    {
      id: "box",
      name: "クラウドBox",
      hosts: ["box.moneyforward.com"],
      rows: [row("ファイル保存件数", "上限1,000件", "上限1,000件", UNLIMITED)]
    }
  ];
  function findServiceByHost(hostname) {
    return SERVICES.find((service) => service.hosts.includes(hostname));
  }

  // src/ui.ts
  var ROOT_ID = "tm-mf-pricing-root";
  var STYLES = `
:host {
  all: initial;
}

* {
  box-sizing: border-box;
}

.bar,
.dialog {
  font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", Meiryo, sans-serif;
  color: #1f2937;
}

.bar {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: stretch;
  background: #1f2937;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.2);
  overflow: hidden;
}

.bar button {
  appearance: none;
  border: none;
  margin: 0;
  background: transparent;
  color: #ffffff;
  font: inherit;
  font-size: 12px;
  line-height: 1;
  padding: 6px 10px;
  cursor: pointer;
}

.bar button:hover {
  background: rgb(255 255 255 / 0.15);
}

.bar .dismiss {
  border-left: 1px solid rgb(255 255 255 / 0.25);
  padding: 6px 8px;
}

.dialog {
  width: min(760px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  padding: 0;
  border: none;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.3);
  background: #ffffff;
}

.dialog::backdrop {
  background: rgb(0 0 0 / 0.4);
}

.content {
  padding: 20px 24px 24px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.close {
  appearance: none;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 22px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.close:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
  vertical-align: middle;
}

tbody tr:last-child th,
tbody tr:last-child td {
  border-bottom: none;
}

thead th {
  background: #f3f4f6;
  font-weight: 700;
  white-space: nowrap;
}

.plan-short {
  display: inline-block;
  margin-left: 4px;
  color: #6b7280;
  font-weight: 400;
}

tbody th {
  text-align: left;
  font-weight: 600;
  background: #fafafa;
  white-space: nowrap;
}

tbody tr.fee-row td {
  font-weight: 600;
}

td.unavailable {
  color: #9ca3af;
}

.notes {
  margin: 12px 0 0;
  padding-left: 18px;
  font-size: 12px;
  color: #4b5563;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  font-size: 12px;
  color: #6b7280;
}

.footer a {
  color: #2563eb;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}
`;
  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (text !== void 0) {
      element.textContent = text;
    }
    return element;
  }
  function createButton(className, text, ariaLabel) {
    const button = createElement("button", className, text);
    button.type = "button";
    button.setAttribute("aria-label", ariaLabel);
    return button;
  }
  function createRow(label, values, className) {
    const tr = createElement("tr", className);
    const th = createElement("th", void 0, label);
    th.scope = "row";
    tr.append(th);
    for (const plan of PLANS) {
      const value = values[plan.id];
      tr.append(createElement("td", value === NOT_AVAILABLE ? "unavailable" : void 0, value));
    }
    return tr;
  }
  function createTable(service) {
    const headRow = createElement("tr");
    headRow.append(createElement("th", void 0, "項目"));
    for (const plan of PLANS) {
      const th = createElement("th", void 0, plan.name);
      th.scope = "col";
      th.append(createElement("span", "plan-short", `(${plan.shortName})`));
      headRow.append(th);
    }
    const annualFees = Object.fromEntries(PLANS.map((plan) => [plan.id, plan.annualBillingFee]));
    const monthlyFees = Object.fromEntries(PLANS.map((plan) => [plan.id, plan.monthlyBillingFee]));
    const tbody = createElement("tbody");
    tbody.append(
      createRow("基本料金（年払い）", annualFees, "fee-row"),
      createRow("基本料金（月払い）", monthlyFees, "fee-row"),
      ...service.rows.map((row2) => createRow(row2.label, row2.values))
    );
    const thead = createElement("thead");
    thead.append(headRow);
    const table = createElement("table");
    table.append(thead, tbody);
    const wrapper = createElement("div", "table-wrapper");
    wrapper.append(table);
    return wrapper;
  }
  function createDialog(service) {
    const dialog = createElement("dialog", "dialog");
    dialog.setAttribute("aria-label", `${service.name} 料金プラン`);
    const closeButton = createButton("close", "×", "閉じる");
    closeButton.addEventListener("click", () => dialog.close());
    const header = createElement("div", "header");
    header.append(createElement("h2", "title", `🐒 ${service.name} 料金プラン`), closeButton);
    const content = createElement("div", "content");
    content.append(header, createTable(service));
    if (service.notes && service.notes.length > 0) {
      const notes = createElement("ul", "notes");
      notes.append(...service.notes.map((note) => createElement("li", void 0, note)));
      content.append(notes);
    }
    const link = createElement("a", void 0, "料金プランの詳細（公式サイト）");
    link.href = PRICING_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const footer = createElement("div", "footer");
    footer.append(createElement("span", void 0, "金額はすべて税抜"), link);
    content.append(footer);
    dialog.append(content);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
    return dialog;
  }
  function mountPricingButton(service) {
    if (document.getElementById(ROOT_ID)) {
      debugLog("Pricing button is already mounted");
      return;
    }
    const root = createElement("div");
    root.id = ROOT_ID;
    const shadow = root.attachShadow({ mode: "open" });
    const style = createElement("style");
    style.textContent = STYLES;
    const dialog = createDialog(service);
    const openButton = createButton("open", "🐒 料金", `${service.name}の料金プランを表示`);
    openButton.addEventListener("click", () => {
      dialog.showModal();
      debugLog(`Opened pricing dialog for ${service.id}`);
    });
    const dismissButton = createButton("dismiss", "×", "料金ボタンを非表示");
    dismissButton.addEventListener("click", () => {
      root.remove();
      debugLog("Pricing button dismissed until reload");
    });
    const bar = createElement("div", "bar");
    bar.append(openButton, dismissButton);
    shadow.append(style, bar, dialog);
    document.body.append(root);
    debugLog(`Mounted pricing button for ${service.id}`);
  }

  // src/main.ts
  function main() {
    const { hostname } = location;
    const service = findServiceByHost(hostname);
    debugLog(`host=${hostname} matched=${service?.id ?? "none"}`);
    if (!service) {
      return;
    }
    mountPricingButton(service);
  }
  try {
    main();
  } catch (error) {
    logError("Failed to initialize", error);
  }
})();
