import { Router } from "express";
import productsRouter, { categoriesRouter } from "./products.js";
import cartRouter from "./cart.js";
import ordersRouter from "./orders.js";
import authRouter from "./auth.js";
import sellerRouter from "./seller.js";
import sellersRouter from "./sellers.js";
import addressesRouter from "./addresses.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "krishibazaar-api", time: new Date().toISOString() });
});

router.use("/products", productsRouter);
router.use("/categories", categoriesRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/auth", authRouter);
router.use("/seller", sellerRouter);
router.use("/sellers", sellersRouter);
router.use("/addresses", addressesRouter);

export default router;
