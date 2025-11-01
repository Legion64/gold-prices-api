FROM node:24-alpine
LABEL authors="melih.budak"

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

CMD ["node", "main.js"]
