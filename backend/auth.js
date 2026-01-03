import crypto from "crypto";

export const generateAdminToken = () => {
  return crypto.randomBytes(32).toString("hex");
}

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const requireAdmin = (req, res, next) => {
  const token = req.get("X-Admin-Token");
  if (!token) {
    return res.status(401).send("Missing admin token");
  }

  const tokenHash = hashToken(token);

  const admin = db.prepare(
    "SELECT id FROM admins WHERE token_hash = ?"
  ).get(tokenHash);

  if (!admin) {
    return res.status(403).send("Invalid admin token");
  }

  req.adminId = admin.id;
  next();
}