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

class CsvFormatter {
  header() {
    return 'ID,NOME,VALOR,USUARIO\n';
  }

  row(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  }

  footer(total) {
    return `\nTotal,,\n${total},,\n`;
  }
}

class HtmlFormatter {
  header(user) {
    return [
      '<html><body>\n',
      '<h1>Relatório</h1>\n',
      `<h2>Usuário: ${user.name}</h2>\n`,
      '<table>\n',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n',
    ].join('');
  }

  row(item, user, highlighted) {
    const style = highlighted ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }

  footer(total) {
    return `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`;
  }
}

const FORMATTERS = new Map([
  ['CSV', new CsvFormatter()],
  ['HTML', new HtmlFormatter()],
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

    const formatter = FORMATTERS.get(reportType);
    if (!formatter) {
      return '';
    }

    const rows = visibleItems.map((item) =>
      formatter.row(item, user, policy.highlightsPriority && item.priority),
    );
    const total = visibleItems.reduce((sum, item) => sum + item.value, 0);

    return [formatter.header(user), ...rows, formatter.footer(total)].join('').trim();
  }
}
