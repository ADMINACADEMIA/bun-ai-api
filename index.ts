import Groq from "groq-sdk";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

// 1. Configuración de clientes (Asegúrate de tener las keys en .env)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cerebras = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY });

// 2. Lista de proveedores para rotar
const clients = [
  { name: "Groq", client: groq, model: "llama-3.3-70b-versatile" },
  { name: "Cerebras", client: cerebras, model: "llama3.1-8b" }
];

let turnoActual = 0;

const server = Bun.serve({
  port: process.env.PORT ?? 3007,
  async fetch(req) {
    // A. Ignorar petición de icono del navegador para no gastar turno
    if (req.url.includes("favicon.ico")) {
      return new Response(""); 
    }

    // 🔒 B. SEGURIDAD: Verificar que traiga la contraseña
    const authHeader = req.headers.get("Authorization");
    // Compara con el token que guardaste en tu archivo .env
    if (authHeader !== `Bearer ${process.env.MI_TOKEN_SECRETO}`) {
      return new Response("⛔ Acceso denegado. Falta el token de autorización.", { status: 401 });
    }

    // C. Lógica principal (Solo aceptamos GET por ahora para probar)
    if (req.method === "GET") {
      // Selección del proveedor actual
      const proveedor = clients[turnoActual];
      
      // Rotamos el turno para la siguiente petición
      turnoActual = (turnoActual + 1) % clients.length;

      try {
        console.log(`🔄 Procesando con: ${proveedor.name}`);
        
        const completion = await proveedor.client.chat.completions.create({
          // Puedes cambiar el mensaje aquí si quieres probar otras cosas
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

console.log(`🛡️ API Segura corriendo en http://localhost:${server.port}`);