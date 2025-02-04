
# EasyScaleServer

Este é o servidor backend da aplicação **EasyScale**. A API foi construída usando **Node.js**, **Express**, **MongoDB**, e implementa autenticação com **JWT**. Ela fornece funcionalidades para cadastro, login de usuários, e gerenciamento de **tags** e **todos**.

## Tecnologias Utilizadas

-   **Node.js**: Plataforma de backend para execução do código JavaScript no servidor.
-   **Express.js**: Framework minimalista para construção de APIs RESTful.
-   **MongoDB**: Banco de dados NoSQL usado para armazenar os dados de usuários, tags e todos.
-   **JWT (JSON Web Tokens)**: Autenticação via tokens para garantir segurança e persistência das sessões.
-   **Bcrypt.js**: Para hash e comparação segura de senhas.
-   **Helmet**: Middleware para aumentar a segurança das aplicações Express, configurando cabeçalhos HTTP de segurança.
-   **Express Rate Limit**: Middleware para limitar a quantidade de requisições feitas em um determinado período, prevenindo abuso e ataques de força bruta.

## Pré-requisitos

-   **Node.js** instalado (recomendado versão 16 ou superior).
-   **MongoDB** (você pode usar uma instância local ou uma instância na nuvem, como o MongoDB Atlas).
-   **Variáveis de ambiente** configuradas, como o `MONGODB_URI` e `JWT_SECRET`.

## Instalação

1.  Clone o repositório:



    `git clone https://github.com/seu-usuario/EasyScaleServer.git
    cd EasyScaleServer` 

2.  Instale as dependências:



    `npm install` 

3.  Crie um arquivo `.env` na raiz do projeto e adicione as variáveis de ambiente:

plaintext


    `MONGODB_URI=seu_uri_do_mongodb
    JWT_SECRET=sua_chave_secreta_para_jwt
    PORT=5000 # ou outra porta de sua escolha` 

4.  Execute o servidor com o seguinte comando:



    `npm run dev` 

Agora, a API estará rodando em `http://localhost:5000`.

## Endpoints

### **Autenticação**

#### **POST** `/api/auth/register`

Cria um novo usuário.

**Body:**


    `{
      "name": "Nome do Usuário",
      "email": "email@exemplo.com",
      "password": "senha",
      "confirmPassword": "senha"
    }` 

**Resposta:**


    `{
      "id": "ID do usuário",
      "name": "Nome do Usuário",
      "email": "email@exemplo.com"
    }` 

#### **POST** `/api/auth/login`

Realiza o login de um usuário e retorna um token JWT.

**Body:**


    `{
      "email": "email@exemplo.com",
      "password": "senha"
    }` 

**Resposta:**


    `{
      "msg": "Login realizado com sucesso!",
      "token": "seu_token_jwt",
      "user": {
        "id": "ID do usuário",
        "name": "Nome do Usuário",
        "email": "email@exemplo.com"
      }
    }` 

### **Usuários**

#### **DELETE** `/api/users/delete/:id`

Deleta um usuário com base no ID fornecido.

**Resposta:**


    `{
      "msg": "Usuário deletado com sucesso!",
      "deletedUser": {
        "id": "ID do usuário",
        "name": "Nome do Usuário",
        "email": "email@exemplo.com"
      }
    }` 

#### **PUT** `/api/users/update/:id`

Atualiza informações do usuário (exemplo: nome e email).

**Body:**


    `{
      "name": "Novo Nome",
      "email": "novoemail@exemplo.com"
    }` 

**Resposta:**


    `{
      "msg": "Usuário atualizado com sucesso!",
      "updatedUser": {
        "id": "ID do usuário",
        "name": "Novo Nome",
        "email": "novoemail@exemplo.com"
      }
    }` 

### **Tags**

#### **GET** `/api/auth/tags`

Retorna todas as tags.

**Resposta:**


    `[
      {
        "_id": "ID da tag",
        "name": "Tag 1"
      },
      {
        "_id": "ID da tag",
        "name": "Tag 2"
      }
    ]` 

#### **POST** `/api/auth/tags`

Cria uma nova tag.

**Body:**


    `{
      "name": "Nome da Tag"
    }` 

**Resposta:**


    `{
      "_id": "ID da tag",
      "name": "Nome da Tag"
    }` 

#### **DELETE** `/api/auth/tags/delete/:id`

Deleta uma tag com base no ID.

**Resposta:**


    `{
      "msg": "Tag deletada com sucesso!",
      "deletedTag": {
        "_id": "ID da tag",
        "name": "Nome da Tag"
      }
    }` 

## Middlewares

-   **Autenticação (JWT)**: O middleware `authenticate` verifica se o token JWT enviado nas requisições está válido. Caso contrário, o acesso é negado.
-   **Helmet**: Protege o servidor contra vulnerabilidades conhecidas, configurando cabeçalhos de segurança.
-   **Express Rate Limit**: Limita o número de requisições feitas por um usuário em um intervalo de tempo, evitando abusos.

## Contribuição

Se você quiser contribuir para o projeto, fique à vontade para abrir uma _pull request_. Para problemas, crie uma _issue_.

