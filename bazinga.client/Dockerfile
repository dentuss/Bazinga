FROM node:20-alpine AS build
ARG BUILD_MODE=production
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --mode ${BUILD_MODE}

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
