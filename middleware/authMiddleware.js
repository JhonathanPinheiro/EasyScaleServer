const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const token = req.cookies.token // 🍪 Pegando o token do cookie

  if (!token) {
    return res.status(401).json({ msg: 'Acesso negado! Token não encontrado.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.id
    next()
  } catch (error) {
    return res.status(403).json({ msg: 'Token inválido!' })
  }
}
