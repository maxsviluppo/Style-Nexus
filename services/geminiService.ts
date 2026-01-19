import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
// Initialize AI only if key exists to avoid crash, handle gracefully in UI
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateMarketingCopy = async (productName: string, targetAudience: string, tone: string): Promise<string> => {
  if (!ai) {
    return "API Key non configurata. Impossibile generare contenuti.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Scrivi un breve e accattivante testo di marketing (max 100 parole) per un negozio di abbigliamento.
      
      Prodotto: ${productName}
      Target: ${targetAudience}
      Tono: ${tone}
      
      Includi emoji pertinenti e call to action. Rispondi in italiano.`,
    });

    return response.text || "Nessun contenuto generato.";
  } catch (error) {
    console.error("Errore Gemini:", error);
    return "Si è verificato un errore durante la generazione del contenuto.";
  }
};

export const analyzeProductImage = async (base64Image: string): Promise<any> => {
  if (!ai) {
    throw new Error("API Key mancante");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `Analizza questa immagine di un capo di abbigliamento. Restituisci un oggetto JSON valido con le seguenti proprietà:
            - name: un nome commerciale breve in italiano
            - description: una breve descrizione (max 1 frase)
            - category: una tra "Uomo", "Donna", "Bambino", "Accessori" (scegli la più probabile)
            - color: il colore principale
            - material: il materiale apparente (es. Cotone, Lana, Denim, Pelle)
            
            Non includere markdown, solo il JSON grezzo.`
          }
        ]
      }
    });

    const text = response.text || "{}";
    // Clean potential markdown code blocks
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Errore analisi immagine:", error);
    return null;
  }
};
