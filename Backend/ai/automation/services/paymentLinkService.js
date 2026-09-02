/**
 * paymentLinkService.js
 * Generates verified dynamic UPI payment URIs and payment links based on exact outstanding balance.
 */

class PaymentLinkService {
  constructor() {
    this.config = {
      payeeName: process.env.AGENCY_PAYEE_NAME || "Digitalness Agency",
      upiId: process.env.AGENCY_UPI_ID || "digitalness@icici",
      merchantCode: process.env.AGENCY_MERCHANT_CODE || "0000",
      enabled: true,
    };
  }

  /**
   * Generates dynamic UPI payment string for an invoice and outstanding balance.
   */
  generateUPIPaymentUri({ invoiceNumber, balance, currency = "INR" }) {
    if (!balance || balance <= 0) return "";

    const cleanAmount = Number(balance).toFixed(2);
    const payee = encodeURIComponent(this.config.payeeName);
    const note = encodeURIComponent(`Payment for Invoice ${invoiceNumber}`);

    // Standard NPCI UPI URI Specification
    const upiUri = `upi://pay?pa=${this.config.upiId}&pn=${payee}&am=${cleanAmount}&cu=${currency}&tn=${note}&mc=${this.config.merchantCode}`;

    return upiUri;
  }

  /**
   * Returns verification metadata
   */
  getPaymentConfig() {
    return { ...this.config };
  }
}

module.exports = new PaymentLinkService();
