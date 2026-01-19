import { Sale } from '../types';

// Simulazione chiamata a stampante fiscale su rete locale (es. Epson XML o Custom XML)
export const printFiscalReceipt = async (sale: Sale, printerIp: string, brand: string): Promise<{ success: boolean; message: string }> => {
  console.log(`[HARDWARE] Connecting to Fiscal Printer at ${printerIp} (${brand})...`);
  
  // In un'app reale, qui useremmo fetch() verso l'IP locale della stampante
  // Esempio pseudo-codice:
  // const xmlCommand = buildXmlForBrand(brand, sale);
  // await fetch(`http://${printerIp}/cgi-bin/fpmate.cgi`, { method: 'POST', body: xmlCommand });
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simuliamo successo al 95%
      const success = Math.random() > 0.05; 
      if (success) {
        console.log("[HARDWARE] Scontrino stampato correttamente. RT invia conferma.");
        resolve({ success: true, message: "Scontrino Fiscale Emesso" });
      } else {
        console.error("[HARDWARE] Errore stampante: Carta esaurita o Offline.");
        resolve({ success: false, message: "Errore Stampante: Verificare carta/connessione" });
      }
    }, 1500);
  });
};

export const initSumUpPayment = async (amount: number, userEmail: string): Promise<{ success: boolean; transactionCode?: string; message: string }> => {
  console.log(`[HARDWARE] Initializing SumUp transaction for €${amount} on account ${userEmail}`);
  
  // In un contesto Web Mobile reale, qui si usa un Deep Link:
  // window.location.href = `sumupmerchant://pay?total=${amount}&currency=EUR&title=Vendita&affiliate-key=...`;
  
  // Poiché siamo in una webapp browser standard, simuliamo la chiamata API al cloud SumUp
  return new Promise((resolve) => {
    setTimeout(() => {
        resolve({ success: true, transactionCode: `SMP-${Date.now()}`, message: "Transazione Approvata" });
    }, 2000);
  });
};