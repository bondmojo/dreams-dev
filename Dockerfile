FROM --platform=linux/amd64 node:18-alpine
WORKDIR /workspace
COPY package.json yarn.lock /workspace/
RUN yarn
COPY . .
RUN yarn run migration:run
RUN yarn build
EXPOSE 8080
CMD ["yarn", "start"]
