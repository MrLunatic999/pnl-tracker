(function () {
  const D = {
    ar: {
      'brand.sub': 'متابعة الأرباح والخسائر',
      'nav.dashboard': 'لوحة التحكم', 'nav.add': 'إضافة صفقة', 'nav.holdings': 'المحفظة',
      'nav.history': 'سجل الصفقات', 'nav.import': 'استيراد ملف', 'nav.settings': 'الإعدادات',
      'sidebar.refresh': 'تحديث الأسعار', 'lang.switch': 'English',
      'status.noCoins': 'لا توجد عملات بعد', 'status.updating': 'جاري تحديث الأسعار...',
      'status.lastUpdate': 'آخر تحديث {t}', 'status.updateFail': 'فشل التحديث: {e}',
      'dash.title': 'لوحة التحكم', 'dash.sub': 'كل صفقاتك في مكان واحد',
      'dash.allocation': 'توزيع المحفظة', 'dash.summary': 'ملخص المحفظة',
      'kpi.valueNow': 'قيمة المحفظة الآن', 'kpi.cost': 'رأس المال في المراكز المفتوحة',
      'kpi.unrealized': 'ربح/خسارة غير محققة', 'kpi.realizedSales': 'ربح/خسارة محققة (مبيعات)', 'kpi.total': 'إجمالي الربح/الخسارة',
      'alloc.empty': 'أضف صفقة أو استورد ملف للبدء',
      'scope.show': 'عرض:', 'scope.all': 'كل المحفظة', 'group.ungrouped': 'بدون مجموعة',
      'wt.total': 'إجمالي المحفظة', 'wt.cost': 'رأس المال', 'wt.unrealized': 'ربح/خسارة غير محققة',
      'wt.realized': 'محققة', 'wt.totalPl': 'الإجمالي', 'wt.24h': 'آخر 24 ساعة',
      'holdings.title': 'المحفظة', 'holdings.sub': 'عملاتك ومتوسط السعر',
      'holdings.newGroup': '➕ مجموعة جديدة', 'holdings.showClosed': 'عرض المباعة بالكامل',
      'holdings.emptyCanvas': 'لا توجد عملات — أضف صفقة أو استورد ملف',
      'th.coin': 'العملة', 'th.qty': 'الكمية', 'th.avg': 'متوسط', 'th.avgBuy': 'متوسط الشراء', 'th.price': 'السعر',
      'th.priceNow': 'السعر الحالي', 'th.24h': '24h', 'th.value': 'القيمة', 'th.unrealizedShort': 'غير محققة',
      'th.realizedShort': 'محققة', 'th.group': 'المجموعة',
      'gwin.emptyUng': 'لا توجد عملات هنا', 'gwin.emptyGrp': 'لا توجد عملات هنا — غيّر خانة "المجموعة" لأي عملة عشان تضيفها هنا',
      'gwin.rename': 'تغيير الاسم', 'gwin.delete': 'حذف المجموعة',
      'group.defaultName': 'مجموعة {n}',
      'group.confirmDelete': 'حذف هذه المجموعة؟ العملات هتترجع لـ"بدون مجموعة".',
      'add.title': 'إضافة صفقة', 'add.sub': 'سجّل صفقاتك — والبرنامج يحسب المتوسط والربح',
      'add.typeTrade': 'صفقة كاملة (شراء + بيع)', 'add.typeBuy': 'شراء فقط', 'add.typeSell': 'بيع فقط',
      'add.symbol': 'الرمز', 'add.symbolPh': 'مثال: BTC', 'add.currentPrice': 'السعر الحالي', 'add.qty': 'الكمية',
      'add.buyLegend': 'الشراء', 'add.buyPrice': 'سعر الشراء ($)', 'add.buyTime': 'تاريخ الشراء', 'add.buyFee': 'رسوم الشراء ($)',
      'add.sellLegend': 'البيع', 'add.sellPrice': 'سعر البيع ($)', 'add.sellTime': 'تاريخ البيع', 'add.sellFee': 'رسوم البيع ($)',
      'add.note': 'ملاحظة', 'add.notePh': 'Binance، Bybit ...', 'add.save': 'حفظ الصفقة',
      'add.previewTitle': 'معاينة', 'add.previewHint': 'اكتب بيانات الصفقة لعرض الحسابات',
      'add.previewHint2': 'اكتب الرمز والكمية لعرض الحسابات',
      'pv.priceNow': 'السعر الحالي {p}', 'pv.avgAfter': 'متوسط السعر بعد الشراء الجديد',
      'pv.oldAvg': 'المتوسط القديم ({q})', 'pv.newAvg': 'المتوسط الجديد ({q})', 'pv.avgChange': 'تغير المتوسط',
      'pv.plBasis': 'الربح بالسعر الحالي', 'pv.priceWord': 'السعر {p}', 'pv.buyPriceWord': 'سعر الشراء',
      'pv.buyCost': 'تكلفة الشراء', 'pv.plAtCurrent': 'الربح/الخسارة بالسعر الحالي', 'pv.tradeResult': 'نتيجة الصفقة',
      'pv.cost': 'التكلفة', 'pv.proceeds': 'العائد من البيع', 'pv.pl': 'الربح/الخسارة', 'pv.duration': 'المدة',
      'pv.sellBeforeBuy': 'البيع قبل الشراء!', 'pv.noBalance': 'لا يوجد رصيد لبيعه',
      'pv.currentBalance': 'الرصيد الحالي', 'pv.avgBuy': 'متوسط الشراء', 'pv.plFromSell': 'الربح/الخسارة من البيع',
      'pv.remaining': 'المتبقي بعد البيع', 'pv.qtyOverBalance': 'الكمية أكبر من الرصيد',
      'err.symbol': 'اكتب الرمز', 'err.qty': 'اكتب كمية صحيحة', 'err.buyPrice': 'اكتب سعر الشراء',
      'err.buyTime': 'حدد تاريخ الشراء', 'err.sellPrice': 'اكتب سعر البيع', 'err.sellTime': 'حدد تاريخ البيع',
      'err.sellAfterBuy': 'وقت البيع لازم يكون بعد الشراء', 'err.sellOverBalance': 'الكمية أكبر من رصيدك',
      'toast.saved': 'تم حفظ الصفقة ✓', 'toast.symFirst': 'اكتب الرمز أولًا', 'toast.noPrice': 'لم يتم العثور على السعر',
      'hist.title': 'سجل الصفقات', 'hist.sub': 'الصفقات المغلقة وكل العمليات',
      'hist.allCoins': 'الكل', 'hist.tabClosed': 'صفقات مغلقة', 'hist.tabAll': 'كل العمليات',
      'hist.count': 'عدد الصفقات', 'hist.wins': 'رابحة', 'hist.losses': 'خاسرة', 'hist.winRate': 'نسبة النجاح',
      'hist.netProfit': 'صافي الربح', 'hist.avgDur': 'متوسط المدة', 'hist.noClosed': 'لا توجد صفقات مغلقة بعد',
      'hist.buyPrice': 'سعر الشراء', 'hist.buyTime': 'وقت الشراء', 'hist.sellPrice': 'سعر البيع', 'hist.sellTime': 'وقت البيع',
      'hist.duration': 'المدة', 'hist.pl': 'الربح/الخسارة', 'hist.unmatched': 'بيع بدون شراء مسجل',
      'hist.opCount': 'عدد العمليات', 'hist.buys': 'شراء', 'hist.sells': 'بيع', 'hist.noOps': 'لا توجد عمليات',
      'hist.time': 'الوقت', 'hist.type': 'النوع', 'hist.total': 'الإجمالي', 'hist.fee': 'الرسوم', 'hist.exchange': 'المنصة',
      'tag.buy': 'شراء', 'tag.sell': 'بيع', 'btn.delete': 'حذف', 'hist.confirmDel': 'حذف هذه العملية؟', 'toast.deleted': 'تم الحذف',
      'imp.title': 'استيراد ملف', 'imp.sub': 'ارفع ملف سجل التداول (CSV أو Excel)',
      'imp.dragHere': 'اسحب الملف هنا أو', 'imp.chooseFile': 'اختر ملف',
      'imp.utc': 'الأوقات بتوقيت UTC', 'imp.exchangePh': 'اسم المنصة', 'imp.mapCols': 'ربط الأعمدة',
      'imp.doImport': 'استيراد', 'imp.cancel': 'إلغاء', 'imp.none': '— لا يوجد —',
      'imp.rowsInFile': 'صفوف', 'imp.ready': 'جاهزة', 'imp.dup': 'مكررة', 'imp.skipped': 'متجاهلة',
      'imp.firstReason': 'أول سبب: سطر {line} — {reason}', 'imp.fee$': 'الرسوم $',
      'imp.noRecognized': 'لم يتم التعرف على أي صف', 'imp.fileEmpty': 'الملف فاضي',
      'imp.readFail': 'تعذر قراءة الملف: {e}', 'imp.noNew': 'لا توجد عمليات جديدة', 'imp.done': 'تم استيراد {n} عملية ✓',
      'impf.time': 'التاريخ والوقت', 'impf.pair': 'العملة / الزوج', 'impf.side': 'شراء/بيع', 'impf.price': 'السعر',
      'impf.qty': 'الكمية', 'impf.total': 'الإجمالي', 'impf.fee': 'الرسوم',
      'impr.unknownCoin': 'العملة غير معروفة', 'impr.unknownSide': 'لم يتم التعرف على شراء/بيع', 'impr.badDate': 'تاريخ غير صالح',
      'impr.badPriceQty': 'السعر أو الكمية غير صالحة', 'impr.nonUsd': 'الزوج مسعّر بـ {q} وليس بالدولار',
      'set.title': 'الإعدادات', 'set.sub': 'مفاتيح الـ API والنسخ الاحتياطي',
      'set.show': 'إظهار', 'set.hide': 'إخفاء',
      'set.cmcHint1': 'مفتاح مجاني من ', 'set.cmcHint2': '. بدون مفتاح يستخدم Binance.',
      'set.finnhubHint': 'مفتاح مجاني من ',
      'set.refreshEvery': 'تحديث الأسعار كل (ثانية)',
      'set.save': 'حفظ', 'set.testKey': 'اختبار CMC', 'set.dataTitle': 'البيانات', 'set.langTitle': 'اللغة',
      'set.dataNote': 'كل بياناتك محفوظة على جهازك فقط.', 'set.backup': 'نسخة احتياطية (JSON)',
      'set.restore': 'استرجاع نسخة', 'set.clear': 'مسح كل العمليات',
      'set.keyOk': 'المفتاح شغال ✓', 'set.monthUsage': 'استهلاك الشهر: {used} / {limit}', 'set.keyInvalid': 'المفتاح غير صالح: {e}',
      'set.keyFirst': 'اكتب المفتاح أولًا', 'set.testing': 'جاري الاختبار...', 'set.saved': 'تم حفظ الإعدادات ✓',
      'set.backupSaved': 'تم الحفظ ✓', 'set.badFile': 'ملف غير صالح',
      'set.confirmRestore': 'استرجاع {n} عملية؟ سيتم استبدال البيانات الحالية.', 'set.restored': 'تم الاسترجاع ✓',
      'set.restoreFail': 'تعذر الاسترجاع: {e}', 'set.confirmClear': 'مسح كل العمليات نهائيًا؟',
      'set.cleared': 'تم مسح البيانات',
      'modal.confirm': 'تأكيد', 'modal.cancel': 'إلغاء',
      'dur.less': 'أقل من دقيقة',
      'market.crypto': 'كريبتو', 'market.stocks': 'أسهم أمريكية',
    },
    en: {
      'brand.sub': 'Profit & loss tracking',
      'nav.dashboard': 'Dashboard', 'nav.add': 'Add Trade', 'nav.holdings': 'Portfolio',
      'nav.history': 'History', 'nav.import': 'Import File', 'nav.settings': 'Settings',
      'sidebar.refresh': 'Refresh Prices', 'lang.switch': 'العربية',
      'status.noCoins': 'No assets yet', 'status.updating': 'Updating prices...',
      'status.lastUpdate': 'Updated {t}', 'status.updateFail': 'Update failed: {e}',
      'dash.title': 'Dashboard', 'dash.sub': 'All your trades in one place',
      'dash.allocation': 'Allocation', 'dash.summary': 'Portfolio Summary',
      'kpi.valueNow': 'Portfolio Value', 'kpi.cost': 'Cost of Open Positions',
      'kpi.unrealized': 'Unrealized P/L', 'kpi.realizedSales': 'Realized P/L (sales)', 'kpi.total': 'Total P/L',
      'alloc.empty': 'Add a trade or import a file to start',
      'scope.show': 'Show:', 'scope.all': 'Whole wallet', 'group.ungrouped': 'Ungrouped',
      'wt.total': 'Total portfolio', 'wt.cost': 'Cost basis', 'wt.unrealized': 'Unrealized P/L',
      'wt.realized': 'Realized', 'wt.totalPl': 'Total', 'wt.24h': '24h',
      'holdings.title': 'Portfolio', 'holdings.sub': 'Your assets and average price',
      'holdings.newGroup': '➕ New Group', 'holdings.showClosed': 'Show fully-sold',
      'holdings.emptyCanvas': 'No assets — add a trade or import a file',
      'th.coin': 'Asset', 'th.qty': 'Qty', 'th.avg': 'Avg', 'th.avgBuy': 'Avg Buy', 'th.price': 'Price',
      'th.priceNow': 'Price', 'th.24h': '24h', 'th.value': 'Value', 'th.unrealizedShort': 'Unreal.',
      'th.realizedShort': 'Real.', 'th.group': 'Group',
      'gwin.emptyUng': 'No assets here', 'gwin.emptyGrp': 'No assets — change the "Group" field on any asset to add it',
      'gwin.rename': 'Rename', 'gwin.delete': 'Delete group',
      'group.defaultName': 'Group {n}',
      'group.confirmDelete': 'Delete this group? Assets return to "Ungrouped".',
      'add.title': 'Add Trade', 'add.sub': 'Enter details — the app computes average, profit and duration',
      'add.typeTrade': 'Full trade (buy + sell)', 'add.typeBuy': 'Buy only', 'add.typeSell': 'Sell only',
      'add.symbol': 'Symbol', 'add.symbolPh': 'e.g. BTC or AAPL', 'add.currentPrice': 'Current Price', 'add.qty': 'Quantity',
      'add.buyLegend': 'Buy', 'add.buyPrice': 'Buy price ($)', 'add.buyTime': 'Buy date & time', 'add.buyFee': 'Buy fee ($)',
      'add.sellLegend': 'Sell', 'add.sellPrice': 'Sell price ($)', 'add.sellTime': 'Sell date & time', 'add.sellFee': 'Sell fee ($)',
      'add.note': 'Exchange / note', 'add.notePh': 'Binance, Bybit, Schwab ...', 'add.save': 'Save Trade',
      'add.previewTitle': 'Preview', 'add.previewHint': 'Enter trade details to see calculations',
      'add.previewHint2': 'Enter symbol and quantity to see calculations',
      'pv.priceNow': 'Current price {p}', 'pv.avgAfter': 'Average after the new buy',
      'pv.oldAvg': 'Old average ({q})', 'pv.newAvg': 'New average ({q})', 'pv.avgChange': 'Average change',
      'pv.plBasis': 'P/L at current price', 'pv.priceWord': 'price {p}', 'pv.buyPriceWord': 'buy price',
      'pv.buyCost': 'Buy cost', 'pv.plAtCurrent': 'P/L at current price', 'pv.tradeResult': 'Trade result',
      'pv.cost': 'Cost', 'pv.proceeds': 'Proceeds', 'pv.pl': 'Profit/Loss', 'pv.duration': 'Hold duration',
      'pv.sellBeforeBuy': 'Sell is before buy!', 'pv.noBalance': 'No balance to sell',
      'pv.currentBalance': 'Current balance', 'pv.avgBuy': 'Average buy', 'pv.plFromSell': 'P/L from sell',
      'pv.remaining': 'Remaining after sell', 'pv.qtyOverBalance': 'Quantity exceeds balance',
      'err.symbol': 'Enter the symbol', 'err.qty': 'Enter a valid quantity', 'err.buyPrice': 'Enter the buy price',
      'err.buyTime': 'Set buy date & time', 'err.sellPrice': 'Enter the sell price', 'err.sellTime': 'Set sell date & time',
      'err.sellAfterBuy': 'Sell time must be after buy', 'err.sellOverBalance': 'Quantity exceeds your balance',
      'toast.saved': 'Trade saved ✓', 'toast.symFirst': 'Enter the symbol first', 'toast.noPrice': 'Price not found',
      'hist.title': 'History', 'hist.sub': 'Closed trades and all operations',
      'hist.allCoins': 'All', 'hist.tabClosed': 'Closed trades (P/L)', 'hist.tabAll': 'All operations',
      'hist.count': 'Trades', 'hist.wins': 'Wins', 'hist.losses': 'Losses', 'hist.winRate': 'Win rate',
      'hist.netProfit': 'Net profit', 'hist.avgDur': 'Avg hold', 'hist.noClosed': 'No closed trades yet',
      'hist.buyPrice': 'Buy price', 'hist.buyTime': 'Buy time', 'hist.sellPrice': 'Sell price', 'hist.sellTime': 'Sell time',
      'hist.duration': 'Duration', 'hist.pl': 'P/L', 'hist.unmatched': 'Sell with no recorded buy',
      'hist.opCount': 'Operations', 'hist.buys': 'Buys', 'hist.sells': 'Sells', 'hist.noOps': 'No operations',
      'hist.time': 'Time', 'hist.type': 'Type', 'hist.total': 'Total', 'hist.fee': 'Fee', 'hist.exchange': 'Exchange',
      'tag.buy': 'Buy', 'tag.sell': 'Sell', 'btn.delete': 'Delete', 'hist.confirmDel': 'Delete this operation?', 'toast.deleted': 'Deleted',
      'imp.title': 'Import File', 'imp.sub': 'Upload your trade-history file (CSV or Excel)',
      'imp.dragHere': 'Drag the file here or', 'imp.chooseFile': 'choose a file',
      'imp.utc': 'Times are UTC', 'imp.exchangePh': 'Exchange name', 'imp.mapCols': 'Map columns',
      'imp.doImport': 'Import', 'imp.cancel': 'Cancel', 'imp.none': '— none —',
      'imp.rowsInFile': 'Rows', 'imp.ready': 'Ready', 'imp.dup': 'Duplicates', 'imp.skipped': 'Skipped',
      'imp.firstReason': 'First reason: row {line} — {reason}', 'imp.fee$': 'Fee $',
      'imp.noRecognized': 'No rows recognized', 'imp.fileEmpty': 'File is empty',
      'imp.readFail': "Couldn't read file: {e}", 'imp.noNew': 'No new operations', 'imp.done': 'Imported {n} operations ✓',
      'impf.time': 'Date & time', 'impf.pair': 'Asset / pair', 'impf.side': 'Buy/Sell', 'impf.price': 'Price',
      'impf.qty': 'Quantity', 'impf.total': 'Total', 'impf.fee': 'Fee',
      'impr.unknownCoin': 'Unknown asset', 'impr.unknownSide': 'Buy/Sell not recognized', 'impr.badDate': 'Invalid date',
      'impr.badPriceQty': 'Invalid price or quantity', 'impr.nonUsd': 'Pair priced in {q}, not USD',
      'set.title': 'Settings', 'set.sub': 'API keys and backup',
      'set.show': 'Show', 'set.hide': 'Hide',
      'set.cmcHint1': 'Free key from ', 'set.cmcHint2': '. Without a key, Binance is used.',
      'set.finnhubHint': 'Free key from ',
      'set.refreshEvery': 'Refresh every (seconds)',
      'set.save': 'Save', 'set.testKey': 'Test CMC', 'set.dataTitle': 'Data', 'set.langTitle': 'Language',
      'set.dataNote': 'All your data is stored on your device only.', 'set.backup': 'Save backup (JSON)',
      'set.restore': 'Restore backup', 'set.clear': 'Clear all operations',
      'set.keyOk': 'Key works ✓', 'set.monthUsage': 'This month: {used} / {limit}', 'set.keyInvalid': 'Invalid key: {e}',
      'set.keyFirst': 'Enter the key first', 'set.testing': 'Testing...', 'set.saved': 'Settings saved ✓',
      'set.backupSaved': 'Backup saved ✓', 'set.badFile': 'Invalid file',
      'set.confirmRestore': 'Restore {n} operations? Current data will be replaced.', 'set.restored': 'Restored ✓',
      'set.restoreFail': 'Restore failed: {e}', 'set.confirmClear': 'Clear all operations permanently?',
      'set.cleared': 'Data cleared',
      'modal.confirm': 'Confirm', 'modal.cancel': 'Cancel',
      'dur.less': 'less than a minute',
      'market.crypto': 'Crypto', 'market.stocks': 'US Stocks',
    },
  };

  let CUR = 'ar';
  const listeners = [];

  function t(key, p) {
    const dict = D[CUR] || D.ar;
    let s = dict[key];
    if (s == null) s = D.ar[key] != null ? D.ar[key] : key;
    if (p) for (const k in p) s = s.split('{' + k + '}').join(p[k]);
    return s;
  }
  function getLang() { return CUR; }
  function setLang(lang, persist = true) {
    CUR = D[lang] ? lang : 'ar';
    document.documentElement.lang = CUR;
    document.documentElement.dir = CUR === 'ar' ? 'rtl' : 'ltr';
    applyStatic();
    listeners.forEach((fn) => { try { fn(CUR); } catch {} });
    if (persist) try { localStorage.setItem('lang', CUR); } catch {}
  }
  function onChange(fn) { listeners.push(fn); }

  function applyStatic(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    (root || document).querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.getAttribute('data-i18n-title')); });
  }

  function fmtDuration(ms) {
    if (ms == null) return '—';
    const m = Math.floor(ms / 60000);
    const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    const parts = [];
    const unit = (n, ar, enS, enP) => (CUR === 'ar' ? `${n} ${ar}` : `${n} ${n === 1 ? enS : enP}`);
    if (d) parts.push(unit(d, 'يوم', 'day', 'days'));
    if (h) parts.push(unit(h, 'ساعة', 'hour', 'hours'));
    if (!d && mm) parts.push(unit(mm, 'دقيقة', 'minute', 'minutes'));
    const join = CUR === 'ar' ? ' و ' : ' ';
    return parts.join(join) || t('dur.less');
  }

  window.I18N = { t, getLang, setLang, onChange, applyStatic, fmtDuration };
  window.t = t;
})();
