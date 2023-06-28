const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: orders });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

function dishQuantityIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  for (i = 0; i < dishes.length; i++) {
    const quantity = dishes[i].quantity;
    if (
      quantity === undefined ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function dishesIsValid(req, res, next) {
  // Dishes property retrieved from request.body
  const { data: { dishes } = {} } = req.body;
  // Property is checked for length and being an array
  if (dishes.length > 0 && Array.isArray(dishes)) {
    next();
  } else {
    // If the validation fails, a 400 error is returned
    next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes, quantity } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
    quantity: quantity,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function orderIdMatchesDataId(req, res, next) {
  const { data: { id } = {} } = req.body;
  const orderId = req.params.orderId;
  if (id !== "" && id !== orderId && id !== null && id !== undefined) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  return next();
}

function updateValidation(req, res, next) {
  const { data: { id, status } = {} } = req.body;
  const orderId = req.params.orderId;

  // Validate id property
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }

  // Validate status property
  if (!status || status === "invalid") {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }

  const matchingOrder = orders.find((order) => order.id === orderId);

  if (matchingOrder.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }

  next();
}

function update(req, res, next) {
  const orderId = req.params.orderId;
  const matchingOrder = orders.find((order) => order.id === orderId);
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  matchingOrder.deliverTo = deliverTo;
  matchingOrder.mobileNumber = mobileNumber;
  matchingOrder.status = status;
  matchingOrder.dishes = dishes;

  res.json({ data: matchingOrder });
}

function destroyValidation(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);

  const order = orders[index];
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }

  res.locals.order = order;
  next();
}

function deleteNotFound(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (!foundOrder) {
       next({
      status: 404,
      message: `Order ${orderId} not found`,
    });
    }
    next()
  }

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsValid,
    dishQuantityIsValid,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    orderIdMatchesDataId,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsValid,
    dishQuantityIsValid,
    updateValidation,
    update,
  ],
  delete: [deleteNotFound, destroyValidation, destroy],
};
