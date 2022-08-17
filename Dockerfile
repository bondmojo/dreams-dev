FROM --platform=linux/amd64 node:14-alpine
WORKDIR /workspace
COPY package.json yarn.lock /workspace/
RUN yarn
COPY . .
RUN yarn build
EXPOSE 8080
CMD ["yarn", "start"]
