FROM node:16
RUN apt-get update
RUN apt-get install -y libxml2-utils
RUN mkdir /app
ADD ./packages /app/packages
COPY package.json package-lock.json turbo.json /app/
WORKDIR /app
RUN npm install
RUN npm run build
CMD ["npm", "run", "test"]