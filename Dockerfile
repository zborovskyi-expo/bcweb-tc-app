#FROM node:boron

# Create app directory
#RUN mkdir -p /usr/src/app
#WORKDIR /usr/src/app

# Install app dependencies
#COPY package.json /usr/src/app/
#RUN npm install

# Bundle app source
#COPY . /usr/src/app

#EXPOSE 8080
#CMD [ "npm", "start" ]

FROM node:latest

RUN mkdir -p /usr/src/app
RUN cd /user/src/app 
RUN git clone https://github.com/zborovskyi-expo/bcweb-tc-app

RUN npm install

WORKDIR /usr/src/app
EXPOSE 8080
CMD [ "npm", "start" ]