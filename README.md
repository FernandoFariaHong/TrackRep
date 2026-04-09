# TrackRep API
Primeira funcionalidade do sistema TrackRep.

## Descrição
Esta API permite registrar treinos de musculação, armazenando informações como exercício, carga, repetições, séries e data.


## Tecnologias
Node.js
Express

## Funcionalidades implementadas
- Registrar treino (POST /treinos)
- Listar treinos (GET /treinos)
- Deletar treino (DELETE /treinos/:id)
- (IDs gerados aleatoriamente, não seguindo sequência por exemplo 1,2,3...)

## Como rodar o projeto
1. Instalar dependências:
npm install
2. Iniciar o servidor:
node server.js
3. A API estará disponível em:
http://localhost:3000

## Estrutura do projeto
server.js → lógica da API  
treinos.json → armazenamento dos dados  
package.json → configuração do projeto

## BackEnd
Backend desenvolvido em Node.js com Express e MySQL, os Endpoints são criados usando a extensão (Thunder Client no VsCode).
Endpoints disponíveis:

GET /treinos
POST /treinos
DELETE /treinos/:id
O banco pode ser recriado executando o script database.sql.

## Autor
Fernando Faria Hong
