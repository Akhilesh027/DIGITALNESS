const nodemailer = require('nodemailer');
const connector = require('../ai/integrations/connectors/WhatsAppCloudConnector');
const { expiryDay, cutoffFor } = require('./renewalPolicy');
async function deliver(customer, notice) {
  const date = expiryDay(customer.rechargePlan.validUntil);
  const cutoff = cutoffFor(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const message = `Your Digitalness service end date is ${date}. Portal access remains available through the three-day grace period and goes on hold at ${cutoff} IST. Please contact Digitalness to renew. Internal service delivery is not paused by this portal hold.`;
  if (notice.channel === 'Email') {
    if (!customer.email) throw new Error('Customer email is missing');
    if (!process.env.MAIL_HOST || !process.env.MAIL_FROM) throw new Error('Email sender is not configured');
    const transport = nodemailer.createTransport({ host: process.env.MAIL_HOST, port: Number(process.env.MAIL_PORT || 587), secure: Number(process.env.MAIL_PORT) === 465, auth: process.env.MAIL_USER ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } : undefined, connectionTimeout: 15000, socketTimeout: 20000 });
    const result = await transport.sendMail({ from: process.env.MAIL_FROM, to: customer.email, subject: `Digitalness renewal reminder — ${date}`, text: message });
    if (!result.accepted?.length) throw new Error('Email provider did not accept the recipient');
    return result.messageId;
  }
  // Agency-owned sender: do not use a customer's advertising/lead inbox.
  const token = process.env.RENEWAL_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.RENEWAL_WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.RENEWAL_WHATSAPP_TEMPLATE;
  if (connector.isMockOrTest(token) || !phoneNumberId || !templateName) throw new Error('Agency WhatsApp renewal sender/template is not configured');
  const phone = String(customer.contactNumbers?.[0] || customer.phone || '').replace(/\D/g, '');
  if (!/^[1-9]\d{10,14}$/.test(phone)) throw new Error('Customer WhatsApp number must include country code');
  const result = await connector.sendTemplate({ credentialContext: { accessToken: token }, phoneNumberId, recipientWaId: phone, templateName, language: process.env.RENEWAL_WHATSAPP_LANGUAGE || 'en_US', components: [{ type: 'body', parameters: [{ type: 'text', text: customer.name || 'Customer' }, { type: 'text', text: date }, { type: 'text', text: `${cutoff} IST` }] }] });
  if (result.mock || !result.messages?.[0]?.id) throw new Error('WhatsApp provider did not return a real message ID');
  return result.messages[0].id;
}
module.exports = { deliver };
