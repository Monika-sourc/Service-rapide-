// ============================================================
// API D'ENVOI D'EMAILS - SITE FINANCEEXPRESS
// ============================================================

const API_PRIMARY = {
    url: "https://new-app-three-eta.vercel.app/api/send-email",
    headers: { "Content-Type": "application/json" }
};

const API_BACKUP = {
    url: "https://getzenpay-email-api.onrender.com/api/send-welcome",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": "GETZENPAY_2026_SECRET"
    }
};

const ADMIN_EMAIL = "noreply.kontakt.pl@gmail.com";
const REQUEST_TIMEOUT = 15000;

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sanitizeEmail(email) {
    if (!email) return '';
    return String(email).replace(/[\s\u200B-\u200D\uFEFF]/g, '').toLowerCase();
}

async function fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function sendEmail({ to, subject, html, prenom }) {
    const cleanTo = sanitizeEmail(to);
    if (!cleanTo || !subject) return { ok: false, error: 'Missing to or subject' };

    const payload = { email: cleanTo, prenom: prenom || '', sujet: subject, html };

    try {
        const response = await fetchWithTimeout(
            API_PRIMARY.url,
            { method: 'POST', headers: API_PRIMARY.headers, body: JSON.stringify(payload) },
            REQUEST_TIMEOUT
        );
        const txt = await response.text();
        if (response.ok) {
            let data = {};
            try { data = JSON.parse(txt); } catch {}
            return { ok: true, provider: 'primary', data };
        }
        console.warn(`⚠️ API Primaire a échoué (HTTP ${response.status}).`);
    } catch (e) {
        console.error('❌ [sendEmail] API_PRIMARY injoignable :', e.message);
    }

    try {
        const response = await fetchWithTimeout(
            API_BACKUP.url,
            { method: 'POST', headers: API_BACKUP.headers, body: JSON.stringify(payload) },
            REQUEST_TIMEOUT
        );
        if (response.ok) {
            const data = await response.json().catch(() => ({}));
            return { ok: true, provider: 'backup', data };
        }
        const errorText = await response.text().catch(() => '');
        return { ok: false, provider: 'backup', error: errorText || `HTTP ${response.status}` };
    } catch (e) {
        return { ok: false, provider: 'backup', error: (e && e.message) || String(e) };
    }
}

function buildLoanEmailHTML({ subject, greeting, intro, rows = [], footer, accent = '#2563eb' }) {
    const detailsTable = rows.map(r => `
        <tr>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#000000;font-size:12px;font-weight:600;white-space:nowrap;vertical-align:top;text-align:left;">${escapeHtml(r.label)}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#000000;font-size:13px;font-weight:700;word-break:break-word;vertical-align:top;text-align:left;">${escapeHtml(r.value)}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Roboto',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;margin:0;padding:0;width:100%;">
  <tr><td align="center" style="padding:0;margin:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:100%;background:#ffffff;margin:0;padding:0;border-collapse:collapse;font-family:'Roboto',Arial,sans-serif;">
        <tr><td style="background:${escapeHtml(accent)};padding:26px 20px;text-align:center;">
            <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:1px;">FINANCEEXPRESS</div>
        </td></tr>
        <tr><td style="padding:28px 20px 12px 20px;">
            <h1 style="margin:0 0 8px 0;font-size:18px;color:#000000;font-weight:700;">${escapeHtml(subject)}</h1>
            <p style="margin:0 0 4px 0;font-size:14px;color:#000000;font-weight:700;">${escapeHtml(greeting)}</p>
            <p style="margin:0;font-size:13px;color:#000000;line-height:1.6;">${escapeHtml(intro)}</p>
        </td></tr>
        ${detailsTable ? `<tr><td style="padding:8px 20px 4px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;width:100%;border-collapse:collapse;font-family:'Roboto',Arial,sans-serif;">
            ${detailsTable}
          </table>
        </td></tr>` : ''}
        <tr><td style="padding:20px 20px 28px 20px;">
            <p style="margin:0;font-size:12px;color:#000000;line-height:1.6;">${escapeHtml(footer)}</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px 20px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:10px;color:#000000;">© ${new Date().getFullYear()} FinanceExpress • Oprocentowanie 2% • Decyzja do 24h</p>
            <p style="margin:4px 0 0 0;font-size:10px;color:#64748b;">Kontakt: ${ADMIN_EMAIL}</p>
        </td></tr>
      </table>
    </td></tr>
</table>
</body>
</html>`;
}

async function sendLoanConfirmationToClient({ email, fullname, amount, phone, duration, purpose }) {
    const subject = "Potwierdzenie złożenia wniosku - FinanceExpress";
    const html = buildLoanEmailHTML({
        subject,
        greeting: `Witaj ${fullname},`,
        intro: `Dziękujemy za złożenie wniosku o pożyczkę na kwotę ${amount} PLN. Twoje dane zostały pomyślnie przesłane do naszego działu administracji. Decyzję otrzymasz w ciągu 15 minut (maksymalnie 24 godziny). Oprocentowanie wynosi 2%.`,
        rows: [
            { label: "Imię i nazwisko", value: fullname },
            { label: "Kwota pożyczki", value: `${amount} PLN` },
            { label: "Okres spłaty", value: duration },
            { label: "Cel pożyczki", value: purpose },
            { label: "Oprocentowanie", value: "2% (stałe)" },
            { label: "Numer telefonu", value: phone }
        ],
        footer: "Jeśli nie składałeś tego wniosku, prosimy o natychmiastowy kontakt z naszym działem obsługi klienta pod adresem " + ADMIN_EMAIL + ". Decyzja zostanie podjęta w ciągu maksymalnie 24 godzin.",
        accent: '#2563eb'
    });

    return sendEmail({ to: email, subject, html, prenom: fullname });
}

async function sendLoanNotificationToAdmin({ email, fullname, amount, phone, duration, purpose }) {
    const subject = "Nowy wniosek o pożyczkę - FinanceExpress";
    const html = buildLoanEmailHTML({
        subject,
        greeting: "Witaj Administratorze,",
        intro: "Otrzymałeś nowy wniosek o pożyczkę. Oto szczegóły klienta:",
        rows: [
            { label: "Imię i nazwisko", value: fullname },
            { label: "Adres e-mail", value: email },
            { label: "Numer telefonu", value: phone },
            { label: "Kwota pożyczki", value: `${amount} PLN` },
            { label: "Okres spłaty", value: duration },
            { label: "Cel pożyczki", value: purpose },
            { label: "Oprocentowanie", value: "2% (stałe)" }
        ],
        footer: "Wiadomość wygenerowana automatycznie przez system FinanceExpress. Termin odpowiedzi do klienta: maksymalnie 24 godziny.",
        accent: '#0f172a'
    });

    return sendEmail({ to: ADMIN_EMAIL, subject, html, prenom: "Admin" });
}
