const server = Bun.serve({
    port: process.env.PORT ?? 3005,
    async fetch(req){
        return new Response ("API de Bun esta funcionando correctamente");
    }
})

console.log(`Server is running on ${server.url}:${server.port}`);