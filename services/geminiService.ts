import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateMarketingCopy = async (productName: string, targetAudience: string, tone: string, type: 'POST' | 'PROMO' = 'POST', discount?: string): Promise<string> => {
  if (!ai) return "API Key non configurata.";
  try {
    let prompt = "";
    if (type === 'PROMO') {
      prompt = `Crea un testo promozionale per una campagna sconti.
      Prodotto: ${productName}
      Target: ${targetAudience}
      Tono: ${tone}
      Offerta: ${discount || 'Sconto speciale'}
      
      Includi emoji, scarsità (tempo limitato) e call to action forte. Max 80 parole.`;
    } else {
      prompt = `Scrivi un post social accattivante.
      Prodotto: ${productName}, Target: ${targetAudience}, Tono: ${tone}. In italiano. Max 100 parole.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "Nessun contenuto.";
  } catch (error) {
    return "Errore generazione.";
  }
};

export const generateProductDescription = async (product: any): Promise<string> => {
  if (!ai) return "API Key non configurata.";
  try {
    const variantsInfo = product.variants ? product.variants.map((v: any) => `${v.color} ${v.size}`).join(', ') : '';
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Sei un copywriter esperto di moda. Scrivi una descrizione prodotto professionale per e-commerce.
      Dati: Nome: ${product.name}, Categoria: ${product.category}, Materiale: ${product.material}, Varianti: ${variantsInfo}.
      Usa circa 40-60 parole. Evidenzia qualità e vestibilità. Lingua: Italiano.`
    });
    return response.text || "";
  } catch (error) {
    console.error(error);
    return "";
  }
};

export const analyzeProductImage = async (base64Image: string): Promise<any> => {
  if (!ai) throw new Error("API Key mancante");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: `Analizza questa immagine moda. JSON puro: { "name": "...", "description": "...", "category": "Uomo/Donna/...", "material": "...", "detected_colors": ["..."], "suggested_sizes": ["..."] }` }
        ]
      }
    });
    const text = response.text || "{}";
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    return null;
  }
};

export const parseInvoiceImage = async (base64Image: string): Promise<any> => {
  if (!ai) throw new Error("API Key mancante");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: `Estrai i dati da questa fattura in formato JSON. 
            Cerca di identificare: 
            - invoiceNumber (numero documento)
            - date (formato YYYY-MM-DD)
            - items: un array di oggetti con { productName, quantity (numero), costPrice (numero unitario), barcode (se visibile, altrimenti stringa vuota) }
            
            Rispondi SOLO con il JSON.` }
        ]
      }
    });
    const text = response.text || "{}";
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Errore parsing fattura", error);
    return null;
  }
};