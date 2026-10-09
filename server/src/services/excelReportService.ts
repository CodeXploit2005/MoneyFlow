import ExcelJS from 'exceljs';

const moneyFormat = '#,##0 "₫";[Red](#,##0) "₫";0 "₫"';
const navy = '0C304A';
const green = '008675';
const red = 'DC2626';
const monthKey = (date: any) => new Date(new Date(date).getTime() + 7 * 3600000).toISOString().slice(0, 7);
// Store the Vietnamese calendar day as an Excel date, independently of the server timezone.
const excelDate = (date: any) => new Date(`${new Date(new Date(date).getTime() + 7 * 3600000).toISOString().slice(0, 10)}T00:00:00Z`);

export function summarizeTransactions(transactions: any[], year?: number) {
  const months = new Map<string, any>();
  if (year) for (let m = 1; m <= 12; m++) months.set(`${year}-${String(m).padStart(2, '0')}`, { income: 0, expense: 0 });
  let income = 0, expense = 0;
  for (const t of transactions) {
    const key = monthKey(t.date);
    if (year && !key.startsWith(`${year}-`)) continue;
    const item = months.get(key) || { income: 0, expense: 0 };
    item[t.type] += t.amount;
    months.set(key, item);
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, net: income - expense, months: [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, t]) => ({ month, ...t, net: t.income - t.expense })) };
}

export function buildExcelReport({ transactions, sales, period, year }: { transactions: any[]; sales: any[]; period: string; year?: number }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MoneyFlow';
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;
  workbook.views = [{ x: 0, y: 0, width: 16000, height: 10000, firstSheet: 0, activeTab: 0, visibility: 'visible' }];
  const stamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  function table(name: string, headers: string[], widths: number[], rows: any[][], money: number[] = [], totals: number[] = money) {
    // Short reports open at the beginning, with no frozen dashboard hiding data.
    const freeze = name !== 'Tổng quan' && rows.length > 20;
    const sheet = workbook.addWorksheet(name, {
      properties: { tabColor: { argb: green }, defaultRowHeight: 24 },
      views: [freeze
        ? { state: 'frozen', ySplit: 9, topLeftCell: 'A10', activeCell: 'A10', showGridLines: false, zoomScale: headers.length > 8 ? 85 : 100 }
        : { state: 'normal', activeCell: 'A1', showGridLines: false, zoomScale: headers.length > 8 ? 85 : 100 }]
    });
    sheet.columns = widths.map(width => ({ width }));
    sheet.mergeCells(1, 1, 1, headers.length);
    sheet.getCell('A1').value = `MoneyFlow | BÁO CÁO ${name.toUpperCase()}`;
    sheet.getRow(1).height = 48;
    sheet.getCell('A1').font = { name: 'Segoe UI', size: 20, bold: true, color: { argb: 'FFFFFF' } };
    sheet.getCell('A1').alignment = { vertical: 'middle', indent: 1, wrapText: true };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: navy } };
    sheet.mergeCells(2, 1, 2, headers.length);
    sheet.getCell('A2').value = `${period} • Xuất lúc ${stamp} • Đơn vị: VNĐ`;
    sheet.getRow(2).height = 28;
    sheet.getCell('A2').font = { name: 'Segoe UI', size: 11, color: { argb: navy } };
    sheet.getCell('A2').alignment = { vertical: 'middle', indent: 1, wrapText: true };
    sheet.mergeCells(3, 1, 3, headers.length);
    sheet.getCell('A3').value = name === 'Tổng quan' ? 'Thu chi theo ngày giao dịch; đơn bán theo ngày bán. Lãi gộp đơn bán = tiền bán − giá vốn; chênh lệch thu chi = tổng thu − tổng chi (đã gồm giá vốn).' : name === 'Khách hàng' ? 'Tổng hợp khách có đơn trong kỳ; đã thu và còn nợ là trạng thái hiện tại của các đơn này.' : 'Dữ liệu trong kỳ báo cáo. Các đơn đã hủy và giao dịch đã xóa được loại khỏi báo cáo.';
    sheet.getRow(3).height = 38;
    sheet.getCell('A3').alignment = { wrapText: true, vertical: 'middle', indent: 1 };
    sheet.getCell('A3').font = { name: 'Segoe UI', size: 11, color: { argb: '64748B' } };
    sheet.getRow(4).height = 16;
    // Four compact KPI cards share the table's column grid without merging any data cells.
    const sum = (col: number) => rows.reduce((value, row) => value + (Number(row[col - 1]) || 0), 0);
    const kpis: [string, number, number?][] = name === 'Khách hàng'
      ? [['KHÁCH HÀNG', rows.length], ['TỔNG TIỀN MUA', sum(4), 4], ['ĐÃ THU', sum(5), 5], ['CÒN NỢ', sum(6), 6]]
      : name === 'Đơn bán'
      ? [['ĐƠN BÁN', rows.length], ['TIỀN BÁN', sum(7), 7], ['GIÁ VỐN', sum(8), 8], ['LÃI GỘP', sum(9), 9]]
      : name === 'Sản phẩm'
      ? [['SẢN PHẨM', rows.length], ['TIỀN BÁN', sum(4), 4], ['GIÁ VỐN', sum(5), 5], ['LÃI GỘP', sum(6), 6]]
      : name === 'Thu chi'
      ? [['GIAO DỊCH', rows.length], ['TỔNG THU', sum(4), 4], ['TỔNG CHI', sum(5), 5], ['CHÊNH LỆCH', sum(4) - sum(5), -1]]
      : [['ĐƠN BÁN', sales.length], ['TỔNG THU', sum(2), 2], ['TỔNG CHI', sum(3), 3], ['CHÊNH LỆCH', sum(4), 4]];
    let firstCol = 1;
    const totalWidth = widths.reduce((a, b) => a + b, 0);
    let usedWidth = 0;
    kpis.forEach(([label, value, sourceCol], index) => {
      let lastCol = firstCol;
      while (lastCol < headers.length - (3 - index) && usedWidth + widths.slice(firstCol - 1, lastCol).reduce((a, b) => a + b, 0) < totalWidth * (index + 1) / 4) lastCol++;
      if (index === 3) lastCol = headers.length;
      if (lastCol > firstCol) {
        sheet.mergeCells(5, firstCol, 5, lastCol);
        sheet.mergeCells(6, firstCol, 6, lastCol);
      }
      const labelCell = sheet.getCell(5, firstCol), valueCell = sheet.getCell(6, firstCol);
      labelCell.value = label;
      labelCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: green } };
      labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
      const totalRow = 10 + rows.length;
      valueCell.value = sourceCol && sourceCol > 0
        ? { formula: `${sheet.getColumn(sourceCol).letter}${totalRow}`, result: value }
        : sourceCol === -1 ? { formula: `D${totalRow}-E${totalRow}`, result: value } : value;
      valueCell.numFmt = sourceCol ? moneyFormat : '#,##0';
      const cardWidth = widths.slice(firstCol - 1, lastCol).reduce((a, b) => a + b, 0);
      const displayLength = value.toLocaleString('vi-VN').length + (sourceCol ? 2 : 0);
      valueCell.font = { name: 'Segoe UI', size: Math.max(10, Math.min(19, Math.floor((cardWidth * 7 - 16) / (displayLength * 0.7)))), bold: true, color: { argb: navy } };
      valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E3F5F1' } };
      valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
      usedWidth += widths.slice(firstCol - 1, lastCol).reduce((a, b) => a + b, 0);
      firstCol = lastCol + 1;
    });
    sheet.getRow(5).height = 28;
    sheet.getRow(6).height = 44;
    sheet.getRow(7).height = 20;
    sheet.mergeCells(8, 1, 8, headers.length);
    sheet.getCell('A8').value = name === 'Tổng quan' ? 'TỔNG HỢP THU CHI THEO THÁNG' : `CHI TIẾT ${name.toUpperCase()}`;
    sheet.getCell('A8').font = { name: 'Segoe UI', bold: true, size: 12, color: { argb: navy } };
    sheet.getCell('A8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DDF4EC' } };
    sheet.getCell('A8').alignment = { vertical: 'middle', indent: 1 };
    sheet.getRow(8).height = 32;
    const header = sheet.getRow(9);
    header.values = headers;
    header.height = 36;
    header.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: green } };
      cell.font = { name: 'Segoe UI', bold: true, size: 11, color: { argb: 'FFFFFF' } };
      cell.alignment = { wrapText: true, vertical: 'middle', indent: 1 };
    });
    rows.forEach((values, index) => {
      const row = sheet.addRow(values);
      row.height = Math.max(30, ...values.map((v, i) => typeof v === 'string' ? Math.ceil(v.length / Math.max(widths[i] - 4, 1)) * 16 + 10 : 30));
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.font = { name: 'Segoe UI', size: 11, color: { argb: navy } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 ? 'EDF5FA' : 'F8FBFD' } };
        cell.border = { bottom: { style: 'hair', color: { argb: 'DCE7EF' } } };
        cell.alignment = { wrapText: true, vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'right' : 'left', indent: 1 };
        if (money.includes(col)) cell.numFmt = moneyFormat;
        if (cell.value instanceof Date) cell.numFmt = 'dd/mm/yyyy';
      });
    });
    sheet.autoFilter = { from: { row: 9, column: 1 }, to: { row: Math.max(9, 9 + rows.length), column: headers.length } };
    const total = sheet.addRow(['TỔNG CỘNG']);
    total.height = 32;
    totals.forEach(col => {
      const letter = sheet.getColumn(col).letter;
      total.getCell(col).value = rows.length ? { formula: `SUBTOTAL(109,${letter}10:${letter}${9 + rows.length})`, result: rows.reduce((sum, row) => sum + (Number(row[col - 1]) || 0), 0) } : 0;
      total.getCell(col).numFmt = money.includes(col) ? moneyFormat : '#,##0';
    });
    for (let col = 1; col <= headers.length; col++) {
      total.getCell(col).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: navy } };
      total.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
      total.getCell(col).alignment = { vertical: 'middle', horizontal: col === 1 ? 'left' : 'right', indent: 1 };
    }
    sheet.addRow([]).height = 10;
    const foot = sheet.addRow([name === 'Khách hàng' ? 'Đã thu và còn nợ phản ánh trạng thái hiện tại của các đơn trong kỳ.' : `MoneyFlow • ${period} • Xuất báo cáo: ${stamp}`]);
    sheet.mergeCells(foot.number, 1, foot.number, headers.length);
    foot.height = 26;
    foot.getCell(1).font = { name: 'Segoe UI', size: 9, color: { argb: '64748B' } };
    foot.getCell(1).alignment = { vertical: 'middle', wrapText: true, indent: 1 };
    sheet.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '8:9', printArea: `A1:${sheet.getColumn(headers.length).letter}${foot.number}`, margins: { left: 0.25, right: 0.25, top: 0.35, bottom: 0.35, header: 0.15, footer: 0.15 } };
    sheet.headerFooter.oddFooter = '&LMoneyFlow&RTrang &P / &N';
    return sheet;
  }

  const summary = summarizeTransactions(transactions, year);
  const overview = table('Tổng quan', ['Tháng', 'Tổng thu', 'Tổng chi (gồm giá vốn)', 'Chênh lệch thu chi'], [36, 44, 44, 44], summary.months.map(m => [m.month.split('-').reverse().join('/'), m.income, m.expense, m.net]), [2, 3, 4]);
  overview.addRow([]);
  const salesSection = overview.addRow(['KẾT QUẢ ĐƠN BÁN TRONG KỲ']);
  overview.mergeCells(salesSection.number, 1, salesSection.number, 4);
  salesSection.height = 32;
  salesSection.getCell(1).font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: navy } };
  salesSection.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DDF4EC' } };
  salesSection.getCell(1).alignment = { indent: 1, vertical: 'middle' };
  const metrics: [string, number][] = [
    ['Số đơn bán trong kỳ', sales.length],
    ['Tiền bán theo đơn', sales.reduce((sum, s) => sum + s.price * s.quantity, 0)],
    ['Giá vốn theo đơn', sales.reduce((sum, s) => sum + s.cost * s.quantity, 0)],
    ['Lãi gộp theo đơn', sales.reduce((sum, s) => sum + (s.price - s.cost) * s.quantity, 0)]
  ];
  const explanations = ['Các đơn chưa hủy, có ngày bán trong kỳ báo cáo.', 'Tổng giá bán × số lượng; có thể bao gồm phần khách chưa thanh toán.', 'Tổng giá vốn × số lượng của các đơn trong kỳ.', 'Tiền bán trừ giá vốn; chưa trừ chi phí vận hành và bảo hành.'];
  metrics.forEach(([label, value], i) => {
    const row = overview.addRow([label, value, explanations[i]]);
    overview.mergeCells(row.number, 3, row.number, 4);
    row.height = 34;
    for (let col = 1; col <= 4; col++) {
      row.getCell(col).font = { name: 'Segoe UI', size: 11, bold: col < 3, color: { argb: col < 3 ? navy : '64748B' } };
      row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 ? 'EDF5FA' : 'F8FBFD' } };
      row.getCell(col).alignment = { vertical: 'middle', wrapText: true, indent: 1, horizontal: col === 2 ? 'right' : 'left' };
    }
    row.getCell(2).numFmt = i ? moneyFormat : '#,##0';
  });
  overview.addRow([]).height = 16;
  const navigation = overview.addRow(['MỞ CHI TIẾT', 'Đơn bán', 'Khách hàng', 'Sản phẩm']);
  navigation.height = 32;
  for (let col = 2; col <= 4; col++) {
    const tab = String(navigation.getCell(col).value);
    navigation.getCell(col).value = { text: `Xem ${tab.toLowerCase()} →`, hyperlink: `#'${tab}'!A1` };
    navigation.getCell(col).font = { name: 'Segoe UI', size: 11, bold: true, underline: true, color: { argb: green } };
    navigation.getCell(col).alignment = { vertical: 'middle', indent: 1 };
  }
  navigation.getCell(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: navy } };
  const ledgerLink = overview.addRow(['SỔ THU CHI', { text: 'Xem toàn bộ giao dịch →', hyperlink: "#'Thu chi'!A1" }]);
  ledgerLink.height = 30;
  ledgerLink.getCell(2).font = { name: 'Segoe UI', size: 11, underline: true, color: { argb: green } };
  const help = overview.addRow(['Cách đọc: Tổng thu/chi là dòng tiền đã ghi nhận trong kỳ. Bảng đơn bán phản ánh giá trị các đơn bán trong kỳ; hai số có thể khác khi khách trả sau.']);
  overview.mergeCells(help.number, 1, help.number, 4);
  help.height = 40;
  help.getCell(1).font = { name: 'Segoe UI', size: 11, color: { argb: '64748B' } };
  help.getCell(1).alignment = { vertical: 'middle', wrapText: true, indent: 1 };
  overview.pageSetup.printArea = `A1:D${overview.rowCount}`;

  const customers = new Map<string, any>();
  const products = new Map<string, any>();
  const saleRows = sales.map(s => {
    const revenue = s.price * s.quantity, cost = s.cost * s.quantity;
    const paid = s.paidAmount || 0, owed = Math.max(0, revenue - paid);
    const customer = s.customerId;
    const key = String(customer?._id || 'missing');
    const c = customers.get(key) || { name: customer?.name || 'Khách đã xóa', phone: customer?.phone || '', count: 0, revenue: 0, paid: 0, owed: 0 };
    c.count++; c.revenue += revenue; c.paid += paid; c.owed += owed;
    customers.set(key, c);
    const p = products.get(s.productName) || { count: 0, quantity: 0, revenue: 0, cost: 0 };
    p.count++; p.quantity += s.quantity; p.revenue += revenue; p.cost += cost;
    products.set(s.productName, p);
    return [String(s._id), excelDate(s.soldAt), c.name, s.productName, s.quantity, s.price, revenue, cost, revenue - cost, paid, owed, ({ paid: 'Đã thanh toán', partial: 'Thanh toán một phần', unpaid: 'Chưa thanh toán' })[s.paymentStatus] || s.paymentStatus];
  });
  table('Đơn bán', ['Mã đơn', 'Ngày bán', 'Khách hàng', 'Sản phẩm', 'SL', 'Đơn giá', 'Tiền bán', 'Giá vốn', 'Lãi gộp', 'Đã thu hiện tại', 'Còn nợ hiện tại', 'Thanh toán'], [28, 16, 28, 30, 8, 20, 20, 20, 20, 22, 22, 26], saleRows, [6, 7, 8, 9, 10, 11], [5, 7, 8, 9, 10, 11]);
  table('Khách hàng', ['Khách hàng', 'Điện thoại', 'Số đơn', 'Tổng tiền mua', 'Đã thu hiện tại', 'Còn nợ hiện tại'], [36, 22, 14, 28, 28, 28], [...customers.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi')).map(c => [c.name, c.phone || '—', c.count, c.revenue, c.paid, c.owed]), [4, 5, 6], [3, 4, 5, 6]);
  table('Sản phẩm', ['Sản phẩm', 'Số đơn', 'Số lượng', 'Tiền bán', 'Giá vốn', 'Lãi gộp'], [44, 16, 16, 28, 28, 28], [...products].map(([name, p]) => [name, p.count, p.quantity, p.revenue, p.cost, p.revenue - p.cost]), [4, 5, 6], [2, 3, 4, 5, 6]);
  const ledger = table('Thu chi', ['Ngày', 'Loại', 'Nội dung', 'Thu', 'Chi', 'Danh mục', 'Phương thức', 'Người liên quan', 'Mã đơn', 'Ghi chú', 'Người tạo'], [16, 10, 36, 22, 22, 28, 20, 28, 28, 48, 28], transactions.map(t => [excelDate(t.date), t.type === 'income' ? 'Thu' : 'Chi', t.title, t.type === 'income' ? t.amount : 0, t.type === 'expense' ? t.amount : 0, t.categoryId?.name || 'Khác', ({ transfer: 'Chuyển khoản', cash: 'Tiền mặt', ewallet: 'Ví điện tử' })[t.method] || t.method, t.counterparty || '', t.saleId ? String(t.saleId) : '', t.note || '', t.ownerId?.name || '']), [4, 5]);
  for (let row = 10; row <= transactions.length + 9; row++) {
    ledger.getCell(row, 4).font = { ...ledger.getCell(row, 4).font, color: { argb: green } };
    ledger.getCell(row, 5).font = { ...ledger.getCell(row, 5).font, color: { argb: red } };
  }
  return workbook;
}
