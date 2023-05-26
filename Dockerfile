FROM node:latest

COPY package.json index.js /opt/fileserver/
COPY static /opt/fileserver/static

WORKDIR /opt/fileserver

RUN npm install
ENV ROOTFOLDER=/www


EXPOSE 3000
ENTRYPOINT ["node", "index.js"]