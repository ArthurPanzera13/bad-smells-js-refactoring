const ADMIN_PRIORITY_THRESHOLD = 1000;
const USER_MAX_VISIBLE_VALUE = 500;

const adminPolicy = {
  highlightsPriority: true,
  selectItems(items) {
    for (const item of items) {
      if (item.value > ADMIN_PRIORITY_THRESHOLD) {
        item.priority = true;
      }
    }
    return items;
  },
};

const userPolicy = {
  highlightsPriority: false,
  selectItems(items) {
    return items.filter((item) => item.value <= USER_MAX_VISIBLE_VALUE);
  },
};

const noAccessPolicy = {
  highlightsPriority: false,
  selectItems() {
    return [];
  },
};

const ROLE_POLICIES = new Map([
  ['ADMIN', adminPolicy],
  ['USER', userPolicy],
]);

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const policy = ROLE_POLICIES.get(user.role) ?? noAccessPolicy;
    const visibleItems = policy.selectItems(items);

    let report = '';
    let total = 0;

    // --- Seção do Cabeçalho ---
    if (reportType === 'CSV') {
      report += 'ID,NOME,VALOR,USUARIO\n';
    } else if (reportType === 'HTML') {
      report += '<html><body>\n';
      report += '<h1>Relatório</h1>\n';
      report += `<h2>Usuário: ${user.name}</h2>\n`;
      report += '<table>\n';
      report += '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n';
    }

    // --- Seção do Corpo ---
    for (const item of visibleItems) {
      if (reportType === 'CSV') {
        report += `${item.id},${item.name},${item.value},${user.name}\n`;
        total += item.value;
      } else if (reportType === 'HTML') {
        const style = policy.highlightsPriority && item.priority ? ' style="font-weight:bold;"' : '';
        report += `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
        total += item.value;
      }
    }

    // --- Seção do Rodapé ---
    if (reportType === 'CSV') {
      report += '\nTotal,,\n';
      report += `${total},,\n`;
    } else if (reportType === 'HTML') {
      report += '</table>\n';
      report += `<h3>Total: ${total}</h3>\n`;
      report += '</body></html>\n';
    }

    return report.trim();
  }
}
