const express = require("express");
const router = express.Router();


const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const {
  dashboard,
  excluirUsuario
} = require("../controllers/adminController");

router.delete(
  "/usuarios/:id",
  authMiddleware,
  adminMiddleware,
  excluirUsuario
);

// Dashboard do administrador
router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  dashboard
);

module.exports = router;