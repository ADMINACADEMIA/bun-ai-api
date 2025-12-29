import Groq from "groq-sdk";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cerebras = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY });

const clients = [
  { name: "Groq", client: groq, model: "llama-3.3-70b-versatile" },
  { name: "Cerebras", client: cerebras, model: "llama3.1-8b" }
];

let turnoActual = 0;

const server = Bun.serve({
  port: process.env.PORT ?? 3007,
  async fetch(req) {
    // 🛑 TRUCO NUEVO: Si es el icono, no hacemos nada ni gastamos turno
    if (req.url.includes("favicon.ico")) {
      return new Response(""); 
    }

    if (req.method === "GET") {
      const proveedor = clients[turnoActual];
      
      // Avanzamos el turno
      turnoActual = (turnoActual + 1) % clients.length;

      try {
        console.log(`🔄 Turno visible: ${proveedor.name}`);
        
        const completion = await proveedor.client.chat.completions.create({
          messages: [{ role: "user", content: "Dime una frase motivadora corta." }],
          model: proveedor.model,
        });

        const respuesta = completion.choices[0]?.message?.content || "Sin respuesta";
        return new Response(`[Responde: ${proveedor.name}] \n\n${respuesta}`);
        
      } catch (error) {
        return new Response(`Error con ${proveedor.name}: ${error}`);
      }
    }
    return new Response("Método no permitido", { status: 405 });
  },
});

console.log(`🚀 API Corregida corriendo en http://localhost:${server.port}`);