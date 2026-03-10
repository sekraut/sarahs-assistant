// email-service.js — Resend email client (calls send-email edge function)
// Usage: EmailService.send({ to, subject, html })

const EmailService = (function() {
    const FUNCTION_URL = 'https://vtflffpvetugzvrrrotr.supabase.co/functions/v1/send-email';

    async function send({ to, subject, html, text, from, replyTo }) {
        const session = await window.adminSupabase?.auth.getSession();
        const token = session?.data?.session?.access_token;

        const res = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ to, subject, html, text, from, replyTo }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Email send failed');
        return data;
    }

    return { send };
})();
