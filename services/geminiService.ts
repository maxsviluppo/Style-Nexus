import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateMarketingCopy = async (productName: string, targetAudience: string, tone: string): Promise<string> => {
  if (!ai) return "API Key non configurata.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Scrivi un breve testo di marketing (max 100 parole) per abbigliamento.
      Prodotto: ${productName}, Target: ${targetAudience}, Tono: ${tone}. In italiano.`
    });
    return response.text || "Nessun contenuto.";
  } catch (error) {
    return "Errore generazione.";
  }
};

export const generateProductDescription = async (product: any): Promise<string> => {
  if (!ai) return "API Key non configurata.";
  try {
    // Estrai info utili
    const variantsInfo = product.variants ? product.variants.map((v: any) => `${v.color} ${v.size}`).join(', ') : '';
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Sei un copywriter esperto di moda. Scrivi una descrizione prodotto professionale, tecnica ma accattivante per un e-commerce.
      Dati Prodotto:
      - Nome: ${product.name}
      - Categoria: ${product.category}
      - Materiale: ${product.material}
      - Varianti disponibili: ${variantsInfo}
      
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
          { text: `Analizza questa immagine moda. JSON puro:
            { "name": "...", "description": "...", "category": "Uomo/Donna/...", "material": "...", 
              "detected_colors": ["..."], "suggested_sizes": ["..."] }` }
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
