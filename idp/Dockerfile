FROM node:19

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install --prod

# Bundle app source
COPY database.js .
COPY idp.js .
COPY index.js .

EXPOSE 6001
CMD [ "node", "index.js" ]
