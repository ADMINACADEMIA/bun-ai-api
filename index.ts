import Groq from "groq-sdk";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

// 1. Configuración de clientes
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cerebras = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY });

// 2. Lista de proveedores para rotar
const clients = [
  { name: "Groq", client: groq, model: "llama-3.3-70b-versatile" },
  { name: "Cerebras", client: cerebras, model: "llama3.1-8b" }
];

let turnoActual = 0;

const server = Bun.serve({
  port: process.env.PORT ?? 3000,
  async fetch(req) {
    // A. Ignorar petición de icono
    if (req.url.includes("favicon.ico")) {
      return new Response(""); 
    }

    // 🔒 B. SEGURIDAD: Verificar Token
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.MI_TOKEN_SECRETO}`) {
      return new Response("⛔ Acceso denegado. Falta el token de autorización.", { status: 401 });
    }

    // C. Lógica principal
    if (req.method === "GET") {
      const proveedor = clients[turnoActual];
      turnoActual = (turnoActual + 1) % clients.length;

      try {
        console.log(`🔄 Procesando con: ${proveedor.name}`);
        const completion = await proveedor.client.chat.completions.create({
          messages: [{ role: "user", content: "Dime una frase corta sobre tecnología." }],
          model: proveedor.model,
        });
        const respuesta = completion.choices[0]?.message?.content || "Sin respuesta";
        return new Response(`[🔒 Seguro | Responde: ${proveedor.name}] \n\n${respuesta}`);
      } catch (error) {
        return new Response(`Error con ${proveedor.name}: ${error}`, { status: 500 });
      }
    }
    return new Response("Método no permitido", { status: 405 });
  },
});

console.log(`🛡️ API Segura corriendo en puerto ${server.port}`);