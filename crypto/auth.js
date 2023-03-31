const express = require("express");
const fs = require("fs");
const crypto = require("crypto");

const key_private = fs.readFileSync("./crypto/nmemonica_private.pem", "utf8");
const key_public = fs.readFileSync("./crypto/nmemonica_public.pem", "utf8");

const key = {
  private: crypto.createPrivateKey({ key: key_private }),
  public: crypto.createPublicKey({ key: key_public }),
};

const app = express();
const port = 3000;
const path = "/dev_auth";

app.get(path, (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  const { q, tl } = req.query;
  const message = JSON.stringify({ q, tl });

  const signature = crypto.sign(null, Buffer.from(message), key.private);

  const sigString = signature.toString("hex");
  console.log(JSON.stringify({ message, sigString })+"\n");

  return res.status(200).json({ auth: sigString });
});

app.listen(port, () => {
  console.log("Development authentication service");
  console.log(JSON.stringify({ path, port }) + "\n\n");
});
