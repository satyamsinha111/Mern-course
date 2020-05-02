const Product = require("../models/product");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");


exports.getProductById = (req, res, next, id) => {
    Product.findById(id).exec((err, product) => {
        if (err || !product) {
            return res.status(400).json({
                error: "Product not found"
            })
        }
        req.product = product;
        next();
    })
}

exports.createProduct = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, file) => {
        if (err) {
            return res.status(400).json({
                error: "Problem with file"
            })
        }
        //destructure the fields
        const { name, description, price, category, stock } = fields;

        if (!name ||
            !description ||
            !price ||
            !category ||
            !stock
        ) {
            return res.status(400).json({
                error: "Please include all the fields"
            })
        }

        //TODO: restrictions on field
        let product = new Product(fields);

        if (file.photo) {
            if (file.photo.size > 3000000) {
                return res.status(400).json({
                    error: "File size too big"
                })
            }
            product.photo.data = fs.readFileSync(file.photo.path);
            product.photo.contentType = file.photo.type;

        }


        //save photos to the database
        product.save((err, product) => {
            if (err) {
                return res.status(400).json({
                    error: "Product not saved"
                })
            }
            return res.json(product);
        })

    })
}

exports.getProduct = (req, res) => {
    res.product.photo = undefined;
    return res.json(req.product);
}

exports.photo = (req, res, next) => {
    if (req.product.photo.data) {
        res.set("Content-Type", req.product.photo.contentType);
        return res.send(req.product.photo.data);
    }
    next();
}

exports.deleteProduct = (req, res) => {
    let product = req.product;
    product.remove((err, deletedProduct) => {
        if (err) {
            return res.status(400).json({
                error: "Failed to delete product"
            })
        }

        return res.json({
            message: "Deletion success"
        })
    })
}

exports.updateProduct = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, file) => {
        if (err) {
            return res.status(400).json({
                error: "Problem with file"
            })
        }
        let product = req.product;
        product = _.extend(product, fields);

        if (file.photo) {
            if (file.photo.size > 3000000) {
                return res.status(400).json({
                    error: "File size too big"
                })
            }
            product.photo.data = fs.readFileSync(file.photo.path);
            product.photo.contentType = file.photo.type;

        }


        //save photos to the database
        product.save((err, product) => {
            if (err) {
                return res.status(400).json({
                    error: "Updation failed"
                })
            }
            return res.json(product);
        })

    })
}

exports.getAllProducts = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 8;
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
    Product.find()
        .select("-photo")
        .populate("category")
        .sort([
            [sortBy, "asc"]
        ])
        .limit(limit)
        .exec((err, products) => {
            if (err) {
                return res.status(400).json({
                    error: "No product found"
                })
            }
            res.json(products)
        })
}


exports.updateStock = (req, res, next) => {
    let myOperations = req.body.order.products.map(prod => {
        return {
            updateOne: {
                filter: {
                    _id: product._id
                },
                update: {
                    $inc: { stock: -prod.count, sold: +prod.count }
                }
            }
        }
    });

    Product.bulkWrite(myOperations, {}, (err, product) => {
        if (err) {
            return res.status(400).json({
                error: "Bulk operation failed"
            })
        }
        next();
    })

}


exports.getAllUniqueCategories = (req, res) => {

    Product.distinct("category", {}, (err, category) => {
        if (err) {
            return res.status(400).json({
                error: "Category no found"
            })
        }

        return res.json(category);
    })

}