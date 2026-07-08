import "dotenv/config";
import Fastify from "fastify";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import saleRoutes from "./routes/sale.routes";
import refundRoutes from "./routes/refund.routes";

const app = Fastify({ logger: true });

app.register(authRoutes, { prefix: "/api/auth" });
app.register(productRoutes, { prefix: "/api/products" });
app.register(saleRoutes, { prefix: "/api/sales" });
app.register(refundRoutes, { prefix: "/api/refunds" });

const port = Number(process.env.PORT) || 3000;

app.listen({ port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
