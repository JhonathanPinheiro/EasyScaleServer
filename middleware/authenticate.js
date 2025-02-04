const jwt = require('jsonwebtoken')
require('dotenv').config()

const authenticate = (req, res, next) => {
  const tokenHeader = req.header('Authorization')

  if (!tokenHeader) {
    return res
      .status(401)
      .json({ msg: 'Acesso negado! Nenhum token fornecido.' })
  }

  const token = tokenHeader.replace('Bearer ', '')

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // Adiciona o user decodificado à requisição
    next()
  } catch (error) {
    // Verificando tipos específicos de erro
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ msg: 'Token expirado.' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ msg: 'Token inválido.' })
    }
    return res
      .status(500)
      .json({ msg: 'Erro ao autenticar o token.', error: error.message })
  }
}

module.exports = authenticate
