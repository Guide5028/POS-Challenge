import "dotenv/config";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import saleRoutes from "./routes/sale.routes";
import refundRoutes from "./routes/refund.routes";
import promotionRoutes from "./routes/promotion.routes";
import categoryRoutes from "./routes/category.routes";
import oauthRoutes from "./routes/oauth.routes";
import employeeRoutes from "./routes/employee.routes";

const app = Fastify({ logger: true });

app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 }, // matches the storage bucket's own 5MB limit
});

app.register(authRoutes, { prefix: "/api/auth" });
app.register(oauthRoutes, { prefix: "/api/auth" });
app.register(productRoutes, { prefix: "/api/products" });
app.register(saleRoutes, { prefix: "/api/sales" });
app.register(refundRoutes, { prefix: "/api/refunds" });
app.register(promotionRoutes, { prefix: "/api/promotions" });
app.register(categoryRoutes, { prefix: "/api/categories" });
app.register(employeeRoutes, { prefix: "/api/employees" });

const port = Number(process.env.PORT) || 3000;

app.listen({ port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
