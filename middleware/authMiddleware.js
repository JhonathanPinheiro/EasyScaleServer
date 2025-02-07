const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ msg: 'Token não fornecido!' })
  }

  const token = authHeader.split(' ')[1] // Pega somente o token (ignora "Bearer")

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.id // Adiciona o ID do usuário ao req
    next()
  } catch (error) {
    return res.status(401).json({ msg: 'Token inválido!' })
  }
}
