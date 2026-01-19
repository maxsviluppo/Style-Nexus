import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
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
            text: `Analizza questa immagine di moda per un gestionale di magazzino. Restituisci un oggetto JSON con:
            - name: nome commerciale breve (es. "Camicia Lino Coreana")
            - description: descrizione tecnica di 1 frase
            - category: una tra "Uomo", "Donna", "Bambino", "Accessori"
            - material: materiale stimato (es. "100% Cotone")
            - detected_colors: array di stringhe con i colori principali visti (es. ["Bianco", "Blu"])
            - suggested_sizes: array di stringhe suggerite per questo tipo di capo (es. ["S", "M", "L", "XL"] se è adulto, o altezze se bambino)
            
            NON usare Markdown. Solo JSON puro.`
          }
        ]
      }
    });

    const text = response.text || "{}";
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Errore analisi immagine:", error);
    return null;
  }
};
