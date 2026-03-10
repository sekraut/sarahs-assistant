// signwell-service.js — SignWell e-signature API wrapper
// Calls SignWell API via Supabase edge function (to keep API key server-side)
// Usage: SignWellService.createDocument({ name, files, recipients })

const SignWellService = (function() {
    // These calls go through a future edge function for security.
    // For now, provides helper structure for future integration.
    const BASE_URL = 'https://vtflffpvetugzvrrrotr.supabase.co/functions/v1';

    async function getAuthHeader() {
        const session = await window.adminSupabase?.auth.getSession();
        const token = session?.data?.session?.access_token;
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    /**
     * Send a document for e-signature
     * @param {Object} opts
     * @param {string} opts.name - Document name
     * @param {string[]} opts.files - Base64 file data or URLs
     * @param {Array<{name, email}>} opts.recipients - Signers
     * @param {string} [opts.subject] - Email subject
     * @param {string} [opts.message] - Email message
     */
    async function createDocument({ name, files, recipients, subject, message }) {
        const headers = await getAuthHeader();
        const res = await fetch(`${BASE_URL}/signwell-send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ name, files, recipients, subject, message }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'SignWell error');
        return data;
    }

    /**
     * Get document status
     * @param {string} documentId
     */
    async function getDocument(documentId) {
        const headers = await getAuthHeader();
        const res = await fetch(`${BASE_URL}/signwell-status?id=${encodeURIComponent(documentId)}`, {
            headers,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'SignWell error');
        return data;
    }

    return { createDocument, getDocument };
})();
