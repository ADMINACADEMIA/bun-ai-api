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
  port: process.env.PORT ?? 3000,
  async fetch(req) {
    if (req.url.includes("favicon.ico")) return new Response("");

    // 1. SEGURIDAD
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.MI_TOKEN_SECRETO}`) {
      return new Response("⛔ Acceso denegado.", { status: 401 });
    }

    // 2. LEER LA PREGUNTA DEL CLIENTE (¡Nuevo!)
    const url = new URL(req.url);
    const mensajeUsuario = url.searchParams.get("mensaje") || "Hola, preséntate brevemente.";

    if (req.method === "GET") {
      const proveedor = clients[turnoActual];
      turnoActual = (turnoActual + 1) % clients.length;

      try {
        console.log(`🔄 Turno: ${proveedor.name} | Pregunta: ${mensajeUsuario}`);
        
        const completion = await proveedor.client.chat.completions.create({
          // Aquí inyectamos lo que llegó por la URL
          messages: [{ role: "user", content: mensajeUsuario }],
          model: proveedor.model,
        });

        const respuesta = completion.choices[0]?.message?.content || "";
        return new Response(respuesta); // Devolvemos solo la respuesta limpia para Make/n8n
        
      } catch (error) {
        return new Response(`Error: ${error}`, { status: 500 });
      }
    }
    return new Response("Método no permitido", { status: 405 });
  },
});

console.log(`🚀 API Dinámica lista en puerto ${server.port}`);