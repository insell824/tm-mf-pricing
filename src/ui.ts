import { debugLog } from "./logger";
import { NOT_AVAILABLE, PLANS, PRICING_URL, type PlanValues, type Service } from "./pricing";

const ROOT_ID = "tm-mf-pricing-root";

const STYLES = `
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

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function createButton(className: string, text: string, ariaLabel: string): HTMLButtonElement {
  const button = createElement("button", className, text);
  button.type = "button";
  button.setAttribute("aria-label", ariaLabel);
  return button;
}

function createRow(label: string, values: PlanValues, className?: string): HTMLTableRowElement {
  const tr = createElement("tr", className);
  const th = createElement("th", undefined, label);
  th.scope = "row";
  tr.append(th);
  for (const plan of PLANS) {
    const value = values[plan.id];
    tr.append(createElement("td", value === NOT_AVAILABLE ? "unavailable" : undefined, value));
  }
  return tr;
}

function createTable(service: Service): HTMLElement {
  const headRow = createElement("tr");
  headRow.append(createElement("th", undefined, "項目"));
  for (const plan of PLANS) {
    const th = createElement("th", undefined, plan.name);
    th.scope = "col";
    th.append(createElement("span", "plan-short", `(${plan.shortName})`));
    headRow.append(th);
  }

  const annualFees = Object.fromEntries(PLANS.map((plan) => [plan.id, plan.annualBillingFee])) as PlanValues;
  const monthlyFees = Object.fromEntries(PLANS.map((plan) => [plan.id, plan.monthlyBillingFee])) as PlanValues;

  const tbody = createElement("tbody");
  tbody.append(
    createRow("基本料金（年払い）", annualFees, "fee-row"),
    createRow("基本料金（月払い）", monthlyFees, "fee-row"),
    ...service.rows.map((row) => createRow(row.label, row.values)),
  );

  const thead = createElement("thead");
  thead.append(headRow);
  const table = createElement("table");
  table.append(thead, tbody);

  const wrapper = createElement("div", "table-wrapper");
  wrapper.append(table);
  return wrapper;
}

function createDialog(service: Service): HTMLDialogElement {
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
    notes.append(...service.notes.map((note) => createElement("li", undefined, note)));
    content.append(notes);
  }

  const link = createElement("a", undefined, "料金プランの詳細（公式サイト）");
  link.href = PRICING_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const footer = createElement("div", "footer");
  footer.append(createElement("span", undefined, "金額はすべて税抜"), link);
  content.append(footer);

  dialog.append(content);

  // The dialog itself has no padding, so a click that targets it landed on the backdrop.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  return dialog;
}

/** Adds the pricing button to the top of the page. Styles are isolated in a shadow root. */
export function mountPricingButton(service: Service): void {
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
