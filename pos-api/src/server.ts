import Fastify from "fastify";

const app = Fastify({ logger: true });

// TODO: app.register(authRoutes)
// TODO: app.register(productRoutes)
// TODO: app.register(saleRoutes)
// TODO: app.register(refundRoutes)

app.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
