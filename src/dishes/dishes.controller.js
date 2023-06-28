const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({ data: dishes });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`,
    });
  };
}

function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (Number.isInteger(price) && price > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0",
  });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: "No dish found",
  });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function dishIdMatchesDataId(req, res, next) {
  const { data: { id } = {} } = req.body;
  const dishId = req.params.dishId;
  if (id !== "" && id !== dishId && id !== null && id !== undefined) {
    next({
      status: 400,
      message: `id ${id} must match dataId provided in parameters`,
    });
  }
  return next();
}

function update(req, res) {
  const dishId = req.params.dishId;
  const matchingDish = dishes.find((dish) => dish.id === dishId);
  const { data: { name, description, price, image_url } = {} } = req.body;
  matchingDish.description = description;
  matchingDish.name = name;
  matchingDish.price = price;
  matchingDish.image_url = image_url;
  res.json({ data: matchingDish });
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValid,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    dishIdMatchesDataId,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValid,
    update,
  ],
};
