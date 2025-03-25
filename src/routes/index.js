const express = require('express');
const IndexController = require('../controllers/index');

const router = express.Router();
const indexController = new IndexController();

function setRoutes(app) {
    router.get('/', indexController.renderIndex.bind(indexController));
    app.use('/', router);
}

module.exports = setRoutes;