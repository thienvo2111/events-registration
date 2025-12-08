export function createPaymentQuickLink(
  bankId: string,
  accountNo: string,
  amount: number,
  description: string,
  accountName: string,
) {
  const template = "compact"
  const url =
    `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png` +
    `?amount=${amount}` +
    `&addInfo=${encodeURIComponent(description)}` +
    `&accountName=${encodeURIComponent(accountName)}`

  return {
    qr_url: url,
    bank_code: bankId,
    account_number: accountNo,
    account_name: accountName,
  }
}
