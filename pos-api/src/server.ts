import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
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

// Real (production-shape) CORS -- the frontend calls this API's actual URL directly,
// no dev proxy in between. Auth is a Bearer token in the Authorization header, not a
// cookie, so `credentials: true` isn't needed here -- add it only if this ever moves
// to httpOnly-cookie auth, and then FRONTEND_URL must stay a single exact origin
// (can't be "*") for the browser to accept it.
//
// @fastify/cors defaults `methods` to just 'GET,HEAD,POST' -- routes/*.ts use all five
// verbs (app.put/patch/delete besides get/post), so without this the browser's preflight
// blocks every PUT/PATCH/DELETE call (e.g. PATCH /employees/:id) before it ever reaches
// the route, even though the route itself is registered and works fine from curl/Postman.
app.register(cors, {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
});

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
