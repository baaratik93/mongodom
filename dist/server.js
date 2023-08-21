const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const morgan = require("morgan");
const { uid } = require("uid");
const cors = require("cors");
const port = 5200;
const app = express();

const filePath = "./public/json/users.json";

/** Parser les données */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
/**Déclarer les dossiers statiques */
app.use(express.static(path.join(__dirname, "/public")));
// Middleware pour gérer les routes non définies
app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));
app.use(cors());
/**
 * All users
 */

/**
 * Helpers **************************************************
 */

function useIdentifiant(users) {
  const id = uid();
  for (const user of users) {
    if (user.id === id) {
      useIdentifiant(users);
    } else {
      return id;
    }
  }
}
/**
 * ***********************************************************
 */
app.get("/api/users", async (req, res) => {
  try {
    res.status(200).json({
      users: JSON.parse((await fs.readFile(filePath, "utf-8")))
    });
  } catch (error) {
    console.log(error);
  }
});

/**
 * Create new user
 */
app.post("/api/users/new", async (req, res) => {
  const user = req.body;

  // Validation

  // Enrégistrement
  try {
    const users = JSON.parse((await fs.readFile(filePath, "utf-8")));
    user.id = useIdentifiant(users);
    console.log("users:", users);
    users.unshift(user);
    await fs.writeFile(filePath, JSON.stringify(users));
    res.status(201).json({ msg: "Utilisateur ajouté avec succès", users });
  } catch (error) {
    console.log(error);
  }
});

/**
 * Show one user
 */

app.get("/api/users/:id", async (req, res) => {
  const users = JSON.parse((await fs.readFile(filePath, "utf-8")));
  const user = users.find(u => u.id === req.params.id);
  user ? res.json(user) : res.status(404).json({ error: "Cet utilisateur n'existe pas" });
});

/**
 * Delete a single user
 */
app.delete("/api/users/:id/delete", async (req, res) => {
  try {
    let users = JSON.parse((await fs.readFile(filePath, "utf-8")));
    users = users.filter(u => u.id !== req.params.id);
    await fs.writeFile(filePath, JSON.stringify(users));
    res.status(200).json(users);
  } catch (error) {
    console.log(error);
  }
});

/**
 * Edit a user
 */

app.put("/api/users/:id/edit", async (req, res) => {
  const users = JSON.parse((await fs.readFile(filePath, "utf-8")));
  const user = req.body;
  const currendId = user.id || req.params.id;
  const index = users.findIndex(element => element.id === currendId);
  users[index] = user;
  await fs.writeFile(filePath, JSON.stringify(users));
  res.status(200).json(users);
});

/**
 * Control unexistant route
 */
app.use((req, res, next) => {
  const error = new Error("Route non défini");
  error.status = 404;
  next(error); // Passe l'erreur au gestionnaire d'erreurs
});

/**
 * Allow the port
 */

app.listen(port, () => console.log("le server a demarer au port " + port));