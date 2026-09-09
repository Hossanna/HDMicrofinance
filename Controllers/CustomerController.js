const Customer = require("../Models/Customer");
const Account = require("../Models/Account");
const asyncHandler = require("../Middleware/asyncHandler");
const ApiError = require("../Utils/apiError");
const nibssByPhoenix = require("../Services/nibssByPhoenixService");
const identityController = require("./IdentityController");

const onboardCustomer = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    middleName,
    email,
    phone,
    kycType,
    kycID,
    dob,
    gender,
    address,
    metadata,
  } = req.body;

  if (!firstName || !lastName || !dob) {
    throw new ApiError("firstName, lastName and dob are required", 400);
  }

  if (!kycType || !kycID) {
    throw new ApiError(
      "kycType and kycID are required before account creation",
      400,
    );
  }

  const existingCustomer = await Customer.findOne({ phone });
  if (existingCustomer) {
    throw new ApiError("A customer with this phone number already exists", 409);
  }

  const customer = await Customer.create({
    firstName,
    lastName,
    middleName,
    email,
    phone,

    nin: kycType === "nin" ? kycID : undefined,
    bvn: kycType === "bvn" ? kycID : undefined,

    kycType,
    kycID,
    dob,
    gender,
    address,
    metadata,
  });

  const customerDetails = await customer.save();

  res.status(201).json({
    success: true,
    message: "Customer onboarded successfully",
    data: {
      customer,
    },
    provider: customerDetails,
    responseBody: customerDetails,
  });
});

const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    count: customers.length,
    data: customers,
  });
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new ApiError("Customer not found", 404);
  }

  const accounts = await Account.find({ customer: customer._id });

  res.json({
    success: true,
    data: {
      customer,
      accounts,
    },
  });
});

module.exports = {
  onboardCustomer,
  getCustomers,
  getCustomer,
};
