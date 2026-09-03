require("dotenv").config();

const express = require("express");
const connectDB = require("./Config/db");
const customerRoutes = require("./Routes/CustomerRoutes");
const accountRoutes = require("./Routes/AccountRoutes");
const bankingRoutes = require("./Routes/BankingRoutes");
const transactionRoutes = require("./Routes/TransactionRoutes");
const authRoutes = require("./Routes/AuthRoutes");
const fintechRoutes = require("./Routes/FintechRoutes");
const providerOperationRoutes = require("./Routes/ProviderOperationRoutes");
const errorHandler = require("./Middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HD Microfinance backend is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    uptime: process.uptime(),
  });
});

app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/fintech", fintechRoutes);
app.use("/api", providerOperationRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/banking", bankingRoutes);
app.use("/api/transactions", transactionRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
